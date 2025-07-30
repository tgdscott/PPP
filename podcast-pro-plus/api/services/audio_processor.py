import os
from pydub import AudioSegment
from pydub.effects import normalize
from pathlib import Path
from typing import List, Optional, Dict, Any, Set, Tuple
from thefuzz import fuzz

# Import the necessary models and services
from ..models.podcast import PodcastTemplate, TemplateSegment
from . import ai_enhancer

# The Recommended Fix: Tell pydub directly where FFmpeg is
AudioSegment.converter = "C:\\ffmpeg\\ffmpeg-7.1.1-essentials_build\\bin\\ffmpeg.exe"
AudioSegment.ffprobe   = "C:\\ffmpeg\\ffmpeg-7.1.1-essentials_build\\bin\\ffprobe.exe"


# Define paths for temporary and final output files
UPLOAD_DIR = Path("temp_uploads")
OUTPUT_DIR = Path("final_episodes")
AI_SEGMENTS_DIR = Path("ai_segments")
OUTPUT_DIR.mkdir(exist_ok=True)
AI_SEGMENTS_DIR.mkdir(exist_ok=True)

class AudioProcessingError(Exception):
    """Custom exception for audio processing failures."""
    pass

def assemble_episode_from_template(template: PodcastTemplate, main_content_filename: str, output_filename: str) -> Path:
    """
    Assembles a full podcast episode based on an advanced template.

    This function reads the template, generates any AI audio, stitches all
    segments, and applies complex background music rules.
    """
    
    # --- Step 1: Prepare all audio segments ---
    processed_segments: List[Tuple[TemplateSegment, AudioSegment]] = []
    
    for segment_rule in template.segments:
        audio = None
        if segment_rule.segment_type == 'content':
            # For the main content, load the user-provided file
            content_path = UPLOAD_DIR / main_content_filename
            if not content_path.exists():
                raise AudioProcessingError(f"Main content file not found: {main_content_filename}")
            audio = AudioSegment.from_file(content_path)
        
        elif segment_rule.source.source_type == 'static':
            # For static segments, load the file specified in the template
            static_path = UPLOAD_DIR / segment_rule.source.filename
            if not static_path.exists():
                raise AudioProcessingError(f"Static segment file not found: {segment_rule.source.filename}")
            audio = AudioSegment.from_file(static_path)

        elif segment_rule.source.source_type == 'ai_generated':
            # For AI segments, generate the audio
            print(f"Generating AI segment for prompt: {segment_rule.source.prompt}")
            generated_text = ai_enhancer.get_answer_for_topic(segment_rule.source.prompt)
            audio = ai_enhancer.generate_speech_from_text(generated_text, segment_rule.source.voice_id)
            # Save the generated segment for caching/debugging
            audio.export(AI_SEGMENTS_DIR / f"{segment_rule.id}.mp3", format="mp3")

        if audio:
            processed_segments.append((segment_rule, audio))

    # --- Step 2: Stitch the main audio track together ---
    final_audio = AudioSegment.empty()
    for _, audio_segment in processed_segments:
        final_audio += audio_segment

    # --- Step 3: Apply background music rules ---
    current_pos_ms = 0
    for segment_rule, audio_segment in processed_segments:
        segment_duration_ms = len(audio_segment)
        
        for music_rule in template.background_music_rules:
            if segment_rule.segment_type in music_rule.apply_to_segments:
                # This music rule applies to the current segment
                music_path = UPLOAD_DIR / music_rule.music_filename
                if not music_path.exists():
                    print(f"Warning: Music file not found, skipping rule: {music_rule.music_filename}")
                    continue
                
                background_music = AudioSegment.from_file(music_path)
                
                # Calculate the exact duration and position for the music
                start_pos = current_pos_ms + (music_rule.start_offset_s * 1000)
                end_pos = (current_pos_ms + segment_duration_ms) - (music_rule.end_offset_s * 1000)
                music_duration = end_pos - start_pos

                if music_duration <= 0:
                    continue

                # Loop the music if it's shorter than the required duration
                if len(background_music) < music_duration:
                    times_to_loop = (music_duration // len(background_music)) + 1
                    background_music = background_music * times_to_loop
                
                # Trim, fade, and adjust volume
                music_to_apply = background_music[:music_duration]
                music_to_apply = music_to_apply.fade_in(int(music_rule.fade_in_s * 1000)).fade_out(int(music_rule.fade_out_s * 1000))
                music_to_apply += music_rule.volume_db
                
                # Overlay the music at the correct position
                final_audio = final_audio.overlay(music_to_apply, position=start_pos)

        current_pos_ms += segment_duration_ms

    # --- Step 4: Normalize and export the final episode ---
    final_audio = normalize(final_audio)
    output_path = OUTPUT_DIR / f"{output_filename}.mp3"
    final_audio.export(output_path, format="mp3")
    
    return output_path
