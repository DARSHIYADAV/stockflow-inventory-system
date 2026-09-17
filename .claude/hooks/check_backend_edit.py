import json
import subprocess
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[2]
BACKEND_DIR = REPO_ROOT / "backend"
VENV_PYTHON = BACKEND_DIR / "myenv" / "Scripts" / "python.exe"
LINE_LIMIT = 200


def main():
    try:
        payload = json.load(sys.stdin)
    except (json.JSONDecodeError, ValueError):
        return

    file_path = payload.get("tool_input", {}).get("file_path")
    if not file_path:
        return

    path = Path(file_path)
    messages = []

    if path.suffix == ".py" and "myenv" not in path.parts and "__pycache__" not in path.parts:
        try:
            relative = path.resolve().relative_to(BACKEND_DIR.resolve())
        except ValueError:
            relative = None
        if relative is not None:
            python_exe = str(VENV_PYTHON) if VENV_PYTHON.exists() else sys.executable
            result = subprocess.run(
                [python_exe, "-m", "pytest", "-q"],
                cwd=str(BACKEND_DIR),
                capture_output=True,
                text=True,
            )
            status = "passed" if result.returncode == 0 else "FAILED"
            tail = "\n".join((result.stdout + result.stderr).strip().splitlines()[-15:])
            messages.append(f"backend tests {status} after editing {relative}:\n{tail}")

    try:
        line_count = len(path.read_text(encoding="utf-8", errors="ignore").splitlines())
    except OSError:
        line_count = 0
    if line_count > LINE_LIMIT:
        messages.append(
            f"{path.name} is {line_count} lines, over the {LINE_LIMIT}-line project guideline (see CLAUDE.md)."
        )

    if messages:
        print(json.dumps({"systemMessage": "\n\n".join(messages)}))


if __name__ == "__main__":
    main()
