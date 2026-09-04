from pathlib import Path
from functools import lru_cache

_PROMPTS_DIR = Path(__file__).parent

@lru_cache(maxsize=None)
def load(name: str) -> str:
    return (_PROMPTS_DIR / f"{name}.md").read_text(encoding="utf-8").strip()
