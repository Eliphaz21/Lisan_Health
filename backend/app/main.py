from contextlib import asynccontextmanager
from pathlib import Path
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.app.core.config import settings
from backend.app.api.v1.router import api_router
from backend.app.db.session import init_db


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifespan event handler for application startup and shutdown."""
    # Ensure local storage directories exist on startup
    Path(settings.UPLOAD_DIR).mkdir(parents=True, exist_ok=True)
    Path(settings.AUDIO_OUTPUT_DIR).mkdir(parents=True, exist_ok=True)
    # Initialize database tables and seed administrator
    await init_db()
    yield


app = FastAPI(
    title=settings.PROJECT_NAME,
    description=(
        "LisanHealth (ልሳን ጤና) — An Ethiopian multilingual medical laboratory report explainer "
        "powered by a Dual-AI pipeline and Addis AI localization."
    ),
    version=settings.VERSION,
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json"
)

# Configure CORS Middleware
origins = [
    settings.FRONTEND_URL,
    "http://localhost:3000",
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount API v1 router
app.include_router(api_router, prefix="/api/v1")


@app.get("/", tags=["Root"])
async def root():
    """Root entry point providing API metadata."""
    return {
        "service": settings.PROJECT_NAME,
        "tagline": "Your Health Report, in Your Language",
        "version": settings.VERSION,
        "docs_url": "/docs",
        "api_v1_health": "/api/v1/health",
        "api_v1_ready": "/api/v1/ready"
    }
