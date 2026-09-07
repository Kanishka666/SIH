"""
LabelLens backend entrypoint.

Run with:
    uvicorn app.main:app --reload
"""
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException, Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.api.routes import auth, cases, compliance, products, reports, rules, scans
from app.core.config import settings
from app.services.mock_ai_service import get_demo_rules
from app.storage import memory_store


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: seed demo/mock reference data
    memory_store.seed_rules(get_demo_rules())
    memory_store.seed_demo_data()
    yield
    # (no shutdown cleanup needed for the in-memory store)


app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description=(
        "LabelLens — AI-Powered Legal Metrology Compliance Scanner (SIH26034). "
        "This is the FIRST iteration backend: real database and AI/ML integration "
        "are NOT yet wired in. All data is mocked / stored in memory so the React "
        "frontend has a stable REST contract to build against."
    ),
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

# ---------------------------------------------------------------------------
# CORS — configurable via CORS_ORIGINS env var
# ---------------------------------------------------------------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---------------------------------------------------------------------------
# Consistent JSON error responses
# ---------------------------------------------------------------------------
@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    return JSONResponse(
        status_code=exc.status_code,
        content={"error": True, "detail": exc.detail},
    )


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={"error": True, "detail": exc.errors()},
    )


# ---------------------------------------------------------------------------
# Routers
# ---------------------------------------------------------------------------
app.include_router(auth.router)
app.include_router(scans.router)
app.include_router(compliance.router)
app.include_router(reports.router)
app.include_router(products.router)
app.include_router(cases.router)
app.include_router(rules.router)


@app.get("/", tags=["Health"])
def root():
    return {
        "service": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "status": "ok",
        "docs": "/docs",
    }


@app.get("/health", tags=["Health"])
def health_check():
    return {"status": "ok"}
