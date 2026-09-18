# Demo Script (for presenting)

## Demo sign-ins (dev database only — rotate before any real deployment)

- Admin: `dyadav@staunchsys.com` / `darshi123`
- Manager: `joy@staunchsys.com` / `joy12345`
- Employee: no demo account currently seeded — create one via the Users page
  (admin only) before demoing the employee view.

Login is role-scoped: use `/login/admin`, `/login/manager`, or `/login/employee`.

## Walkthrough

1. Log in as Admin → show dashboard (counts, recent activity)
2. Add a new product (e.g., "Dell Monitor") → show it appear with 0 quantity
3. Record stock in (+30) → quantity updates, transaction appears in history
4. Create an asset (specific laptop, e.g. AST-005) → show it as "Available"
5. Assign asset to an employee → status changes to "Assigned", history logged
6. Log out, log in as that Employee → show "My Assets" page with only their equipment
7. Log back in as Admin → return the asset → show it goes back to "Available", history shows both events
8. Point to dashboard low-stock alert if any product is under threshold
