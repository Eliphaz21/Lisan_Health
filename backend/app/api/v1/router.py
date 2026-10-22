from fastapi import APIRouter
from backend.app.api.v1.endpoints import health, reports, speech, auth, admin, history

api_router = APIRouter()

# Include health router
api_router.include_router(health.router, prefix="", tags=["Health & Monitoring"])

# Include reports processing router
api_router.include_router(reports.router, prefix="", tags=["Report Processing"])

# Include voice speech synthesis router
api_router.include_router(speech.router, prefix="", tags=["Voice Synthesis (TTS)"])

# Include user authentication router
api_router.include_router(auth.router, prefix="", tags=["User Authentication"])

# Include admin management router
api_router.include_router(admin.router, prefix="", tags=["Administrator Dashboard"])

# Include user report history router
api_router.include_router(history.router, prefix="", tags=["User Report History"])

