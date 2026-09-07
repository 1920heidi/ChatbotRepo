from functools import lru_cache

from sentence_transformers import CrossEncoder

from app.config import get_settings


@lru_cache
def get_reranker() -> CrossEncoder:
    settings = get_settings()
    return CrossEncoder(settings.reranker_model)


def rerank(question: str, candidates: list[dict]) -> list[dict]:
    if not candidates:
        return []

    settings = get_settings()
    reranker = get_reranker()

    pairs = [(question, candidate["text"]) for candidate in candidates]
    scores = reranker.predict(pairs)

    ranked = sorted(
        zip(candidates, scores), key=lambda pair: pair[1], reverse=True
    )

    return [candidate for candidate, _ in ranked[: settings.final_k]]
