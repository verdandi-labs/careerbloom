from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from shared.deps import get_current_user, get_db_for_current_user
from shared.models.user import User
from cover_letters.repository import CoverLetterRepository
from cover_letters.schemas import CoverLetterGenerateRequest, CoverLetterResponse
from cv.service import generate_cover_letter_ai

router = APIRouter(prefix="/cover-letters", tags=["cover-letters"])


@router.post("/generate", response_model=CoverLetterResponse)
async def generate_letter(
    body: CoverLetterGenerateRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_for_current_user),
):
    text = await generate_cover_letter_ai(
        body.job_title,
        body.company,
        body.job_description or "",
        body.context or "",
        body.language,
    )
    repo = CoverLetterRepository(db)
    letter = await repo.create(user.user_id, body.name, body.language, text)
    return CoverLetterResponse.model_validate(letter)


@router.get("", response_model=list[CoverLetterResponse])
async def list_letters(user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db_for_current_user)):
    repo = CoverLetterRepository(db)
    letters = await repo.get_all(user.user_id)
    return [CoverLetterResponse.model_validate(l) for l in letters]


@router.delete("/{letter_id}")
async def delete_letter(
    letter_id: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_for_current_user),
):
    from uuid import UUID

    try:
        parsed = UUID(letter_id)
    except ValueError:
        raise HTTPException(status_code=404, detail="Cover letter not found")

    repo = CoverLetterRepository(db)
    deleted = await repo.delete(user.user_id, parsed)
    if not deleted:
        raise HTTPException(status_code=404, detail="Cover letter not found")
    return {"ok": True}