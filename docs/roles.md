# Roles & Permissions

| Action | Admin | Manager | Employee |
|---|---|---|---|
| View dashboard | ✅ | ✅ | ❌ |
| Manage products (create/edit/delete) | ✅ | ❌ | ❌ |
| Record stock in/out | ✅ | ❌ | ❌ |
| Manage assets (create/assign/return) | ✅ | ✅ | ❌ |
| View all users | ✅ | ❌ | ❌ |
| Change user roles | ✅ | ❌ | ❌ |
| View own assigned assets | ✅ | ✅ | ✅ |

Enforced via `require_admin` / `require_admin_or_manager` in
`backend/app/core/dependencies.py`, applied per-route. Products and stock
routes are `require_admin` only — managers cannot create/edit/delete
products or post stock transactions, only assets.
