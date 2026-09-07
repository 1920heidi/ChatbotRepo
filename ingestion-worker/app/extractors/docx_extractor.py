from docx import Document


def extract(file_path: str) -> str:
    document = Document(file_path)
    return "\n\n".join(paragraph.text for paragraph in document.paragraphs)
