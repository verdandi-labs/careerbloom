import asyncio
import json
import logging
from io import BytesIO

import pypdfium2 as pdfium
from docx import Document
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.shared import Pt, Inches, RGBColor
from docx2python import docx2python
from fastapi import APIRouter, Depends, File, HTTPException, Request, UploadFile
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession

from cv.repository import CvRepository
from cv.schemas import (
    CvData,
    CvEditRequest,
    CvExportDocxRequest,
    CvRawText,
    CvTranslateRequest,
    FIELD_MODELS,
    SaveVersionRequest,
    TEXT_FIELDS,
    VersionListItem,
)
from cv.service import extract_raw_text, limiter, parse_all_sections, translate_cv
from database import get_db
from shared.constants import ALLOWED_LANGUAGES
from shared.deps import get_current_user, rotated_session_headers
from shared.models.cv import CV_FIELDS
from shared.models.user import User

router = APIRouter(prefix="/cv", tags=["cv"])
logger = logging.getLogger(__name__)

MAX_SIZE = 5 * 1024 * 1024
MIN_SIZE = 20 * 1024

SUSPICIOUS = ["user_id:", "database_url", "BEGIN PRIVATE KEY", "system prompt", "ignore previous"]


def _check_suspicious(text: str) -> bool:
    lower = text.lower()
    return any(p.lower() in lower for p in SUSPICIOUS)


def is_valid_file(contents: bytes) -> bool:
    return contents[:4] in (b"%PDF", b"PK\x03\x04")


async def extract_file_text(filename: str, contents: bytes) -> str:
    if contents[:4] == b"%PDF":
        def extract_pdf() -> str:
            try:
                doc = pdfium.PdfDocument(contents)
                try:
                    pages_text = []
                    for page in doc:
                        textpage = page.get_textpage()
                        try:
                            pages_text.append(textpage.get_text_range())
                        finally:
                            textpage.close()
                            page.close()
                    return "\n\n".join(pages_text)
                finally:
                    doc.close()
            except Exception as exc:
                raise HTTPException(
                    status_code=400, detail="Invalid or corrupted PDF file"
                ) from exc

        return await asyncio.to_thread(extract_pdf)

    if contents[:4] == b"PK\x03\x04":
        def extract_docx() -> str:
            try:
                doc = docx2python(BytesIO(contents))
                try:
                    return doc.text
                finally:
                    doc.close()
            except Exception as exc:
                raise HTTPException(
                    status_code=400, detail="Invalid or corrupted DOCX file"
                ) from exc

        return await asyncio.to_thread(extract_docx)

    if filename.lower().endswith(".txt"):
        return contents.decode("utf-8", errors="ignore")

    raise HTTPException(status_code=415, detail="Unsupported file type. Use PDF, DOCX, or TXT.")


@router.post("/upload", response_model=CvRawText)
async def upload_cv(
    file: UploadFile = File(...),
    user: User = Depends(get_current_user),
):
    contents = await file.read()
    if len(contents) > MAX_SIZE:
        raise HTTPException(status_code=413, detail="File too large (max 5MB)")
    if len(contents) < MIN_SIZE:
        raise HTTPException(status_code=400, detail="File too small (min 20KB)")
    if not is_valid_file(contents) and not (file.filename or "").lower().endswith(".txt"):
        raise HTTPException(status_code=415, detail="Unsupported file type. Use PDF, DOCX, or TXT.")

    text = await extract_file_text(file.filename or "", contents)
    if not text.strip():
        raise HTTPException(status_code=400, detail="Could not read any text from the file.")

    return CvRawText(text=extract_raw_text(text))


@router.post("/save")
@limiter.limit("10/minute")
async def save_cv(
    request: Request,
    body: CvRawText,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if _check_suspicious(body.text):
        logger.warning("Suspicious CV content rejected")
        raise HTTPException(status_code=400, detail="CV content could not be processed — please check your file and try again")

    def _sse(payload: dict) -> str:
        return f"data: {json.dumps(payload)}\n\n"

    async def generate():
        try:
            yield _sse({"stage": "opening"})
            yield _sse({"stage": "reading"})
            parsed = await parse_all_sections(body.text)
            yield _sse({"stage": "almost"})

            repo = CvRepository(db)
            is_first = await repo.count_uploads(user.user_id) == 0
            await repo.create_upload(user.user_id, parsed)
            if is_first:
                user.onboarding = True

            yield _sse({"done": True})
        except Exception:
            logger.error("CV save failed", exc_info=True)
            yield _sse({"error": "Could not parse your CV, please try again"})

    return StreamingResponse(
        generate(),
        media_type="text/event-stream",
        headers=rotated_session_headers(request),
    )


@router.get("", response_model=CvData)
async def get_cv(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    repo = CvRepository(db)
    return await repo.get_current_cv(user.user_id)


@router.post("/edit", response_model=CvData)
async def edit_cv(
    body: CvEditRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if body.field not in CV_FIELDS:
        raise HTTPException(status_code=400, detail="Invalid CV field.")

    repo = CvRepository(db)
    upload = await repo.get_latest_upload(user.user_id)
    if upload is None:
        raise HTTPException(status_code=404, detail="Please upload a CV before continuing")

    if body.field in TEXT_FIELDS:
        if not isinstance(body.value, str):
            raise HTTPException(status_code=400, detail="Text field requires a string value.")
        value = body.value.strip() or None
    else:
        if not isinstance(body.value, list):
            raise HTTPException(status_code=400, detail="Structured field requires a list value.")
        item_model = FIELD_MODELS[body.field]
        try:
            value = [item_model.model_validate(item).model_dump() for item in body.value]
        except Exception:
            raise HTTPException(status_code=400, detail=f"Invalid {body.field} value.")

    await repo.create_edit(user.user_id, upload.upload_id, body.field, value)
    return await repo.get_current_cv(user.user_id)


@router.post("/translate", response_model=CvData)
@limiter.limit("5/minute")
async def translate(
    request: Request,
    body: CvTranslateRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if body.language not in ALLOWED_LANGUAGES:
        raise HTTPException(status_code=400, detail=f"Unsupported language. Supported codes: {', '.join(sorted(ALLOWED_LANGUAGES))}")

    repo = CvRepository(db)
    current = await repo.get_current_cv(user.user_id)
    if not any(current.model_dump().values()):
        raise HTTPException(status_code=400, detail="Please upload a CV before translating")

    try:
        translated = await translate_cv(current, body.language)
    except Exception:
        logger.error("CV translation failed", exc_info=True)
        raise HTTPException(status_code=500, detail="CV translation failed, please try again")
    if _check_suspicious(translated.model_dump_json()):
        logger.warning("Suspicious CV translation rejected")
        raise HTTPException(status_code=400, detail="CV content could not be processed — please check your file and try again")
    return translated


@router.post("/export/docx")
async def export_docx(body: CvExportDocxRequest, user: User = Depends(get_current_user)):
    TEMPLATE_ACCENTS = {
        "editorial": "B96A4B",
        "classic": "5C5C5C",
        "editorialBig": "3D3D3D",
        "geometric": "B47A5C",
        "soft": "E8C5D0",
    }
    accent = TEMPLATE_ACCENTS.get(body.template, "B96A4B")

    doc = Document()
    style = doc.styles["Normal"]
    style.font.name = "Calibri"
    style.font.size = Pt(11)

    data = body.data
    if data.get("name"):
        p = doc.add_paragraph()
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        run = p.add_run(data["name"])
        run.bold = True
        run.font.size = Pt(18)
        run.font.color.rgb = RGBColor.from_string(accent)

    if data.get("title"):
        p = doc.add_paragraph()
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p.add_run(data["title"]).font.size = Pt(14)

    for section_key in ["summary", "experience", "education", "skills", "languages",
                        "certifications", "projects", "volunteer", "awards", "publications",
                        "references", "other"]:
        section_data = data.get(section_key, "")
        if isinstance(section_data, dict):
            section_data = section_data.get("en", "") or section_data.get("es", "")
        if section_data:
            heading_para = doc.add_heading(section_key.replace("_", " ").title(), level=2)
            heading_para.runs[0].font.color.rgb = RGBColor.from_string(accent)
            for para in section_data.split("\n\n"):
                if para.strip():
                    doc.add_paragraph(para.strip())

    buf = BytesIO()
    await asyncio.to_thread(doc.save, buf)
    buf.seek(0)
    return StreamingResponse(
        buf,
        media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        headers={"Content-Disposition": "attachment; filename=careerBloom-cv.docx"},
    )


@router.get("/versions", response_model=list[VersionListItem])
async def list_versions(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    repo = CvRepository(db)
    versions = await repo.list_versions(user.user_id)
    return [
        VersionListItem(
            version_id=str(v.version_id),
            cv_name=v.cv_name,
            created_at=v.created_at.isoformat(),
        )
        for v in versions
    ]


@router.post("/versions", response_model=VersionListItem, status_code=201)
async def create_version(
    body: SaveVersionRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    repo = CvRepository(db)
    data = body.data if body.data is not None else await repo.get_current_cv(user.user_id)
    try:
        version = await repo.save_version(user.user_id, body.cv_name, data)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    return VersionListItem(
        version_id=str(version.version_id),
        cv_name=version.cv_name,
        created_at=version.created_at.isoformat(),
    )


@router.put("/versions/{version_id}", response_model=VersionListItem)
async def update_version(
    version_id: str,
    body: SaveVersionRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    repo = CvRepository(db)
    data = body.data if body.data is not None else await repo.get_current_cv(user.user_id)
    version = await repo.replace_version(user.user_id, version_id, body.cv_name, data)
    if version is None:
        raise HTTPException(status_code=404, detail="Version not found")
    return VersionListItem(
        version_id=str(version.version_id),
        cv_name=version.cv_name,
        created_at=version.created_at.isoformat(),
    )


@router.delete("/versions/{version_id}", status_code=204)
async def delete_version(
    version_id: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    repo = CvRepository(db)
    deleted = await repo.delete_version(user.user_id, version_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Version not found")
    return {"ok": True}
