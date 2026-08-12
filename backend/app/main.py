from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings

app = FastAPI(
    title=settings.APP_NAME,
    description="REST API сервиса заказов студенческих работ BauSquad",
    version="2.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
def health_check():
    return {"status": "ok", "app": settings.APP_NAME, "version": "2.0.0"}

@app.get("/")
def root():
    return {
        "message": "Welcome to BauSquad FastAPI Engine",
        "docs_url": "/docs",
        "health_url": "/health"
    }
