"""
PreToolUse hook: runs scripts/deploy_check.py before any `git push`, blocking
the push if the production-readiness checks (JWT secret guard, CORS config,
no Docker --reload, .env hygiene, env var docs) fail. Reuses the same
deploy-check script a human would run manually, so it can't be forgotten.
"""

import json
import re
import subprocess
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[2]
DEPLOY_CHECK_SCRIPT = REPO_ROOT / "scripts" / "deploy_check.py"


def is_git_push(command: str) -> bool:
    return bool(re.search(r"\bgit\s+push\b", command))


def main():
    try:
        payload = json.load(sys.stdin)
    except (json.JSONDecodeError, ValueError):
        return

    command = payload.get("tool_input", {}).get("command", "")
    if not command or not is_git_push(command):
        return

    if not DEPLOY_CHECK_SCRIPT.exists():
        return

    result = subprocess.run(
        [sys.executable, str(DEPLOY_CHECK_SCRIPT)],
        cwd=str(REPO_ROOT),
        capture_output=True,
        text=True,
    )

    if result.returncode != 0:
        print(json.dumps({
            "decision": "block",
            "reason": "Push blocked by deploy-check hook:\n" + (result.stdout + result.stderr).strip(),
        }))


if __name__ == "__main__":
    main()
