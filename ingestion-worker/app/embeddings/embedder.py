from functools import lru_cache

from sentence_transformers import SentenceTransformer

from app.config import get_settings


@lru_cache
def get_model() -> SentenceTransformer:
    settings = get_settings()
    return SentenceTransformer(settings.embedding_model)


def embed_chunks(chunks: list[str]) -> list[list[float]]:
    settings = get_settings()
    model = get_model()
    vectors = model.encode(
        chunks,
        batch_size=settings.embedding_batch_size,
        normalize_embeddings=True,
        show_progress_bar=False,
    )
    return vectors.tolist()
