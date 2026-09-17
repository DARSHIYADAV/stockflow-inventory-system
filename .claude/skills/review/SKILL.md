---
name: review
description: Review uncommitted changes in the StockFlow codebase for correctness, RBAC consistency, and missing test coverage before committing.
---

# StockFlow Code Review

Use this skill when the user asks to review the current changes before committing (e.g. `/review`).

## What to check

1. **Diff scope** — run `git diff` and `git status` to see what changed. If there's nothing uncommitted, say so and stop.

2. **Correctness** — read every changed file fully (not just the diff hunk) and look for:
   - Logic bugs, off-by-one errors, wrong comparisons
   - Unhandled edge cases (empty lists, None/null, negative numbers)
   - Broken assumptions about existing code

3. **RBAC consistency** (StockFlow-specific) — this project enforces strict role rules. For any new/changed endpoint in `backend/app/routers/`, confirm:
   - It uses the correct dependency (`require_admin`, `require_admin_or_manager`, or `get_current_user` + manual role/self checks)
   - It doesn't accidentally let a role skip a rule enforced elsewhere (e.g. one admin only, self-deactivation blocked, email domain validation)
   - Error messages for auth failures stay generic (never reveal whether an account/role exists)

4. **The ledger/audit-trail rule** — this project's core invariant: stock quantity is never stored as a mutable field (always derived from `stock_transactions`), and asset assignment history is never overwritten (always appended to `asset_history`). Flag any change that violates this.

5. **Test coverage** — for every new backend endpoint or changed business rule, confirm there's a corresponding test in `backend/tests/`. If not, say so explicitly and list what's missing.

6. **Frontend consistency** — if a backend endpoint's request/response shape changed, confirm the matching frontend API call (`frontend/src/api/*.js`) and any component using it were updated too.

## Output format

Report findings as a short list, most important first:
- **File + line** (or function name)
- **What's wrong** (one sentence)
- **Why it matters** (one sentence, tie back to a concrete failure scenario)

If nothing is wrong, say so plainly — don't invent findings to seem thorough. Do not fix anything automatically unless the user asks; report only.
