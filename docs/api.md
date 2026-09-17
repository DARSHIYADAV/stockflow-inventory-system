# API Endpoints

### Auth
- `POST /auth/register` — create user (open only for the very first admin; requires an authed admin afterwards)
- `POST /auth/login` — returns JWT access token
- `POST /auth/login/admin`, `POST /auth/login/manager`, `POST /auth/login/employee` — role-scoped login variants
- `GET /auth/me` — current user info
- `PUT /auth/change-password` — change own password (any authenticated user)

### Products
- `GET /products` — list all products with derived quantity (**admin only**)
- `GET /products/assignable` — lightweight product list for assign/stock forms (admin or manager)
- `POST /products` — create product (**admin only**)
- `PUT /products/{id}` — edit product (**admin only**)
- `DELETE /products/{id}` — delete product (**admin only**)

### Stock
- `POST /stock/{product_id}/transaction` — record stock in/out (**admin only**)
- `GET /stock/{product_id}/history` — transaction history for a product (**admin only**)

### Assets
- `GET /assets` — list all assets, filterable by status (admin or manager)
- `GET /assets/my` — assets assigned to the logged-in employee (any authenticated user)
- `POST /assets` — create asset (admin or manager)
- `POST /assets/bulk` — bulk-create assets (admin or manager)
- `POST /assets/{id}/assign` — assign to employee (admin or manager)
- `POST /assets/{id}/return` — mark returned (admin or manager)
- `GET /assets/{id}/history` — asset assignment history

### Users
- `GET /users` — list all users (**admin only**)
- `GET /users/assignable` — lightweight user list for asset-assignment forms (admin or manager)
- `POST /users` — create a managed user (**admin only**)
- `PUT /users/{id}` — edit a user (**admin only**)
- `PUT /users/{id}/role` — change a user's role (**admin only**)
- `PUT /users/{id}/reset-password` — reset a user's password (**admin only**)
- `PUT /users/{id}/deactivate` / `PUT /users/{id}/reactivate` — users are deactivated, never deleted (**admin only**)

### Dashboard
- `GET /dashboard/summary` — counts: total products, low-stock count, total assets, assigned assets, recent activity feed (admin or manager)
