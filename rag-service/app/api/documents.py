from fastapi import APIRouter
from pydantic import BaseModel

from app.vector_store.qdrant_client import (
    delete_by_document_id,
    list_chunks,
    set_approved,
    set_chunk_confidential,
    set_confidential,
)

router = APIRouter()


class ConfidentialUpdate(BaseModel):
    confidential: bool


class ApprovedUpdate(BaseModel):
    approved: bool


@router.delete("/documents/{document_id}")
def delete_document(document_id: str) -> dict:
    points_deleted = delete_by_document_id(document_id)
    return {"document_id": document_id, "points_deleted": points_deleted}


@router.patch("/documents/{document_id}/confidential")
def update_confidential(document_id: str, body: ConfidentialUpdate) -> dict:
    points_updated = set_confidential(document_id, body.confidential)
    return {
        "document_id": document_id,
        "confidential": body.confidential,
        "points_updated": points_updated,
    }


@router.patch("/documents/{document_id}/approved")
def update_approved(document_id: str, body: ApprovedUpdate) -> dict:
    points_updated = set_approved(document_id, body.approved)
    return {
        "document_id": document_id,
        "approved": body.approved,
        "points_updated": points_updated,
    }


@router.get("/documents/{document_id}/chunks")
def get_chunks(document_id: str) -> dict:
    return {"chunks": list_chunks(document_id)}


@router.patch("/documents/{document_id}/chunks/{chunk_id}/confidential")
def update_chunk_confidential(
    document_id: str, chunk_id: str, body: ConfidentialUpdate
) -> dict:
    points_updated = set_chunk_confidential(chunk_id, body.confidential)
    return {
        "chunk_id": chunk_id,
        "confidential": body.confidential,
        "points_updated": points_updated,
    }
