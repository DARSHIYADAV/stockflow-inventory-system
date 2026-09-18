"""
Deploy-readiness check for StockFlow's backend.

Re-verifies, in one repeatable script, the same 5 things checked manually
during the production-readiness audit, so a later regression (e.g. someone
re-adding --reload to the Dockerfile, or CORS drifting back to a wildcard)
is caught automatically instead of silently shipping.

Usage: python scripts/deploy_check.py
Exits with code 1 (and prints every failure) if any check fails, 0 if clean.
"""

import re
import subprocess
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[1]
BACKEND_DIR = REPO_ROOT / "backend"

failures = []


def fail(message: str):
    failures.append(message)


def check_jwt_secret():
    config_path = BACKEND_DIR / "app" / "config.py"
    main_path = BACKEND_DIR / "app" / "main.py"
    main_src = main_path.read_text(encoding="utf-8")
    if "change-me-in-production" not in main_src or "raise RuntimeError" not in main_src:
        fail(
            f"{main_path.relative_to(REPO_ROOT)} no longer guards against the default "
            "JWT_SECRET at startup — the RuntimeError check is missing."
        )
    config_src = config_path.read_text(encoding="utf-8")
    if 'jwt_secret: str = "change-me-in-production"' not in config_src:
        fail(
            f"{config_path.relative_to(REPO_ROOT)}: expected default jwt_secret sentinel "
            "value not found — startup guard may no longer match it."
        )


def check_cors():
    main_path = BACKEND_DIR / "app" / "main.py"
    src = main_path.read_text(encoding="utf-8")
    if re.search(r'allow_origins\s*=\s*\[\s*["\']\*["\']\s*\]', src):
        fail(f"{main_path.relative_to(REPO_ROOT)}: CORS allow_origins is a wildcard [\"*\"].")
    if "settings.cors_origins_list" not in src:
        fail(
            f"{main_path.relative_to(REPO_ROOT)}: CORS is not reading from "
            "settings.cors_origins_list — origins may be hardcoded again."
        )


def check_no_reload_in_dockerfile():
    dockerfile = BACKEND_DIR / "Dockerfile"
    if not dockerfile.exists():
        return  # no Docker in use; nothing to check
    src = dockerfile.read_text(encoding="utf-8")
    if "--reload" in src:
        fail(f"{dockerfile.relative_to(REPO_ROOT)}: production CMD still includes --reload.")


def check_env_gitignored_and_clean_history():
    gitignore = (REPO_ROOT / ".gitignore").read_text(encoding="utf-8")
    if not re.search(r"^\.env$", gitignore, re.MULTILINE):
        fail(".gitignore no longer excludes .env.")

    result = subprocess.run(
        ["git", "log", "--all", "--full-history", "--", "**/.env", ".env"],
        cwd=str(REPO_ROOT),
        capture_output=True,
        text=True,
    )
    if result.stdout.strip():
        fail(".env appears in git history — check `git log --all --full-history -- .env`.")


REQUIRED_ENV_VARS = [
    "DATABASE_URL",
    "JWT_SECRET",
    "JWT_ALGORITHM",
    "ACCESS_TOKEN_EXPIRE_MINUTES",
    "CORS_ORIGINS",
]


def check_env_vars_documented():
    readme = (REPO_ROOT / "README.md").read_text(encoding="utf-8")
    for var in REQUIRED_ENV_VARS:
        if var not in readme:
            fail(f"README.md no longer documents required env var {var}.")


def main():
    check_jwt_secret()
    check_cors()
    check_no_reload_in_dockerfile()
    check_env_gitignored_and_clean_history()
    check_env_vars_documented()

    if failures:
        print("DEPLOY CHECK FAILED:\n")
        for f in failures:
            print(f"  - {f}")
        sys.exit(1)

    print("Deploy check passed: JWT secret guard, CORS config, no Docker --reload, "
          ".env hygiene, and env var docs are all in place.")
    sys.exit(0)


if __name__ == "__main__":
    main()
