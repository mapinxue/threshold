import base64
import hashlib
import hmac
import secrets

PASSWORD_ITERATIONS = 600_000


def hash_password(password: str) -> str:
    salt = secrets.token_bytes(16)
    digest = hashlib.pbkdf2_hmac(
        "sha256",
        password.encode(),
        salt,
        PASSWORD_ITERATIONS,
    )
    return "$".join(
        (
            "pbkdf2_sha256",
            str(PASSWORD_ITERATIONS),
            base64.urlsafe_b64encode(salt).decode(),
            base64.urlsafe_b64encode(digest).decode(),
        )
    )


def verify_password(password: str, encoded: str) -> bool:
    try:
        algorithm, iterations_text, salt_text, digest_text = encoded.split("$", maxsplit=3)
        if algorithm != "pbkdf2_sha256":
            return False
        iterations = int(iterations_text)
        salt = base64.urlsafe_b64decode(salt_text.encode())
        expected = base64.urlsafe_b64decode(digest_text.encode())
    except (ValueError, TypeError):
        return False

    actual = hashlib.pbkdf2_hmac("sha256", password.encode(), salt, iterations)
    return hmac.compare_digest(actual, expected)


def new_token(prefix: str = "") -> str:
    return f"{prefix}{secrets.token_urlsafe(32)}"


def hash_token(token: str) -> str:
    return hashlib.sha256(token.encode()).hexdigest()
