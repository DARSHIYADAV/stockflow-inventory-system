"""
FastAPI entrypoint.
Routers (users, dashboard) are added in later sessions.
"""

from fastapi import FastAPI

from app.routers import assets, auth, products, stock

app = FastAPI(title="StockFlow API")

app.include_router(auth.router)
app.include_router(products.router)
app.include_router(stock.router)
app.include_router(assets.router)


@app.get("/health")
async def health_check():
    return {"status": "ok"}
