# Database Schema

### `users`
| Column | Type | Notes |
|---|---|---|
| id | UUID/PK | |
| name | string | |
| email | string, unique | |
| password_hash | string | |
| role | enum(admin, manager, employee) | |
| created_at | timestamp | |

### `products`
| Column | Type | Notes |
|---|---|---|
| id | UUID/PK | |
| name | string | e.g. "MacBook Pro" |
| category | string | e.g. "Laptop" |
| supplier_name | string | plain text field, not a separate table |
| low_stock_threshold | integer | for dashboard alerts |
| created_at | timestamp | |

*Quantity is NOT a column here — it's derived by summing `stock_transactions`.*

### `stock_transactions`
| Column | Type | Notes |
|---|---|---|
| id | UUID/PK | |
| product_id | FK → products | |
| change_quantity | integer | positive = stock in, negative = stock out |
| reason | string | e.g. "New purchase", "Issued to employee" |
| actor_id | FK → users | who performed the action |
| created_at | timestamp | |

### `assets`
| Column | Type | Notes |
|---|---|---|
| id | UUID/PK | |
| asset_tag | string, unique | e.g. "AST-001" |
| product_id | FK → products | |
| serial_number | string, nullable | |
| status | enum(available, assigned, retired) | |
| assigned_to | FK → users, nullable | |
| purchase_date | date, nullable | |
| created_at | timestamp | |

### `asset_history`
| Column | Type | Notes |
|---|---|---|
| id | UUID/PK | |
| asset_id | FK → assets | |
| action | enum(assigned, returned) | |
| employee_id | FK → users | |
| actor_id | FK → users | who performed the assign/return |
| note | string, nullable | |
| created_at | timestamp | |

### Relationships Summary
- `products` 1 → many `stock_transactions`
- `products` 1 → many `assets`
- `assets` 1 → many `asset_history`
- `users` 1 → many `stock_transactions` (as actor)
- `users` 1 → many `asset_history` (as employee and/or actor)
- `users` 1 → many `assets` (currently assigned)
