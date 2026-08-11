import asyncio
from io import BytesIO
from fastapi import APIRouter, Depends, UploadFile, File, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession
from shared.deps import get_current_user, get_db_for_current_user
from shared.models.user import User
from cv.repository import CvRepository
from cv.schemas import (
    CvSectionResponse,
    CvSectionUpdate,
    CvAllSectionsResponse,
    CvParseRequest,
    CvParseResponse,
    CvTranslateRequest,
    CvTranslateResponse,
    CvAcceptRequest,
    CvExportPdfRequest,
    CvExportDocxRequest,
)
from cv.service import parse_cv_text, translate_fields

router = APIRouter(prefix="/cv", tags=["cv"])

SECTIONS = [
    "summary", "experience", "education", "skills", "languages",
    "certifications", "projects", "volunteer", "awards", "publications",
    "references", "other",
]


@router.get("/sections", response_model=list[CvSectionResponse])
async def get_sections(user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db_for_current_user)):
    repo = CvRepository(db)
    sections = await repo.get_all_sections(user.user_id)
    return [CvSectionResponse.model_validate(s) for s in sections]


@router.put("/sections/{section}", response_model=CvSectionResponse)
async def upsert_section(
    section: str,
    body: CvSectionUpdate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_for_current_user),
):
    if section not in SECTIONS:
        raise HTTPException(status_code=400, detail="Invalid section")

    repo = CvRepository(db)
    result = await repo.upsert_section(
        user.user_id, section,
        content_en=body.content_en,
        content_es=body.content_es,
    )
    return CvSectionResponse.model_validate(result)


@router.get("/all", response_model=CvAllSectionsResponse)
async def get_all_cv(user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db_for_current_user)):
    repo = CvRepository(db)
    sections = await repo.get_all_sections(user.user_id)
    upload = await repo.get_latest_upload(user.user_id)

    sections_map = {}
    title = {"en": "", "es": ""}
    contact = {"en": "", "es": ""}
    for s in sections:
        if s.section == "title":
            title = {"en": s.content_en or "", "es": s.content_es or ""}
        elif s.section == "contact":
            contact = {"en": s.content_en or "", "es": s.content_es or ""}
        else:
            sections_map[s.section] = {"en": s.content_en or "", "es": s.content_es or ""}

    return CvAllSectionsResponse(
        name="",
        title=title,
        contact=contact,
        sections=sections_map,
    )


MAX_SIZE = 5 * 1024 * 1024
MIN_SIZE = 20 * 1024
MAX_TEXT_LENGTH = 20_000


def is_valid_file(contents: bytes) -> bool:
    pdf_signature = contents[:4] == b"%PDF"
    docx_signature = contents[:4] == b"PK\x03\x04"
    return pdf_signature or docx_signature


@router.post("/upload")
async def upload_cv(
    file: UploadFile = File(...),
    user: User = Depends(get_current_user),
):
    contents = await file.read()
    if len(contents) > MAX_SIZE:
        raise HTTPException(status_code=413, detail="File too large (max 5MB)")

    if len(contents) < MIN_SIZE:
        raise HTTPException(status_code=400, detail="File too small (min 20KB)")

    if not is_valid_file(contents):
        raise HTTPException(status_code=415, detail="Unsupported file type. Use PDF or DOCX.")

    if contents[:4] == b"%PDF":
        import pdfplumber

        def extract_pdf() -> str:
            with pdfplumber.open(BytesIO(contents)) as pdf:
                return "\n".join(page.extract_text() or "" for page in pdf.pages)

        text = await asyncio.to_thread(extract_pdf)
    else:
        from docx import Document

        def extract_docx() -> str:
            doc = Document(BytesIO(contents))
            return "\n".join(p.text for p in doc.paragraphs)

        text = await asyncio.to_thread(extract_docx)

    return {"text": text[:MAX_TEXT_LENGTH]}


@router.post("/accept")
async def accept_cv(
    body: CvAcceptRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_for_current_user),
):
    repo = CvRepository(db)

    upload = await repo.create_upload(
        user.user_id,
        file_url="",
        file_name=body.file_name,
        extracted_text=body.extracted_text[:MAX_TEXT_LENGTH],
    )

    for s in body.sections:
        await repo.upsert_section(
            user.user_id,
            s.section,
            content_en=s.content_en or "",
            content_es=s.content_es or "",
        )

    return {"ok": True, "upload_id": str(upload.id)}


@router.post("/parse", response_model=CvParseResponse)
async def parse_cv(body: CvParseRequest, user: User = Depends(get_current_user)):
    result = await parse_cv_text(body.text)
    return CvParseResponse(**result)


@router.post("/translate", response_model=CvTranslateResponse)
async def translate_cv(body: CvTranslateRequest, user: User = Depends(get_current_user)):
    result = await translate_fields(body.fields, body.target_lang)
    return CvTranslateResponse(fields=result)


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
