import os
import logging
import asyncio
from pypdf import PdfReader
import docx
from app.config import settings

logger = logging.getLogger(__name__)

class DocumentExtractionError(Exception):
    pass

def _extract_txt(file_path: str) -> str:
    try:
        with open(file_path, "r", encoding="utf-8") as f:
            return f.read()
    except UnicodeDecodeError:
        logger.warning(f"UTF-8 decoding failed for {file_path}. Trying fallback with replace error handler.")
        try:
            with open(file_path, "r", encoding="utf-8", errors="replace") as f:
                return f.read()
        except Exception as e:
            logger.error(f"Fallback text extraction failed for {file_path}: {e}", exc_info=True)
            raise DocumentExtractionError("Failed to read text document with fallback encoding.")
    except Exception as e:
        logger.error(f"Text file read error: {e}", exc_info=True)
        raise DocumentExtractionError("Failed to read text document.")

def _extract_pdf(file_path: str) -> str:
    try:
        reader = PdfReader(file_path)
        pages_text = []
        for i, page in enumerate(reader.pages):
            text = page.extract_text()
            if text:
                pages_text.append(text)
        return "\n".join(pages_text)
    except Exception as e:
        logger.error(f"PDF extraction failed for {file_path}: {e}", exc_info=True)
        raise DocumentExtractionError("Failed to extract text from PDF document.")

def _extract_docx(file_path: str) -> str:
    try:
        doc = docx.Document(file_path)
        paragraphs_text = []
        for para in doc.paragraphs:
            if para.text and para.text.strip():
                paragraphs_text.append(para.text)
        return "\n".join(paragraphs_text)
    except Exception as e:
        logger.error(f"DOCX extraction failed for {file_path}: {e}", exc_info=True)
        raise DocumentExtractionError("Failed to extract text from Word document.")

async def extract_text_from_document(file_path: str, extension: str) -> str:
    """
    Extracts text from a document (.txt, .pdf, .docx).
    
    Returns:
        str: Extracted and stripped text content.
    """
    if not os.path.exists(file_path):
        raise DocumentExtractionError(f"Document file not found at path: {file_path}")
        
    ext = extension.lower()
    if not ext.startswith("."):
        ext = f".{ext}"
        
    if ext not in [".txt", ".pdf", ".docx"]:
        raise DocumentExtractionError(f"Unsupported document extension: {ext}")
        
    try:
        if ext == ".txt":
            content = await asyncio.to_thread(_extract_txt, file_path)
        elif ext == ".pdf":
            content = await asyncio.to_thread(_extract_pdf, file_path)
        elif ext == ".docx":
            content = await asyncio.to_thread(_extract_docx, file_path)
        else:
            raise DocumentExtractionError(f"Unsupported extension: {ext}")
            
        stripped_content = content.strip()
        if not stripped_content:
            logger.warning(f"No readable text could be extracted from document: {file_path}. Using placeholder.")
            return f"[Document text placeholder for {ext} — no extractable text layer found (scanned or image-based document).]"
            
        return stripped_content
    except DocumentExtractionError:
        raise
    except Exception as e:
        logger.error(f"Unexpected document extraction error: {e}", exc_info=True)
        raise DocumentExtractionError("Text could not be extracted from the uploaded document.")
