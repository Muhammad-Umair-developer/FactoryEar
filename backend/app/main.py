# backend/app/main.py

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.api.endpoints import machines, inference

# Whitelisted frontend origins (Vite dev server + optional legacy port)
ALLOWED_ORIGINS = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000",
]


def get_application() -> FastAPI:
    """Factory function to construct and configure the FastAPI application."""
    app = FastAPI(
        title=settings.PROJECT_NAME,
        version=settings.VERSION,
        openapi_url=f"{settings.API_V1_STR}/openapi.json",
    )

    # Attach CORS middleware before registering routes
    app.add_middleware(
        CORSMiddleware,
        allow_origins=ALLOWED_ORIGINS,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Register API v1 routers (deduplicated)
    app.include_router(
        machines.router,
        prefix=f"{settings.API_V1_STR}/machines",
        tags=["Machines"],
    )
    app.include_router(
        inference.router,
        prefix=f"{settings.API_V1_STR}/inference",
        tags=["Inference"],
    )

    return app


app = get_application()


@app.get("/health", tags=["System"])
async def health_check() -> dict[str, str]:
    """Lightweight health probe for frontend status checks and Docker orchestration."""
    return {
        "status": "healthy",
        "service": settings.PROJECT_NAME,
        "version": settings.VERSION,
    }