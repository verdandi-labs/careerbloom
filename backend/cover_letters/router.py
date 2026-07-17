from io import BytesIO
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession
from database import get_db
from shared.deps import get_current_user
from shared.models.profile import Profile
from cover_letters.repository import CoverLetterRepository
from cover_letters.schemas import (
    CoverLetterCreate,
    CoverLetterResponse,
    CoverLetterGenerateRequest,
    CoverLetterExportPdfRequest,
)
from cv.service import generate_cover_letter_ai

router = APIRouter(prefix="/cover-letters", tags=["cover-letters"])


@router.get("", response_model=list[CoverLetterResponse])
async def list_letters(user: Profile = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    repo = CoverLetterRepository(db)
    letters = await repo.get_all(user.id)
    return [CoverLetterResponse.model_validate(l) for l in letters]


@router.post("", response_model=CoverLetterResponse)
async def create_letter(
    body: CoverLetterCreate,
    user: Profile = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    repo = CoverLetterRepository(db)
    letter = await repo.create(user.id, body.job_title, body.company, body.job_description)
    return CoverLetterResponse.model_validate(letter)


@router.post("/{letter_id}/generate", response_model=CoverLetterResponse)
async def generate_letter(
    letter_id: str,
    body: CoverLetterGenerateRequest,
    user: Profile = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    from uuid import UUID
    repo = CoverLetterRepository(db)
    letter = await repo.get_by_id(user.id, UUID(letter_id))
    if not letter:
        raise HTTPException(status_code=404, detail="Cover letter not found")

    result = await generate_cover_letter_ai(
        letter.job_title,
        letter.company,
        letter.job_description or "",
        body.cv_text or "",
    )

    updated = await repo.update_content(
        user.id, letter.id,
        content_en=result.get("content_en", ""),
        content_es=result.get("content_es", ""),
    )
    return CoverLetterResponse.model_validate(updated)


@router.delete("/{letter_id}")
async def delete_letter(
    letter_id: str,
    user: Profile = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    from uuid import UUID
    repo = CoverLetterRepository(db)
    deleted = await repo.delete(user.id, UUID(letter_id))
    if not deleted:
        raise HTTPException(status_code=404, detail="Cover letter not found")
    return {"ok": True}


@router.post("/{letter_id}/export/pdf")
async def export_letter_pdf(
    letter_id: str,
    body: CoverLetterExportPdfRequest,
    user: Profile = Depends(get_current_user),
):
    from reportlab.lib.pagesizes import letter
    from reportlab.lib.units import inch
    from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer
    from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle

    buf = BytesIO()
    doc = SimpleDocTemplate(buf, pagesize=letter, topMargin=0.75 * inch, bottomMargin=0.75 * inch,
                            leftMargin=0.75 * inch, rightMargin=0.75 * inch)
    styles = getSampleStyleSheet()
    elements = []

    elements.append(Paragraph(
        f"{body.job_title} - {body.company}",
        ParagraphStyle("Header", parent=styles["Title"], fontSize=14, spaceAfter=12),
    ))

    for para in body.content.split("\n\n"):
        if para.strip():
            elements.append(Paragraph(para.strip().replace("\n", "<br/>"), styles["Normal"]))
            elements.append(Spacer(1, 8))

    doc.build(elements)
    buf.seek(0)
    slug = body.company.lower().replace(" ", "-")
    return StreamingResponse(
        buf,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename=cover-letter-{slug}.pdf"},
    )
