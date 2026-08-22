import os
import uuid
import logging
import aiofiles
from fastapi import UploadFile, HTTPException, status
from app.config import settings

logger = logging.getLogger(__name__)

ALLOWED_EXTENSIONS = {
    "voice": {".mp3", ".wav", ".m4a"},
    "video": {".mp4", ".mov"},
    "document": {".pdf", ".docx", ".txt"}
}

async def save_upload_file(file: UploadFile, content_type: str, contributor_id: str, entry_id: str) -> tuple[str, int]:
    """
    Validates and asynchronously saves an uploaded file to local disk storage.

    Returns:
        tuple[str, int]: (relative_file_url, file_size_bytes)
    
    Raises:
        HTTPException: 400 for bad file type / content type, 413 for oversized file.
    """
    if content_type not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported or invalid content type: {content_type}"
        )

    original_filename = file.filename or ""
    _, ext = os.path.splitext(original_filename.lower())
    if ext not in ALLOWED_EXTENSIONS[content_type]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File extension '{ext}' is not allowed for content type '{content_type}'"
        )

    # Create folder path structure: uploads/{contributor_id}/{entry_id}/
    target_dir = os.path.normpath(os.path.join(settings.UPLOAD_DIR, contributor_id, entry_id))
    os.makedirs(target_dir, exist_ok=True)

    # Generate unique filename using UUID
    unique_filename = f"{uuid.uuid4()}{ext}"
    target_path = os.path.join(target_dir, unique_filename)

    max_size_bytes = settings.MAX_UPLOAD_SIZE_MB * 1024 * 1024
    file_size_bytes = 0

    try:
        async with aiofiles.open(target_path, "wb") as out_file:
            while True:
                # Read file in 1MB chunks
                chunk = await file.read(1024 * 1024)
                if not chunk:
                    break
                file_size_bytes += len(chunk)
                if file_size_bytes > max_size_bytes:
                    raise HTTPException(
                        status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                        detail=f"File size exceeds maximum allowed limit of {settings.MAX_UPLOAD_SIZE_MB}MB"
                    )
                await out_file.write(chunk)
    except HTTPException:
        # Delete the incomplete/oversized file from disk
        if os.path.exists(target_path):
            try:
                os.remove(target_path)
            except Exception:
                pass
        raise
    except Exception as e:
        # Delete the incomplete file on other errors
        if os.path.exists(target_path):
            try:
                os.remove(target_path)
            except Exception:
                pass
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An error occurred while saving the file: {str(e)}"
        )

    # Use forward slash relative path for URL consistency
    relative_url = f"{settings.UPLOAD_DIR}/{contributor_id}/{entry_id}/{unique_filename}"
    return relative_url, file_size_bytes

def delete_file_from_disk(file_url: str) -> None:
    """
    Deletes the file at the given relative URL from the local disk.
    Also cleans up empty parent directories.
    """
    if not file_url:
        return

    normalized_path = os.path.normpath(file_url)
    if os.path.exists(normalized_path):
        try:
            os.remove(normalized_path)
            # Cleanup entry-level directory if empty
            parent_dir = os.path.dirname(normalized_path)
            if os.path.exists(parent_dir) and not os.listdir(parent_dir):
                os.rmdir(parent_dir)
                # Cleanup contributor-level directory if empty
                grandparent_dir = os.path.dirname(parent_dir)
                if os.path.exists(grandparent_dir) and not os.listdir(grandparent_dir):
                    os.rmdir(grandparent_dir)
            logger.info(f"Successfully deleted file from disk: {normalized_path}")
        except Exception as e:
            logger.error(f"Failed to delete file {normalized_path} from disk: {e}")
