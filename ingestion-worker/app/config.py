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
        self.embedding_batch_size = 32

        self.qdrant_host = os.environ.get("QDRANT_HOST", raw["vector_store"]["host"])
        self.qdrant_port = int(os.environ.get("QDRANT_PORT", raw["vector_store"]["port"]))
        # Must match rag-service's collection naming exactly, or ingested
        # vectors land somewhere query-time search never looks.
        base_collection = raw["vector_store"]["collection"]
        self.collection_name = f"{base_collection}_v{self.embedding_version}"

        self.chunk_size = raw["chunking"]["chunk_size"]
        self.chunk_overlap = raw["chunking"]["chunk_overlap"]


@lru_cache
def get_settings() -> Settings:
    with open(SHARED_CONFIG_PATH, "r") as f:
        raw = yaml.safe_load(f)
    return Settings(raw)
