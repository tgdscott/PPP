import shutil
from fastapi import APIRouter, UploadFile, File, HTTPException, status, Body
from pydantic import BaseModel
from pathlib import Path
from typing import List, Optional, Dict
from uuid import UUID

from pydub import AudioSegment

from ..services import audio_processor, transcription, ai_enhancer, keyword_detector
from . import templates as template_router

router = APIRouter(
    prefix="/episodes",
    tags=["Episodes"],
)

class CleanupOptions(BaseModel):
    removePauses: bool = True
    removeFillers: bool = True
    checkForFlubber: bool = True
    checkForIntern: bool = True

@router.post("/process-and-assemble", status_code=status.HTTP_200_OK)
async def process_and_assemble_endpoint(
    template_id: UUID = Body(..., embed=True),
    main_content_filename: str = Body(..., embed=True),
    output_filename: str = Body(..., embed=True),
    cleanup_options: CleanupOptions = Body(..., embed=True),
    tts_overrides: Dict[str, str] = Body({}, embed=True)
):
    """
    The master endpoint that runs the entire production workflow.
    """
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
