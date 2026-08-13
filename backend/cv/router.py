import asyncio
from io import BytesIO

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession

from cv.repository import CvRepository
from cv.schemas import (
    CvData,
    CvEditRequest,
    CvExportDocxRequest,
    CvExportPdfRequest,
    CvTranslateRequest,
    FIELD_MODELS,
    TEXT_FIELDS,
)
from cv.service import extract_cv, translate_cv
from database import get_db
from shared.deps import get_current_user
from shared.models.cv import CV_FIELDS
from shared.models.user import User

router = APIRouter(prefix="/cv", tags=["cv"])

MAX_SIZE = 5 * 1024 * 1024
MIN_SIZE = 20 * 1024


def is_valid_file(contents: bytes) -> bool:
    return contents[:4] in (b"%PDF", b"PK\x03\x04")


async def extract_file_text(filename: str, contents: bytes) -> str:
    if contents[:4] == b"%PDF":
        import pdfplumber

        def extract_pdf() -> str:
            with pdfplumber.open(BytesIO(contents)) as pdf:
                return "\n".join(page.extract_text() or "" for page in pdf.pages)

        return await asyncio.to_thread(extract_pdf)

    if contents[:4] == b"PK\x03\x04":
        from docx import Document

        def extract_docx() -> str:
            doc = Document(BytesIO(contents))
            return "\n".join(p.text for p in doc.paragraphs)

        return await asyncio.to_thread(extract_docx)

    if filename.lower().endswith(".txt"):
        return contents.decode("utf-8", errors="ignore")

    raise HTTPException(status_code=415, detail="Unsupported file type. Use PDF, DOCX, or TXT.")


@router.post("/upload", response_model=CvData)
async def upload_cv(
    file: UploadFile = File(...),
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
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

    repo = CvRepository(db)
    is_first = await repo.count_uploads(user.user_id) == 0
    try:
        parsed = await extract_cv(text)
    except Exception:
        raise HTTPException(status_code=500, detail="CV extraction failed, please try uploading a cleaner file")
    await repo.create_upload(user.user_id, parsed)
    if is_first:
        user.onboarding = True
    return parsed


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
async def translate(
    body: CvTranslateRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    repo = CvRepository(db)
    current = await repo.get_current_cv(user.user_id)
    if not any(current.model_dump().values()):
        raise HTTPException(status_code=400, detail="Please upload a CV before translating")

    try:
        translated = await translate_cv(current, body.language)
    except Exception:
        raise HTTPException(status_code=500, detail="CV translation failed, please try again")
    await repo.create_translate(user.user_id, body.language, translated)
    return translated


@router.post("/export/pdf")
async def export_pdf(body: CvExportPdfRequest, user: User = Depends(get_current_user)):
    from reportlab.lib.pagesizes import letter
    from reportlab.lib.units import inch
    from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer
    from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle

    buf = BytesIO()
    doc = SimpleDocTemplate(buf, pagesize=letter, topMargin=0.75 * inch, bottomMargin=0.75 * inch,
                            leftMargin=0.75 * inch, rightMargin=0.75 * inch)
    styles = getSampleStyleSheet()
    elements = []

    if body.name:
        elements.append(Paragraph(body.name, ParagraphStyle("Name", parent=styles["Title"], fontSize=20, spaceAfter=12)))
    if body.language:
        elements.append(Paragraph(f"Language: {body.language.upper()}", styles["Normal"]))
        elements.append(Spacer(1, 12))

    for section in body.sections:
        heading = section.get("heading", "")
        body_text = section.get("body", "")
        if not body_text:
            continue
        elements.append(Paragraph(f"<b>{heading.upper()}</b>", ParagraphStyle("SectionHead", parent=styles["Heading2"], fontSize=12, spaceAfter=6)))
        for para in body_text.split("\n\n"):
            if para.strip():
                elements.append(Paragraph(para.strip().replace("\n", "<br/>"), styles["Normal"]))
                elements.append(Spacer(1, 6))

    await asyncio.to_thread(doc.build, elements)
    buf.seek(0)
    return StreamingResponse(buf, media_type="application/pdf",
                             headers={"Content-Disposition": "attachment; filename=careerBloom-cv.pdf"})


@router.post("/export/docx")
async def export_docx(body: CvExportDocxRequest, user: User = Depends(get_current_user)):
    from docx import Document
    from docx.shared import Pt, Inches
    from docx.enum.text import WD_ALIGN_PARAGRAPH

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
            doc.add_heading(section_key.replace("_", " ").title(), level=2)
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
