from fastapi import APIRouter
from backend.app.api.v1.endpoints import health, reports

api_router = APIRouter()

# Include health router
api_router.include_router(health.router, prefix="", tags=["Health & Monitoring"])

# Include reports processing router
api_router.include_router(reports.router, prefix="", tags=["Report Processing"])
