import logging
from io import BytesIO
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession

from career_direction.repository import CareerDirectionRepository
from cover_letters.repository import CoverLetterRepository
from cover_letters.schemas import (
    CoverLetterGenerateRequest,
    CoverLetterResponse,
    SaveCoverLetterRequest,
)
from cv.service import generate_cover_letter_ai, limiter
from shared.crypto import decrypt, decrypt_user_key
from shared.deps import get_current_user, get_db_for_current_user
from shared.models.user import User

router = APIRouter(prefix="/cover-letters", tags=["cover-letters"])
logger = logging.getLogger(__name__)


@router.post("/generate", response_model=CoverLetterResponse)
@limiter.limit("5/minute")
async def generate_letter(
    request: Request,
    body: CoverLetterGenerateRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_for_current_user),
):
    try:
        career_direction = None
        try:
            cd_repo = CareerDirectionRepository(db)
            latest_cd = await cd_repo.get_latest(user.user_id)
            if latest_cd:
                user_key = decrypt_user_key(user.encryption_key)
                career_direction = decrypt(latest_cd.summary, user_key)
        except Exception:
            logger.exception("Failed to load career direction for cover letter")

        text = await generate_cover_letter_ai(
            body.job_title,
            body.company,
            (body.job_description or "")[:5_000],
            body.context or "",
            career_direction=career_direction,
        )
    except Exception:
        logger.error("Cover letter generation failed", exc_info=True)
        raise HTTPException(
            status_code=500, detail="Cover letter generation failed, please try again"
        )
    repo = CoverLetterRepository(db)
    letter = await repo.create(user.user_id, body.name, text)
    return CoverLetterResponse.model_validate(letter)


@router.post("/save", response_model=CoverLetterResponse)
async def save_letter(
    body: SaveCoverLetterRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_for_current_user),
):
    repo = CoverLetterRepository(db)
    letter = await repo.create(user.user_id, body.name, body.text)
    return CoverLetterResponse.model_validate(letter)


@router.get("", response_model=list[CoverLetterResponse])
async def list_letters(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_for_current_user),
):
    repo = CoverLetterRepository(db)
    letters = await repo.get_all(user.user_id)
    return [CoverLetterResponse.model_validate(l) for l in letters]


@router.delete("/{letter_id}")
async def delete_letter(
    letter_id: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_for_current_user),
):
    try:
        parsed = UUID(letter_id)
    except ValueError:
        raise HTTPException(status_code=404, detail="Cover letter not found")

    repo = CoverLetterRepository(db)
    deleted = await repo.delete(user.user_id, parsed)
    if not deleted:
        raise HTTPException(status_code=404, detail="Cover letter not found")
    return {"ok": True}


@router.post("/{letter_id}/export/pdf")
async def export_letter_pdf(
    letter_id: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_for_current_user),
):
    import asyncio

    from reportlab.lib.pagesizes import letter
    from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
    from reportlab.lib.units import inch
    from reportlab.platypus import Paragraph, SimpleDocTemplate, Spacer

    try:
        parsed = UUID(letter_id)
    except ValueError:
        raise HTTPException(status_code=404, detail="Cover letter not found")

    repo = CoverLetterRepository(db)
    letter_model = await repo.get_by_id(user.user_id, parsed)
    if not letter_model:
        raise HTTPException(status_code=404, detail="Cover letter not found")

    buf = BytesIO()
    doc = SimpleDocTemplate(
        buf,
        pagesize=letter,
        topMargin=0.75 * inch,
        bottomMargin=0.75 * inch,
        leftMargin=0.75 * inch,
        rightMargin=0.75 * inch,
    )
    styles = getSampleStyleSheet()
    elements = []

    if letter_model.name:
        elements.append(
            Paragraph(
                letter_model.name,
                ParagraphStyle(
                    "Header",
                    parent=styles["Title"],
                    fontSize=16,
                    spaceAfter=10,
                ),
            )
        )

    for para in letter_model.text.split("\n\n"):
        if para.strip():
            elements.append(
                Paragraph(para.strip().replace("\n", "<br/>"), styles["Normal"])
            )
            elements.append(Spacer(1, 8))

    await asyncio.to_thread(doc.build, elements)
    buf.seek(0)
    slug = (letter_model.name or "cover-letter").lower().replace(" ", "-")
    return StreamingResponse(
        buf,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename={slug}.pdf"},
    )
