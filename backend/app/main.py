"""
FastAPI entrypoint.
"""

from fastapi import FastAPI

from app.routers import assets, auth, dashboard, products, stock, users

app = FastAPI(title="StockFlow API")

app.include_router(auth.router)
app.include_router(products.router)
app.include_router(stock.router)
app.include_router(assets.router)
app.include_router(dashboard.router)
app.include_router(users.router)


@app.get("/health")
async def health_check():
    return {"status": "ok"}
