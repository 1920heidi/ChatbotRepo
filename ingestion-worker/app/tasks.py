import uuid
from datetime import datetime, timezone

from qdrant_client import QdrantClient
from qdrant_client.http import models as qmodels
from qdrant_client.http.exceptions import UnexpectedResponse

from app.celery_app import celery_app
from app.chunking.chunker import chunk_text
from app.config import get_settings
from app.db import update_document_status
from app.embeddings.embedder import embed_chunks
from app.extractors import extract_text

# Deterministic per-chunk point IDs, so re-ingesting the same document
# overwrites its old vectors on upsert instead of accumulating duplicates.
POINT_ID_NAMESPACE = uuid.UUID("6f6b0b9a-6e9e-4e6a-9b2a-6f6b0b9a6e9e")


def _get_client() -> QdrantClient:
    settings = get_settings()
    return QdrantClient(host=settings.qdrant_host, port=settings.qdrant_port)


def _ensure_collection(client: QdrantClient) -> None:
    settings = get_settings()
    try:
        client.get_collection(settings.collection_name)
    except UnexpectedResponse:
        client.create_collection(
            collection_name=settings.collection_name,
            vectors_config=qmodels.VectorParams(
                size=settings.embedding_dimensions,
                distance=qmodels.Distance.COSINE,
            ),
        )


def _delete_existing_points(client: QdrantClient, document_id: str) -> None:
    settings = get_settings()
    document_filter = qmodels.Filter(
        must=[
            qmodels.FieldCondition(
                key="document_id",
                match=qmodels.MatchValue(value=document_id),
            )
        ]
    )
    client.delete(collection_name=settings.collection_name, points_selector=document_filter)


@celery_app.task(name="app.tasks.ingest_document", bind=True, max_retries=3)
def ingest_document(
    self,
    document_id: str,
    file_path: str,
    source: str,
    approved: bool = True,
    confidential: bool = False,
) -> dict:
    settings = get_settings()

    update_document_status(document_id, "processing")

    try:
        text = extract_text(file_path)
        chunks = chunk_text(text)

        client = _get_client()
        _ensure_collection(client)

        # Re-ingestion (re-upload or reindex) must replace old vectors, not
        # accumulate them alongside the new ones.
        _delete_existing_points(client, document_id)

        if not chunks:
            update_document_status(
                document_id,
                "indexed",
                chunks_indexed=0,
                embedding_version=settings.embedding_version,
                indexed_at=datetime.now(timezone.utc),
            )
            return {"document_id": document_id, "chunks_indexed": 0}

        vectors = embed_chunks(chunks)

        points = [
            qmodels.PointStruct(
                id=str(
                    uuid.uuid5(POINT_ID_NAMESPACE, f"{document_id}-{index}")
                ),
                vector=vector,
                payload={
                    "document_id": document_id,
                    "chunk_id": f"{document_id}-{index}",
                    "embedding_version": settings.embedding_version,
                    "source": source,
                    "approved": approved,
                    "confidential": confidential,
                    "text": chunk,
                },
            )
            for index, (chunk, vector) in enumerate(zip(chunks, vectors))
        ]

        client.upsert(collection_name=settings.collection_name, points=points)

        update_document_status(
            document_id,
            "indexed",
            chunks_indexed=len(points),
            embedding_version=settings.embedding_version,
            indexed_at=datetime.now(timezone.utc),
        )

        return {"document_id": document_id, "chunks_indexed": len(points)}
    except Exception as error:
        update_document_status(document_id, "failed", error_message=str(error))
        raise
