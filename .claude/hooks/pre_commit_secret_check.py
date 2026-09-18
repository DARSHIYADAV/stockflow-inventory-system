"""
PreToolUse hook: blocks `git commit` if staged changes include a .env file
or an obvious hardcoded secret, so credentials never accidentally land
in a commit.
"""

import json
import re
import subprocess
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[2]

BLOCKED_FILENAMES = {".env"}
BLOCKED_FILENAME_PATTERNS = (re.compile(r"^\.env\..+"),)  # .env.local, .env.production, etc.

SECRET_PATTERNS = [
    re.compile(r"JWT_SECRET\s*=\s*[\"']?(?!change-me-in-production)\S+", re.IGNORECASE),
    re.compile(r"(SECRET|PASSWORD|API_KEY|ACCESS_KEY|TOKEN)\s*=\s*[\"']?[A-Za-z0-9+/_\-]{12,}", re.IGNORECASE),
    re.compile(r"-----BEGIN (RSA|EC|OPENSSH|PGP)? ?PRIVATE KEY-----"),
    re.compile(r"postgresql(\+asyncpg)?://\S+:\S+@"),  # DB connection string with embedded credentials
]


def is_git_commit(command: str) -> bool:
    return bool(re.search(r"\bgit\s+commit\b", command))


def main():
    try:
        payload = json.load(sys.stdin)
    except (json.JSONDecodeError, ValueError):
        return

    command = payload.get("tool_input", {}).get("command", "")
    if not command or not is_git_commit(command):
        return

    result = subprocess.run(
        ["git", "diff", "--cached", "--name-only"],
        cwd=str(REPO_ROOT),
        capture_output=True,
        text=True,
    )
    staged_files = [f for f in result.stdout.splitlines() if f.strip()]

    problems = []

    for f in staged_files:
        name = Path(f).name
        if name in BLOCKED_FILENAMES or any(p.match(name) for p in BLOCKED_FILENAME_PATTERNS):
            problems.append(f"staged file '{f}' looks like an env file and should never be committed")

    diff_result = subprocess.run(
        ["git", "diff", "--cached", "-U0"],
        cwd=str(REPO_ROOT),
        capture_output=True,
        text=True,
    )
    added_lines = [
        line[1:] for line in diff_result.stdout.splitlines()
        if line.startswith("+") and not line.startswith("+++")
    ]
    for line in added_lines:
        for pattern in SECRET_PATTERNS:
            if pattern.search(line):
                snippet = line.strip()[:100]
                problems.append(f"staged change looks like a hardcoded secret: {snippet}")
                break

    if problems:
        message = "Commit blocked by secret-scan hook:\n- " + "\n- ".join(problems)
        print(json.dumps({
            "decision": "block",
            "reason": message,
        }))


if __name__ == "__main__":
    main()
