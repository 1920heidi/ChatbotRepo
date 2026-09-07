from functools import lru_cache

from sentence_transformers import SentenceTransformer

from app.config import get_settings


@lru_cache
def get_model() -> SentenceTransformer:
    settings = get_settings()
    return SentenceTransformer(settings.embedding_model)


def embed_query(text: str) -> list[float]:
    model = get_model()
    vector = model.encode(text, normalize_embeddings=True)
    return vector.tolist()
