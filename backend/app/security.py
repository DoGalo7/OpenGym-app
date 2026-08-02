import hashlib
import hmac
import os
import secrets

PBKDF2_ITERATIONS = 100_000

# Excludes visually ambiguous characters (0/O, 1/I/L) since this is meant to be hand-typed
# from wherever the user saved it.
RECOVERY_CODE_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789"


def generate_recovery_code() -> str:
    """A one-time-shown, permanently-reusable backup code (like a 2FA backup code) that lets
    a user reset their password without email/SMS infra, per this project's deliberately
    minimal auth approach. It's not single-use/rotated after a successful recovery - a
    reasonable tradeoff for a fitness app with no sensitive data, not a security-critical
    system - but worth revisiting if that ever changes."""
    chars = "".join(secrets.choice(RECOVERY_CODE_ALPHABET) for _ in range(8))
    return f"{chars[:4]}-{chars[4:]}"


def hash_password(password: str) -> str:
    salt = os.urandom(16)
    digest = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt, PBKDF2_ITERATIONS)
    return f"{salt.hex()}${digest.hex()}"


def verify_password(password: str, stored_hash: str) -> bool:
    try:
        salt_hex, digest_hex = stored_hash.split("$")
        salt = bytes.fromhex(salt_hex)
        expected = bytes.fromhex(digest_hex)
    except ValueError:
        return False
    actual = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt, PBKDF2_ITERATIONS)
    return hmac.compare_digest(actual, expected)
