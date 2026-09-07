from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app.llm.client import generate_answer
from app.retrieval.reranker import rerank
from app.retrieval.search import search_candidates

router = APIRouter()


class QueryRequest(BaseModel):
    question: str


class Source(BaseModel):
    document_id: str | None
    source: str | None
    score: float


class QueryResponse(BaseModel):
    answer: str
    sources: list[Source]


@router.post("/query", response_model=QueryResponse)
async def query(request: QueryRequest) -> QueryResponse:
    question = request.question.strip()
    if not question:
        raise HTTPException(status_code=400, detail="question is required")

    candidates = search_candidates(question)
    if not candidates:
        return QueryResponse(
            answer="I don't have verified information on that yet.",
            sources=[],
        )

    top_chunks = rerank(question, candidates)
    answer = await generate_answer(question, top_chunks)

    return QueryResponse(
        answer=answer,
        sources=[
            Source(
                document_id=chunk["document_id"],
                source=chunk["source"],
                score=chunk["score"],
            )
            for chunk in top_chunks
        ],
    )
