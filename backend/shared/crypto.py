import base64
import hashlib
import hmac

from cryptography.fernet import Fernet

from config import get_settings

settings = get_settings()
_master_fernet = Fernet(settings.MASTER_KEY.encode())


def encrypt(value: str, key: bytes) -> str:
    return Fernet(key).encrypt(value.encode()).decode()


def decrypt(value: str, key: bytes) -> str:
    return Fernet(key).decrypt(value.encode()).decode()


def hash_email(email: str) -> str:
    normalized = email.strip().lower()
    return hmac.new(settings.HMAC_SECRET.encode(), normalized.encode(), hashlib.sha256).hexdigest()


def generate_user_key() -> bytes:
    return Fernet.generate_key()


def encrypt_user_key(user_key: bytes) -> str:
    return Fernet(settings.MASTER_KEY.encode()).encrypt(user_key).decode()


def decrypt_user_key(encrypted_key: str) -> bytes:
    return Fernet(settings.MASTER_KEY.encode()).decrypt(encrypted_key.encode())


def hash_token(token: str) -> str:
    return hashlib.sha256(token.encode()).hexdigest()
