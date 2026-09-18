# Todo — Split files over 200 lines (pure refactor, no behavior change)

Files over the limit (found via full-repo scan):
- [x] backend/app/routers/assets.py (262 lines) → split into assets.py (111), asset_assignments.py (134), services/assets.py (45); pytest 98 passed
- [x] frontend/src/pages/Users.jsx (264 lines) → Users.jsx (160) + components/UsersTable.jsx (127)
- [x] frontend/src/pages/Assets.jsx (240 lines) → Assets.jsx (187) + components/AssetsTable.jsx (81)
- [x] frontend/src/pages/Products.jsx (210 lines) → Products.jsx (146) + components/ProductsTable.jsx (94)

Rule: split logic into new files/functions and import back in — no behavior
change. Verify after each file: backend → pytest; frontend → npm run build
(and manual /run check at the end).

- [x] Final verification: pytest 98 passed, frontend build succeeds, all files
      under 200 lines. Also manually launched backend+frontend, logged in as
      admin via headless Chrome (CDP), and screenshotted Products/Assets/Users
      — all three refactored tables render correctly with no console errors.
