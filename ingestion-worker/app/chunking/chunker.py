from app.config import get_settings

_SEPARATORS = ["\n\n", "\n", ". ", " "]


def _split_on(text: str, separator: str) -> list[str]:
    return [piece for piece in text.split(separator) if piece.strip()]


def chunk_text(text: str) -> list[str]:
    settings = get_settings()
    chunk_size = settings.chunk_size
    overlap = settings.chunk_overlap

    pieces = _split_on(text, _SEPARATORS[0])

    chunks: list[str] = []
    buffer = ""

    for piece in pieces:
        candidate = f"{buffer}\n\n{piece}".strip() if buffer else piece

        if len(candidate) <= chunk_size:
            buffer = candidate
            continue

        if buffer:
            chunks.append(buffer)
            buffer = buffer[-overlap:] + "\n\n" + piece if overlap else piece
        else:
            # Single piece already exceeds chunk_size; hard-split it.
            for start in range(0, len(piece), chunk_size - overlap):
                chunks.append(piece[start : start + chunk_size])
            buffer = ""

    if buffer:
        chunks.append(buffer)

    return chunks
