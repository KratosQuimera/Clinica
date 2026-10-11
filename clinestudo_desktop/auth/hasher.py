import hashlib
import secrets
import hmac
from typing import Tuple

ITERATIONS = 260_000
HASH_NAME = "sha256"

def hash_password(password: str, salt: str = None) -> Tuple[str, str]:
    """
    Gera um hash criptográfico seguro usando PBKDF2-HMAC-SHA256 com salt individual.
    Em conformidade com as recomendações de segurança OWASP.
    """
    if salt is None:
        salt = secrets.token_hex(16)
    
    key = hashlib.pbkdf2_hmac(
        HASH_NAME,
        password.encode("utf-8"),
        salt.encode("utf-8"),
        ITERATIONS
    )
    return key.hex(), salt

def verify_password(password: str, hashed: str, salt: str) -> bool:
    """Verifica se a senha em texto plano coincide com o hash gravado de forma resistente a timing attacks."""
    test_key = hashlib.pbkdf2_hmac(
        HASH_NAME,
        password.encode("utf-8"),
        salt.encode("utf-8"),
        ITERATIONS
    )
    return hmac.compare_digest(test_key.hex(), hashed)
