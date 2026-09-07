from functools import lru_cache

from qdrant_client import QdrantClient
from qdrant_client.http import models as qmodels
from qdrant_client.http.exceptions import UnexpectedResponse

from app.config import get_settings


@lru_cache
def get_client() -> QdrantClient:
    settings = get_settings()
    return QdrantClient(host=settings.qdrant_host, port=settings.qdrant_port)


def ensure_collection_ready() -> None:
    """Fail fast at startup if the versioned collection hasn't been built yet.

    Prevents the service from serving queries against a collection that
    doesn't exist (or existed under a different embedding version).
    """
    settings = get_settings()
    client = get_client()
    try:
        client.get_collection(settings.collection_name)
    except UnexpectedResponse as error:
        raise RuntimeError(
            f"Qdrant collection '{settings.collection_name}' does not exist. "
            f"Run the ingestion worker to build it for embedding version "
            f"{settings.embedding_version} before starting rag-service."
        ) from error


def _document_filter(document_id: str) -> qmodels.Filter:
    return qmodels.Filter(
        must=[
            qmodels.FieldCondition(
                key="document_id",
                match=qmodels.MatchValue(value=document_id),
            )
        ]
    )


def delete_by_document_id(document_id: str) -> int:
    settings = get_settings()
    client = get_client()
    document_filter = _document_filter(document_id)

    count = client.count(
        collection_name=settings.collection_name,
        count_filter=document_filter,
    ).count

    client.delete(
        collection_name=settings.collection_name,
        points_selector=document_filter,
    )

    return count


def set_confidential(document_id: str, confidential: bool) -> int:
    """Bulk-sets every chunk of a document to the same confidential value.

    Individual chunks can be overridden afterward via set_chunk_confidential;
    this is meant as a reset-everything action, e.g. when first flagging a
    document as confidential.
    """
    settings = get_settings()
    client = get_client()
    document_filter = _document_filter(document_id)

    count = client.count(
        collection_name=settings.collection_name,
        count_filter=document_filter,
    ).count

    client.set_payload(
        collection_name=settings.collection_name,
        payload={"confidential": confidential},
        points=document_filter,
    )

    return count


def set_approved(document_id: str, approved: bool) -> int:
    """Bulk-sets every chunk of a document's approval state."""
    settings = get_settings()
    client = get_client()
    document_filter = _document_filter(document_id)

    count = client.count(
        collection_name=settings.collection_name,
        count_filter=document_filter,
    ).count

    client.set_payload(
        collection_name=settings.collection_name,
        payload={"approved": approved},
        points=document_filter,
    )

    return count


def list_chunks(document_id: str) -> list[dict]:
    settings = get_settings()
    client = get_client()

    points, _ = client.scroll(
        collection_name=settings.collection_name,
        scroll_filter=_document_filter(document_id),
        limit=1000,
        with_payload=True,
        with_vectors=False,
    )

    chunks = [
        {
            "chunk_id": point.payload.get("chunk_id"),
            "text": point.payload.get("text", ""),
            "confidential": point.payload.get("confidential", False),
        }
        for point in points
    ]

    chunks.sort(key=lambda chunk: chunk["chunk_id"] or "")
    return chunks


def _chunk_filter(chunk_id: str) -> qmodels.Filter:
    return qmodels.Filter(
        must=[
            qmodels.FieldCondition(
                key="chunk_id",
                match=qmodels.MatchValue(value=chunk_id),
            )
        ]
    )


def set_chunk_confidential(chunk_id: str, confidential: bool) -> int:
    settings = get_settings()
    client = get_client()
    chunk_filter = _chunk_filter(chunk_id)

    count = client.count(
        collection_name=settings.collection_name,
        count_filter=chunk_filter,
    ).count

    client.set_payload(
        collection_name=settings.collection_name,
        payload={"confidential": confidential},
        points=chunk_filter,
    )

    return count
