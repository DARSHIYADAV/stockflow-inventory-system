"""
FastAPI entrypoint.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.routers import asset_assignments, assets, auth, dashboard, products, stock, users

if settings.jwt_secret == "change-me-in-production":
    raise RuntimeError("JWT_SECRET must be set — refusing to start with the default secret")

app = FastAPI(title="StockFlow API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(products.router)
app.include_router(stock.router)
app.include_router(assets.router)
app.include_router(asset_assignments.router)
app.include_router(dashboard.router)
app.include_router(users.router)


@app.get("/health")
async def health_check():
    return {"status": "ok"}
