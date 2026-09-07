from qdrant_client.http import models as qmodels

from app.config import get_settings
from app.embeddings.embedder import embed_query
from app.vector_store.qdrant_client import get_client


def search_candidates(question: str) -> list[dict]:
    settings = get_settings()
    client = get_client()
    query_vector = embed_query(question)

    # Points from before the confidential flag existed have no such key in
    # their payload; must_not only excludes points that explicitly match
    # confidential=True, so those legacy points correctly stay searchable.
    #
    # approved is the opposite case: every point ever written has always
    # had it set (default True), so it's safe to require it as a hard
    # `must` — nothing falls through a legacy gap.
    citizen_visible = qmodels.Filter(
        must=[
            qmodels.FieldCondition(
                key="approved",
                match=qmodels.MatchValue(value=True),
            )
        ],
        must_not=[
            qmodels.FieldCondition(
                key="confidential",
                match=qmodels.MatchValue(value=True),
            )
        ],
    )

    results = client.query_points(
        collection_name=settings.collection_name,
        query=query_vector,
        query_filter=citizen_visible,
        limit=settings.candidate_k,
    ).points

    return [
        {
            "text": point.payload.get("text", ""),
            "document_id": point.payload.get("document_id"),
            "chunk_id": point.payload.get("chunk_id"),
            "source": point.payload.get("source"),
            "score": point.score,
        }
        for point in results
    ]
