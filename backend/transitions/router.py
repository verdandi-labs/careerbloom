from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from shared.crypto import decrypt, decrypt_user_key, encrypt
from shared.deps import get_current_user, get_db_for_current_user
from shared.models.user import User
from transitions.repository import TransitionRepository
from transitions.schemas import TransitionCreate, TransitionResponse

router = APIRouter(prefix="/transitions", tags=["transitions"])


def _cipher(user: User, plaintext: str) -> str:
    user_key = decrypt_user_key(user.encryption_key)
    return encrypt(plaintext, user_key)


def _plaintext(user: User, ciphertext: str) -> str:
    user_key = decrypt_user_key(user.encryption_key)
    return decrypt(ciphertext, user_key)


@router.post("", response_model=TransitionResponse)
async def create_transition(
    body: TransitionCreate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_for_current_user),
):
    repo = TransitionRepository(db)
    encrypted = _cipher(user, body.transition)
    transition = await repo.create_or_rotate(user.user_id, encrypted)
    transition.transition = _plaintext(user, transition.transition)
    return TransitionResponse.model_validate(transition)


@router.get("", response_model=list[TransitionResponse])
async def list_transitions(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_for_current_user),
):
    repo = TransitionRepository(db)
    transitions = await repo.get_all(user.user_id)
    user_key = decrypt_user_key(user.encryption_key)
    for transition in transitions:
        transition.transition = decrypt(transition.transition, user_key)
    return [TransitionResponse.model_validate(t) for t in transitions]


@router.get("/current", response_model=TransitionResponse)
async def get_current_transition(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_for_current_user),
):
    repo = TransitionRepository(db)
    transition = await repo.get_latest(user.user_id)
    if not transition:
        raise HTTPException(status_code=404, detail="Transition not found")
    transition.transition = _plaintext(user, transition.transition)
    return TransitionResponse.model_validate(transition)


@router.delete("/{transition_id}")
async def delete_transition(
    transition_id: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_for_current_user),
):
    try:
        parsed = UUID(transition_id)
    except ValueError:
        raise HTTPException(status_code=404, detail="Transition not found")

    repo = TransitionRepository(db)
    deleted = await repo.delete(user.user_id, parsed)
    if not deleted:
        raise HTTPException(status_code=404, detail="Transition not found")
    return {"ok": True}