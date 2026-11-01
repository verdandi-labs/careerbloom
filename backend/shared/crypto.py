import hashlib
import hmac
from functools import lru_cache

from cryptography.fernet import Fernet

from config import get_settings

settings = get_settings()


@lru_cache(maxsize=1)
def _master_fernet() -> Fernet:
    return Fernet(settings.MASTER_KEY.encode())


@lru_cache(maxsize=256)
def _fernet_for_key(key: bytes) -> Fernet:
    return Fernet(key)


def encrypt(value: str, key: bytes) -> str:
    return _fernet_for_key(key).encrypt(value.encode()).decode()


def decrypt(value: str, key: bytes) -> str:
    return _fernet_for_key(key).decrypt(value.encode()).decode()


def hash_email(email: str) -> str:
    normalized = email.strip().lower()
    return hmac.new(
        settings.HMAC_SECRET.encode(), normalized.encode(), hashlib.sha256
    ).hexdigest()


def generate_user_key() -> bytes:
    return Fernet.generate_key()


def encrypt_user_key(user_key: bytes) -> str:
    return _master_fernet().encrypt(user_key).decode()


def decrypt_user_key(encrypted_key: str) -> bytes:
    return _master_fernet().decrypt(encrypted_key.encode())


def hash_token(token: str) -> str:
    return hashlib.sha256(token.encode()).hexdigest()
