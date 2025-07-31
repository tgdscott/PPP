import shutil
from fastapi import APIRouter, UploadFile, File, HTTPException, status, Body
from pydantic import BaseModel
from pathlib import Path
from typing import List, Optional, Dict
from uuid import UUID

from pydub import AudioSegment

from ..services import audio_processor, transcription, ai_enhancer, keyword_detector, publisher
from . import templates as template_router

router = APIRouter(
    prefix="/episodes",
    tags=["Episodes"],
)

UPLOAD_DIR = Path("temp_uploads")
CLEANED_DIR = Path("cleaned_audio")
EDITED_DIR = Path("edited_audio")
OUTPUT_DIR = Path("final_episodes")

class CleanupOptions(BaseModel):
    removePauses: bool = True
    removeFillers: bool = True
    checkForFlubber: bool = True
    checkForIntern: bool = True

def find_file_in_dirs(filename: str) -> Optional[Path]:
    """Helper to find a file in any of the possible output/upload directories."""
    for directory in [UPLOAD_DIR, CLEANED_DIR, EDITED_DIR, OUTPUT_DIR]:
        path = directory / filename
        if path.exists():
            return path
    return None

@router.post("/process-and-assemble", status_code=status.HTTP_200_OK)
async def process_and_assemble_endpoint(
    template_id: UUID = Body(..., embed=True),
    main_content_filename: str = Body(..., embed=True),
    output_filename: str = Body(..., embed=True),
    cleanup_options: CleanupOptions = Body(..., embed=True),
    tts_overrides: Dict[str, str] = Body({}, embed=True)
):
    """The master endpoint that runs the entire production workflow."""
    if template_id not in template_router.db:
        raise HTTPException(status_code=404, detail=f"Template with ID {template_id} not found.")
    template = template_router.db[template_id]
    try:
        final_path, log = audio_processor.process_and_assemble_episode(
            template=template,
            main_content_filename=main_content_filename,
            output_filename=output_filename,
            cleanup_options=cleanup_options.dict(),
            tts_overrides=tts_overrides
        )
        return {"message": "Episode processed and assembled successfully!", "output_path": str(final_path), "log": log}
    except (audio_processor.AudioProcessingError, ai_enhancer.AIEnhancerError, transcription.TranscriptionError) as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"An unexpected error occurred: {e}")

@router.post("/generate-metadata/{filename}", status_code=status.HTTP_200_OK)
async def generate_metadata_endpoint(filename: str):
    """Generates a title, summary, and tags for any processed audio file."""
    file_path = find_file_in_dirs(filename)
    if not file_path:
        raise HTTPException(status_code=404, detail=f"File '{filename}' not found in any directory.")
    try:
        # We need to re-upload the file for transcription as Whisper API works with uploads
        # This is a simplification; a more advanced system might use a cloud bucket URL
        temp_upload_path = UPLOAD_DIR / file_path.name
        shutil.copy(file_path, temp_upload_path)

        word_timestamps = transcription.get_word_timestamps(temp_upload_path.name)
        if not word_timestamps:
            raise HTTPException(status_code=400, detail="Transcript is empty.")
        
        full_transcript = " ".join([word['word'] for word in word_timestamps])
        metadata = ai_enhancer.generate_metadata_from_transcript(full_transcript)
        
        # Clean up the temporary copy
        os.remove(temp_upload_path)

        return metadata
    except (transcription.TranscriptionError, ai_enhancer.AIEnhancerError) as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An unexpected error occurred: {e}")

@router.post("/publish/spreaker/{filename}", status_code=status.HTTP_200_OK)
async def publish_to_spreaker(
    filename: str,
    show_id: str = Body(..., embed=True),
    title: str = Body(..., embed=True),
    description: Optional[str] = Body(None, embed=True)
):
    """Uploads a processed audio file to Spreaker as a draft."""
    file_to_upload = find_file_in_dirs(filename)
    if not file_to_upload:
        raise HTTPException(status_code=404, detail=f"File '{filename}' not found in any output directory.")
    try:
        client = publisher.SpreakerClient(api_token=settings.SPREAKER_API_TOKEN)
        success, message = client.upload_episode(
            show_id=show_id,
            title=title,
            file_path=str(file_to_upload),
            description=description
        )
        if not success:
            raise HTTPException(status_code=400, detail=message)
        return {"message": message}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An unexpected error occurred: {e}")
