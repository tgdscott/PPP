import shutil
from fastapi import APIRouter, UploadFile, File, HTTPException, status, Body
from pathlib import Path
from typing import List, Optional
from uuid import UUID  # <-- The missing import is added here

from pydub import AudioSegment

from ..services import audio_processor, transcription, ai_enhancer, keyword_detector

router = APIRouter(
    prefix="/episodes",
    tags=["Episodes"],
)

UPLOAD_DIR = Path("temp_uploads")
UPLOAD_DIR.mkdir(exist_ok=True)

@router.post("/upload", status_code=status.HTTP_201_CREATED)
async def upload_audio_file(file: UploadFile = File(...)):
    """Accepts an audio file and saves it to a temporary location on the server."""
    if not file.content_type.startswith("audio/"):
        raise HTTPException(status_code=400, detail="Invalid file type.")
    destination_path = UPLOAD_DIR / file.filename
    try:
        with open(destination_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
    finally:
        file.file.close()
    return {"filename": file.filename, "saved_path": str(destination_path)}

@router.post("/stitch", status_code=status.HTTP_200_OK)
async def stitch_episode(
    filenames: List[str] = Body(..., embed=True),
    output_filename: str = Body("stitched_episode", embed=True),
    background_music_filename: Optional[str] = Body(None, embed=True),
    normalize: bool = Body(True, embed=True)
):
    """Takes audio filenames, normalizes, stitches, and adds music."""
    try:
        final_path = audio_processor.stitch_audio_files(
            filenames=filenames,
            output_filename=output_filename,
            normalize_audio=normalize,
            background_music_filename=background_music_filename
        )
        return {"message": "Audio processed successfully!", "output_path": str(final_path)}
    except audio_processor.AudioProcessingError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/cleanup-audio/{filename}", status_code=status.HTTP_200_OK)
async def cleanup_audio_endpoint(
    filename: str,
    custom_filler_words: Optional[List[str]] = Body(None, embed=True),
    min_pause_s: float = Body(1.25, embed=True, description="The minimum pause duration in seconds to remove."),
    leave_pause_s: float = Body(0.5, embed=True, description="The duration of the pause to leave in seconds.")
):
    """
    Performs a full cleanup on an audio file, removing filler words and shortening long pauses in a single pass.
    """
    default_fillers = {"um", "uh", "ah", "er", "like", "you know", "so", "actually"}
    fillers_to_use = set(word.lower() for word in custom_filler_words) if custom_filler_words else default_fillers
    
    try:
        word_timestamps = transcription.get_word_timestamps(filename)
        audio_path = UPLOAD_DIR / filename
        if not audio_path.exists():
            raise HTTPException(status_code=404, detail=f"Audio file not found: {filename}")
        
        original_audio = AudioSegment.from_file(audio_path)
        leave_pause_ms = int(leave_pause_s * 1000)
        
        cleaned_audio = audio_processor.cleanup_audio(
            original_audio,
            word_timestamps,
            fillers_to_use,
            min_pause_s,
            leave_pause_ms
        )
        
        CLEANED_DIR = Path("cleaned_audio")
        CLEANED_DIR.mkdir(exist_ok=True)
        input_path = Path(filename)
        output_filename = f"cleaned_{input_path.stem}.mp3"
        output_path = CLEANED_DIR / output_filename
        cleaned_audio.export(output_path, format="mp3")
        
        return {
            "message": "Audio cleaned successfully!",
            "original_duration_ms": len(original_audio),
            "cleaned_duration_ms": len(cleaned_audio),
            "output_path": str(output_path)
        }
    except (transcription.TranscriptionError, audio_processor.AudioProcessingError) as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An unexpected error occurred: {e}")

@router.post("/generate-metadata/{filename}", status_code=status.HTTP_200_OK)
async def generate_metadata_endpoint(filename: str):
    """
    Generates a title, summary, and tags for an audio file using its transcript.
    """
    try:
        word_timestamps = transcription.get_word_timestamps(filename)
        
        if not word_timestamps:
            raise HTTPException(status_code=400, detail="Transcript is empty, cannot generate metadata.")

        full_transcript = " ".join([word['word'] for word in word_timestamps])

        metadata = ai_enhancer.generate_metadata_from_transcript(full_transcript)
        
        return metadata

    except (transcription.TranscriptionError, ai_enhancer.AIEnhancerError) as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An unexpected error occurred: {e}")

@router.post("/action/flubber/{filename}", status_code=status.HTTP_200_OK)
async def handle_flubber_action(filename: str):
    """
    Scans an audio file for the keyword "flubber", analyzes each occurrence
    for a repeated mistake, and removes the mistake if found.
    """
    try:
        word_timestamps = transcription.get_word_timestamps(filename)
        
        flubber_events = keyword_detector.find_keywords(word_timestamps, {"flubber"})
        
        if not flubber_events:
            return {"message": "No 'flubber' keyword found. No changes made."}

        segments_to_remove = []
        for event in flubber_events:
            segment = keyword_detector.analyze_flubber_instance(word_timestamps, event['index'])
            if segment:
                segments_to_remove.append(segment)

        if not segments_to_remove:
            return {"message": "Found 'flubber' keyword(s), but no repeated mistakes were detected."}

        audio_path = UPLOAD_DIR / filename
        if not audio_path.exists():
            raise HTTPException(status_code=404, detail=f"Audio file not found: {filename}")
        
        edited_audio = AudioSegment.from_file(audio_path)

        segments_to_remove.sort(key=lambda x: x[0], reverse=True)
        
        for start_s, end_s in segments_to_remove:
            edited_audio = audio_processor.remove_audio_segment(edited_audio, start_s, end_s)

        EDITED_DIR = Path("edited_audio")
        EDITED_DIR.mkdir(exist_ok=True)
        
        input_path = Path(filename)
        output_filename = f"flubber_removed_{input_path.stem}.mp3"
        output_path = EDITED_DIR / output_filename
        edited_audio.export(output_path, format="mp3")

        return {
            "message": f"Successfully removed {len(segments_to_remove)} repeated mistake(s).",
            "output_path": str(output_path)
        }

    except (transcription.TranscriptionError, audio_processor.AudioProcessingError) as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An unexpected error occurred: {e}")

@router.post("/action/replace-keyword/{filename}", status_code=status.HTTP_200_OK)
async def handle_keyword_replacement(
    filename: str,
    keyword: str = Body(..., embed=True, description="The keyword to find and replace (e.g., 'commercial')."),
    replacement_filename: str = Body(..., embed=True, description="The filename of the audio to insert.")
):
    """
    Replaces all occurrences of a specific keyword in an audio file with another audio clip.
    """
    try:
        word_timestamps = transcription.get_word_timestamps(filename)

        main_audio_path = UPLOAD_DIR / filename
        if not main_audio_path.exists():
            raise HTTPException(status_code=404, detail=f"Main audio file not found: {filename}")
        main_audio = AudioSegment.from_file(main_audio_path)

        replacement_audio_path = UPLOAD_DIR / replacement_filename
        if not replacement_audio_path.exists():
            raise HTTPException(status_code=404, detail=f"Replacement audio file not found: {replacement_filename}")
        replacement_audio = AudioSegment.from_file(replacement_audio_path)

        edited_audio = audio_processor.replace_keyword_with_audio(
            main_audio,
            word_timestamps,
            keyword.lower(),
            replacement_audio
        )

        EDITED_DIR = Path("edited_audio")
        EDITED_DIR.mkdir(exist_ok=True)
        
        input_path = Path(filename)
        output_filename = f"replaced_{keyword}_{input_path.stem}.mp3"
        output_path = EDITED_DIR / output_filename
        edited_audio.export(output_path, format="mp3")

        return {
            "message": f"Successfully replaced keyword '{keyword}' with '{replacement_filename}'.",
            "output_path": str(output_path)
        }
    except (transcription.TranscriptionError, audio_processor.AudioProcessingError) as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An unexpected error occurred: {e}")

@router.post("/action/intern/{filename}", status_code=status.HTTP_200_OK)
async def handle_intern_action(filename: str):
    """
    Handles the 'intern' command: interprets the command, gets an answer,
    generates speech, and splices it into the audio.
    """
    try:
        word_timestamps = transcription.get_word_timestamps(filename)
        intern_events = keyword_detector.find_keywords(word_timestamps, {"intern"})
        
        if not intern_events:
            return {"message": "No 'intern' keyword found."}

        first_event = intern_events[0]
        command_text = keyword_detector.get_text_after_keyword(word_timestamps, first_event)

        if not command_text:
            return {"message": "Found 'intern' keyword, but no command followed."}

        interpretation = ai_enhancer.interpret_intern_command(command_text)
        action = interpretation.get("action")
        topic = interpretation.get("topic")

        if action != "generate_audio":
            return {"message": f"Intern command action '{action}' is not yet implemented."}

        answer_text = ai_enhancer.get_answer_for_topic(topic)
        generated_speech = ai_enhancer.generate_speech_from_text(answer_text)

        original_audio = AudioSegment.from_file(UPLOAD_DIR / filename)
        
        command_words = command_text.split()
        last_word_of_command = None
        for i in range(first_event['index'] + 1, len(word_timestamps)):
             if word_timestamps[i]['word'] in command_words:
                 last_word_of_command = word_timestamps[i]
        
        insert_timestamp_s = last_word_of_command['end'] if last_word_of_command else first_event['end_time_s']

        final_audio = audio_processor.insert_audio_at_timestamp(original_audio, generated_speech, insert_timestamp_s)

        EDITED_DIR = Path("edited_audio")
        EDITED_DIR.mkdir(exist_ok=True)
        input_path = Path(filename)
        output_filename = f"intern_action_{input_path.stem}.mp3"
        output_path = EDITED_DIR / output_filename
        final_audio.export(output_path, format="mp3")

        return {
            "message": "Intern action 'generate_audio' completed successfully.",
            "topic": topic,
            "generated_response": answer_text,
            "output_path": str(output_path)
        }

    except (transcription.TranscriptionError, ai_enhancer.AIEnhancerError, audio_processor.AudioProcessingError) as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An unexpected error occurred: {e}")

@router.post("/assemble-from-template", status_code=status.HTTP_200_OK)
async def assemble_episode_from_template_endpoint(
    template_id: UUID = Body(..., embed=True, description="The ID of the template to use."),
    main_content_filename: str = Body(..., embed=True, description="The filename of the main content audio."),
    output_filename: str = Body("final_episode", embed=True, description="The desired name for the output file.")
):
    """
    Assembles a complete podcast episode using an advanced template, including
    generating AI segments and applying complex music rules.
    """
    from . import templates as template_router

    if template_id not in template_router.db:
        raise HTTPException(status_code=404, detail=f"Template with ID {template_id} not found.")
    
    template = template_router.db[template_id]

    try:
        final_path = audio_processor.assemble_episode_from_template(
            template=template,
            main_content_filename=main_content_filename,
            output_filename=output_filename
        )
        return {"message": "Episode assembled successfully from template!", "output_path": str(final_path)}
    except (audio_processor.AudioProcessingError, ai_enhancer.AIEnhancerError) as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"An unexpected error occurred: {e}")
