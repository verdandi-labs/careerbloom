from datetime import date

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

MAX_REQUESTS_PER_MINUTE = 10
MAX_REQUESTS_PER_DAY = 100
MAX_TOKENS_PER_CALL = 6000
MAX_TOKENS_PER_DAY = 50000
TIMEOUT_SECONDS = 60


async def check_daily_limits(user_id: str, db: AsyncSession) -> None:
    result = await db.execute(
        text("""
             SELECT request_count, tokens_used
             FROM usage
             WHERE user_id = :user_id AND date = :today
             """),
        {"user_id": user_id, "today": date.today()},
    )
    row = result.fetchone()
    if row:
        if row.request_count >= MAX_REQUESTS_PER_DAY:
            raise LimitExceededError("Daily request limit reached")
        if row.tokens_used >= MAX_TOKENS_PER_DAY:
            raise LimitExceededError("Daily token limit reached")


async def register_request(
        user_id: str,
        tokens_used: int,
        db: AsyncSession,
) -> None:
    await db.execute(
        text("""
             INSERT INTO usage (user_id, date, request_count, tokens_used)
             VALUES (:user_id, :today, 1, :tokens)
                 ON CONFLICT (user_id, date)
            DO UPDATE SET
                 request_count = usage.request_count + 1,
                                    tokens_used = usage.tokens_used + :tokens
             """),
        {"user_id": user_id, "today": date.today(), "tokens": tokens_used},
    )
    await db.commit()


class LimitExceededError(Exception):
    pass
