import os

from app.extractors import docx_extractor, pdf_extractor, text_extractor

_EXTRACTORS = {
    ".pdf": pdf_extractor.extract,
    ".docx": docx_extractor.extract,
    ".txt": text_extractor.extract,
    ".md": text_extractor.extract,
}


def extract_text(file_path: str) -> str:
    extension = os.path.splitext(file_path)[1].lower()
    extractor = _EXTRACTORS.get(extension)
    if extractor is None:
        raise ValueError(f"No extractor registered for file type '{extension}'")
    return extractor(file_path)
