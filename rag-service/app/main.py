from fastapi import FastAPI

from app.api.documents import router as documents_router
from app.api.query import router as query_router
from app.vector_store.qdrant_client import ensure_collection_ready

app = FastAPI(title="PSC RAG Service")

app.include_router(query_router, prefix="/api")
app.include_router(documents_router, prefix="/api")


@app.on_event("startup")
def on_startup() -> None:
    ensure_collection_ready()


@app.get("/health")
def health() -> dict:
    return {"status": "ok"}
