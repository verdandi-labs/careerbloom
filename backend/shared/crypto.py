import base64
import hashlib
import hmac
import json
from functools import lru_cache

from cryptography.fernet import Fernet
from google.cloud import kms
from google.oauth2 import service_account

from config import get_settings

settings = get_settings()


@lru_cache(maxsize=1)
def _kms_client() -> kms.KeyManagementServiceClient:
    if settings.GOOGLE_APPLICATION_CREDENTIALS_JSON:
        info = json.loads(settings.GOOGLE_APPLICATION_CREDENTIALS_JSON)
        creds = service_account.Credentials.from_service_account_info(
            info,
            scopes=["https://www.googleapis.com/auth/cloudkms"],
        )
        return kms.KeyManagementServiceClient(credentials=creds)
    return kms.KeyManagementServiceClient()


@lru_cache(maxsize=256)
def _fernet_for_key(key: bytes) -> Fernet:
    return Fernet(key)


def encrypt(value: str, key: bytes) -> str:
    return _fernet_for_key(key).encrypt(value.encode()).decode()


def decrypt(value: str, key: bytes) -> str:
    return _fernet_for_key(key).decrypt(value.encode()).decode()


def hash_email(email: str) -> str:
    normalized = email.strip().lower()
    return hmac.new(settings.HMAC_SECRET.encode(), normalized.encode(), hashlib.sha256).hexdigest()


def generate_user_key() -> bytes:
    return Fernet.generate_key()


def encrypt_user_key(user_key: bytes) -> str:
    client = _kms_client()
    response = client.encrypt(
        request={
            "name": settings.GOOGLE_KMS_KEY_NAME,
            "plaintext": user_key,
        }
    )
    return base64.b64encode(response.ciphertext).decode()


def decrypt_user_key(encrypted_key: str) -> bytes:
    client = _kms_client()
    ciphertext = base64.b64decode(encrypted_key.encode())
    response = client.decrypt(
        request={
            "name": settings.GOOGLE_KMS_KEY_NAME,
            "ciphertext": ciphertext,
        }
    )
    return response.plaintext


def hash_token(token: str) -> str:
    return hashlib.sha256(token.encode()).hexdigest()