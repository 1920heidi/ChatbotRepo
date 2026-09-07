import os
from functools import lru_cache

import yaml

SHARED_CONFIG_PATH = os.environ.get(
    "SHARED_CONFIG_PATH", "/shared-config/ai-config.yaml"
)


class Settings:
    def __init__(self, raw: dict):
        self.embedding_model = raw["embedding"]["model"]
        self.embedding_version = raw["embedding"]["version"]
        self.embedding_dimensions = raw["embedding"]["dimensions"]

        self.vector_store_provider = raw["vector_store"]["provider"]
        self.qdrant_host = os.environ.get("QDRANT_HOST", raw["vector_store"]["host"])
        self.qdrant_port = int(os.environ.get("QDRANT_PORT", raw["vector_store"]["port"]))
        # Versioned collection: mixing embedding versions in one collection
        # silently degrades retrieval, so the version is baked into the name.
        base_collection = raw["vector_store"]["collection"]
        self.collection_name = f"{base_collection}_v{self.embedding_version}"

        self.candidate_k = raw["retrieval"]["candidate_k"]
        self.final_k = raw["retrieval"]["final_k"]
        self.reranker_model = raw["retrieval"]["reranker_model"]

        self.llm_model = raw["llm"]["model"]
        self.llm_host = os.environ.get("LLM_HOST", raw["llm"]["host"])
        self.llm_port = int(os.environ.get("LLM_PORT", raw["llm"]["port"]))


@lru_cache
def get_settings() -> Settings:
    with open(SHARED_CONFIG_PATH, "r") as f:
        raw = yaml.safe_load(f)
    return Settings(raw)
