# StockFlow — Project Status Report

**Document:** RPT-2026-09-15 &nbsp;|&nbsp; **Prepared for:** Demo review
**Status:** Ready for demo &nbsp;|&nbsp; **Generated:** 2026-09-15

## Summary

| | |
|---|---|
| Backend tests | 98 / 98 passing (incl. RBAC boundaries) |
| Roles supported | 3 (admin, manager, employee) |
| Core tables | 5 (users, products, stock_transactions, assets, asset_history) |
| Live endpoint check | Passed (run against dev server, 2026-09-14) |

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

## 03. Recently shipped

- **Account deactivation** — A resigned employee can be switched off — blocked from logging in and hidden from the "assign to" list — without deleting their name out of the audit trail. Admin accounts and your own account are protected from being deactivated by mistake.
- **Edit user details** — Admins can correct a name or email after the fact. New and edited addresses are required to end in `@staunchsys.com`, checked on both the form and the server.
- **Numbered pagination** — Assets, Products, Users, and My Assets now page five rows at a time with numbered controls, instead of one long scrolling table.
- **Named history** — Asset history shows who assigned and who received an item by name, not a raw internal ID.
- **Left-hand navigation & theme** — Page links moved into a persistent sidebar with an always-visible account card; a light/dark toggle lives in the top bar and resets to dark on every fresh sign-in.

## 04. What was verified before this report

The automated suite covers stock derivation, RBAC boundaries, and the newer account-management endpoints. On top of that, every endpoint was hit live against the running server, not just the isolated test database, to catch anything a unit test alone would miss.

| Area | Tests | Result |
|---|---|---|
| Auth & role-locked login | 11 | ✅ Pass |
| Stock & product rules | 17 | ✅ Pass |
| Assets, assign & return | 21 | ✅ Pass |
| Dashboard summary | 7 | ✅ Pass |
| Users & accounts | 42 | ✅ Pass |

Live check confirmed, end to end: product → stock-in → asset created → assigned → history recorded with names → returned, plus every wrong-role and invalid-state action correctly rejected (double-assign, double-return, cross-role login).

## 05. Demo sign-ins

| Role | Email | Password |
|---|---|---|
| Admin | dyadav@staunchsys.com | Demo@123 |
| Manager | apawar@staunchsys.com | Demo@123 |
| Employee | vchoudhary@staunchsys.com | Demo@123 |

## 06. Open items

> **Self-service "forgot password" is not enabled.** A working email-reset flow was built and tested but removed after discovering the outbound email provider can't yet deliver to arbitrary `@staunchsys.com` inboxes — that requires DNS records added by whoever administers the staunchsys.com domain. Until then, an admin resets passwords directly from the Users page.

---
*StockFlow — internal inventory & asset system*
