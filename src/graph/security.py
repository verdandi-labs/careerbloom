import re

MAX_STRIKES = 3
MAX_RETRIES = 1

SAFE_RESPONSE_FAILURE = "I wasn't able to generate a response with this model. Please select a different model and try again."
STRIKE_BLOCK_MESSAGE = "Session blocked due to repeated violations"

_session_strikes: dict[str, int] = {}

STRIKE_MESSAGES = {
    1: "I can't help with that, but I'm here whenever you want to talk career",
    2: "Second warning: your session will be blocked after one more attempt like this",
    3: "Session blocked due to repeated violations",
}

INJECTION_PATTERNS = [
    # jailbreak and role override
    r"ignore\s+(previous|all|prior|your)\s+instructions",
    r"you\s+are\s+now\s+",
    r"pretend\s+(you\s+are|to\s+be)",
    r"act\s+as\s+(a\s+different|another|an?\s+unrestricted|developer\s+mode|jailbroken)",
    r"forget\s+(everything|your\s+instructions|your\s+guidelines|your\s+rules)",
    r"(reveal|show|print|repeat|quote|paraphrase)\s+(your\s+)?(system\s+prompt|instructions|configuration|rules)",
    r"what\s+are\s+your\s+instructions",
    r"repeat\s+after\s+me",
    r"(hypothetically|roleplay|pretend|imagine|for\s+fun|as\s+a\s+game)\s+.{0,30}(ignore|forget|bypass|override)",
    r"(special|developer|admin|root)\s+mode",
    r"(END\s+OF\s+DATA|END\s+SYSTEM|SYSTEM:|ASSISTANT:|USER:\s*SYSTEM|<\|im_start\|>|###\s*System|---END---|\[INST\]|\[SYSTEM\])",
    # encoding and obfuscation attacks
    r"(decode|decipher|decrypt|translate\s+from\s+base64|base64\s+decode)",
    r"(rot13|base64|hex\s+decode|url\s+decode)\s+.{0,20}(and\s+(do|follow|execute|run|act))",
    r"[A-Za-z0-9+/]{20,}={0,2}(?!\w)",
    # code execution
    r"exec\s*\(",
    r"eval\s*\(",
    r"subprocess",
    r"os\.system\s*\(",
    r"__import__\s*\(",
    r"open\s*\(['\"]\/",
    r"file\.read",
    r"readFile\s*\(",
    r"fs\.readFile",
    r"process\.env",
    r"ENV\[",
    # shell commands
    r"rm\s+-rf",
    r"chmod\s+[0-9]{3,4}",
    r"chown\s+",
    r"sudo\s+",
    r"wget\s+http",
    r"curl\s+http",
    r"\bnc\s+-[a-z]*e\b",
    r"bash\s+-i",
    r"python\s+-c\s+['\"]",
    r"php\s+-r\s+['\"]",
    # SQL injection
    r"(DROP|DELETE|TRUNCATE)\s+TABLE",
    r"UNION\s+SELECT",
    r"OR\s+1\s*=\s*1",
    r";\s*(DROP|SELECT|INSERT|UPDATE|DELETE)\s+",
    # path traversal
    r"\.\./",
    r"\.\.[\\]",
    r"/etc/(passwd|shadow|hosts)",
    # HTML and script injection
    r"<script[\s>]",
    r"javascript\s*:",
    r"onerror\s*=",
    r"<!ENTITY",
    r"!!python/object",
    # template injection
    r"\{\{.{0,20}\*",
    r"\$\{.{0,20}\}",
    r"<%=.{0,20}%>",
    # credential and token extraction
    r"(show|print|reveal|what\s+is)\s+(your\s+)?(api\s+key|secret|token|password|credential)",
    r"eyJ[A-Za-z0-9_-]{10,}",
    # network and environment
    r"192\.168\.\d+\.\d+",
    r"127\.0\.0\.1",
    r"0\.0\.0\.0",
    r"\$ENV",
]

SUSPICIOUS_OUTPUT_PATTERNS = [
    r"BEGIN\s+PRIVATE\s+KEY",
    r"BEGIN\s+RSA\s+PRIVATE\s+KEY",
    r"user_id\s*:",
    r"database_url",
    r"sk-[a-zA-Z0-9]{20,}",
    r"Bearer\s+[a-zA-Z0-9\-._~+/]+=*",
    r"eyJ[A-Za-z0-9_-]{10,}",
    r"/etc/(passwd|shadow)",
    r"SYSTEM\s+PROMPT",
    r"my\s+instructions\s+are",
]


def check_strike(user_id: str) -> bool:
    return _session_strikes.get(user_id, 0) >= MAX_STRIKES


def register_strike(user_id: str) -> int:
    current = _session_strikes.get(user_id, 0) + 1
    _session_strikes[user_id] = current
    return current


def get_strike_message(strike_count: int) -> str:
    return STRIKE_MESSAGES.get(
        min(strike_count, MAX_STRIKES), STRIKE_MESSAGES[MAX_STRIKES]
    )


def build_validated_message(content: str) -> str | None:
    for pattern in INJECTION_PATTERNS:
        if re.search(pattern, content, re.IGNORECASE):
            return None
    return f"<user_input>{content}</user_input>"


def validate_output(response: str) -> tuple[bool, str | None]:
    for pattern in SUSPICIOUS_OUTPUT_PATTERNS:
        if re.search(pattern, response, re.IGNORECASE):
            return False, f"Suspicious pattern detected: {pattern}"
    return True, None
