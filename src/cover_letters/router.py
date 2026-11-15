import logging
from io import BytesIO
from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession

from cover_letters.repository import CoverLetterRepository
from cover_letters.schemas import CoverLetterResponse, SaveCoverLetterRequest
from shared.deps import get_current_user, get_db_for_current_user
from shared.models.user import User

router = APIRouter(prefix="/cover-letters", tags=["cover-letters"])
logger = logging.getLogger(__name__)


@router.post("/save", response_model=CoverLetterResponse)
async def save_letter(
    body: SaveCoverLetterRequest,
    user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db_for_current_user)],
):
    repo = CoverLetterRepository(db)
    letter = await repo.create(user.user_id, body.name, body.text)
    return CoverLetterResponse.model_validate(letter)


@router.get("", response_model=list[CoverLetterResponse])
async def list_letters(
    user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db_for_current_user)],
):
    repo = CoverLetterRepository(db)
    letters = await repo.get_all(user.user_id)
    return [CoverLetterResponse.model_validate(l) for l in letters]


@router.delete("/{letter_id}")
async def delete_letter(
    letter_id: str,
    user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db_for_current_user)],
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
    user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db_for_current_user)],
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
