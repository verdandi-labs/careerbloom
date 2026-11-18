import logging

from tavily import AsyncTavilyClient

from config import get_settings

logger = logging.getLogger(__name__)

settings = get_settings()


async def search_company(company_name: str) -> str | None:
    try:
        client = AsyncTavilyClient(api_key=settings.TAVILY_API_KEY)
        response = await client.search(
            query=f"{company_name} company culture values work environment",
            search_depth="basic",
            max_results=3,
            include_answer=True,
        )
        return response.get("answer") or _fallback_summary(response)
    except Exception:
        logger.exception("Tavily search failed for company: %s", company_name)
        return None


def _fallback_summary(response: dict) -> str | None:
    results = response.get("results", [])
    if not results:
        return None
    return " ".join(r.get("content", "") for r in results[:2])
