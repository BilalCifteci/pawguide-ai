"""
Password Policy — enforced on registration and password change.
"""
import re
from dataclasses import dataclass


@dataclass
class PasswordStrength:
    score: int          # 0-4
    label: str          # "Cok Zayif" | "Zayif" | "Orta" | "Guclu" | "Cok Guclu"
    color: str          # "red" | "orange" | "yellow" | "green" | "emerald"
    issues: list[str]   # list of unmet rules
    passed: bool        # all rules met


PASSWORD_RULES = [
    (r".{8,}", "En az 8 karakter olmali"),
    (r"[A-Z]", "En az 1 buyuk harf icermeli (A-Z)"),
    (r"[a-z]", "En az 1 kucuk harf icermeli (a-z)"),
    (r"[0-9]", "En az 1 rakam icermeli (0-9)"),
    (r"[!@#$%^&*(),.?\":{}|<>_\-\+\=\[\]\/\\]", "En az 1 ozel karakter icermeli (!@#$%...)"),
]

COMMON_PASSWORDS = {
    "password", "123456", "12345678", "qwerty", "abc123", "password1",
    "111111", "123123", "admin", "letmein", "welcome", "monkey",
    "1234567890", "password123", "iloveyou", "sunshine", "princess",
    "dragon", "master", "passw0rd", "qwerty123", "12345", "test",
}


def check_password_strength(password: str) -> PasswordStrength:
    if password.lower() in COMMON_PASSWORDS:
        return PasswordStrength(
            score=0, label="Cok Zayif", color="red",
            issues=["Bu sifre cok yaygin kullanilmaktadir"], passed=False,
        )

    issues = []
    for pattern, message in PASSWORD_RULES:
        if not re.search(pattern, password):
            issues.append(message)

    score = len(PASSWORD_RULES) - len(issues)

    if score == 0:
        label, color = "Cok Zayif", "red"
    elif score <= 2:
        label, color = "Zayif", "orange"
    elif score == 3:
        label, color = "Orta", "yellow"
    elif score == 4:
        label, color = "Guclu", "green"
    else:
        label, color = "Cok Guclu", "emerald"

    return PasswordStrength(
        score=score,
        label=label,
        color=color,
        issues=issues,
        passed=len(issues) == 0,
    )


def validate_password(password: str) -> None:
    """Raise ValueError if password does not meet requirements."""
    result = check_password_strength(password)
    if not result.passed:
        raise ValueError(f"Sifre gereksinimleri karsilanmadi: {'; '.join(result.issues)}")
