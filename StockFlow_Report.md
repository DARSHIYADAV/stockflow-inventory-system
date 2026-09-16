# StockFlow — Project Status Report

**Document:** RPT-2026-09-16 &nbsp;|&nbsp; **Prepared for:** Demo review
**Status:** Ready for demo

## 01. What it does

StockFlow tracks two kinds of company property: bulk **stock** (laptops, monitors, keyboards — counted, not individually tracked) and specific **assets** (one laptop with one serial number, assigned to one employee at a time).

The core design rule: a product's quantity is never a number stored and edited directly. It is a total, calculated fresh every time by summing every stock-in and stock-out entry ever recorded against it — a ledger, the same way a bank balance is a ledger of transactions rather than a single editable field. Nothing gets overwritten; every change is a new row.

The same rule governs assets: assigning or returning a laptop doesn't just flip its status, it appends a row to `asset_history`. Ask "who has AST-004 had it, and when" and the app can always answer, because the answer was never anything but a stored fact.

## 02. Who can do what

| Capability | Admin | Manager | Employee |
|---|---|---|---|
| View dashboard & recent activity | Full | Counts only | — |
| Manage products & stock | Yes | — | — |
| Create / assign / return assets | Yes | Yes | — |
| View own assigned equipment | Yes | Yes | Yes |
| Manage user accounts | Yes | — | — |
| Deactivate / reactivate a user | Yes | — | — |

Every role has its own sign-in URL. Trying to log into the wrong one fails with the identical "incorrect email or password" message a real wrong password would give — there is no way to probe an address and learn what role it holds.

Exactly **one admin account** can ever exist — enforced with a database-level unique constraint, not just an application check, so it holds even against a direct database edit.

## 03. What was verified before this report

The automated suite covers stock derivation, RBAC boundaries, and account-management endpoints. On top of that, every endpoint was hit live against the running server — not just the isolated test database — to catch anything a unit test alone would miss.

| Area | Tests | Result |
|---|---|---|
| Auth & role-locked login | 16 | ✅ Pass |
| Stock & product rules | 16 | ✅ Pass |
| Assets, assign & return | 20 | ✅ Pass |
| Dashboard summary | 7 | ✅ Pass |
| Users & accounts | 39 | ✅ Pass |
| **Total** | **98** | ✅ **All passing** |

Live check confirmed, end to end: product → stock-in → asset created → assigned → history recorded with names → returned, plus every wrong-role and invalid-state action correctly rejected (double-assign, double-return, cross-role login).

## 04. Demo sign-ins

| Role | Email | Password |
|---|---|---|
| Admin | dyadav@staunchsys.com | darshi123 |
| Manager | joy@staunchsys.com | joy12345 |

Run `pytest -q` from `backend/` to reproduce the test results above.

## 05. Open items

> **Self-service "forgot password" is not enabled.** A working email-reset flow was built and tested but removed after discovering the outbound email provider can't yet deliver to arbitrary `@staunchsys.com` inboxes — that requires DNS records added by whoever administers the staunchsys.com domain. Until then, an admin resets passwords directly from the Users page.

> **Password rules are minimal.** Only an 8-character minimum is enforced, and only on the frontend — there is no backend-side length or complexity check, and no requirement for numbers/special characters anywhere.

---
*StockFlow — internal inventory & asset system*
