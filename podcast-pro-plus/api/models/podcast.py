from pydantic import BaseModel, Field, HttpUrl
from typing import List, Optional, Literal, Union
from datetime import datetime
from uuid import UUID, uuid4

class StaticSegmentSource(BaseModel):
    source_type: Literal["static"] = "static"
    filename: str = Field(..., description="The filename of the uploaded audio in temp_uploads.")

class AIGeneratedSegmentSource(BaseModel):
    source_type: Literal["ai_generated"] = "ai_generated"
    prompt: str = Field(..., description="The text prompt for the AI to generate the script.")
    voice_id: str = Field("19B4gjtpL5m876wS3Dfg", description="The ElevenLabs voice ID to use for generation.")

class TTSSegmentSource(BaseModel):
    source_type: Literal["tts"] = "tts"
    script: str = Field("", description="The exact text to be converted to speech. Can be overridden per episode.")
    voice_id: str = Field("19B4gjtpL5m876wS3Dfg", description="The ElevenLabs voice ID to use for generation.")

class TemplateSegment(BaseModel):
    id: UUID = Field(default_factory=uuid4)
    segment_type: Literal["intro", "content", "outro", "commercial", "sound_effect", "transition"]
    source: Union[StaticSegmentSource, AIGeneratedSegmentSource, TTSSegmentSource] = Field(..., discriminator='source_type')

class BackgroundMusicRule(BaseModel):
    id: UUID = Field(default_factory=uuid4)
    music_filename: str = Field(..., description="The filename of the background music track.")
    apply_to_segments: List[Literal["intro", "content", "outro"]]
    start_offset_s: float = Field(0.0)
    end_offset_s: float = Field(0.0)
    fade_in_s: float = Field(2.0)
    fade_out_s: float = Field(3.0)
    volume_db: int = Field(-15)

class SegmentTiming(BaseModel):
    """Defines overlap and timing rules between major segment blocks."""
    content_start_offset_s: float = Field(-2.0, description="How many seconds before the intro block ends the content should start. Negative for overlap.")
    outro_start_offset_s: float = Field(-5.0, description="How many seconds before the content block ends the outro should start. Negative for overlap.")

class PodcastTemplate(BaseModel):
    id: UUID = Field(default_factory=uuid4)
    user_id: UUID = Field(..., description="The user who owns this template")
    name: str = Field(..., description="User-defined name for the template")
    segments: List[TemplateSegment]
    background_music_rules: List[BackgroundMusicRule] = Field(default_factory=list)
    timing: SegmentTiming = Field(default_factory=SegmentTiming)

# (Existing Episode and AudioSegment models remain the same)
class AudioSegment(BaseModel):
    id: UUID = Field(default_factory=uuid4)
    source_name: str
    storage_path: str
    duration_seconds: float = Field(0.0)
    segment_type: Literal["intro", "content", "outro", "commercial", "sound_effect", "transition"]

class Episode(BaseModel):
    id: UUID = Field(default_factory=uuid4)
    user_id: UUID
    template_id: UUID
    title: Optional[str] = None
    show_notes: Optional[str] = None
    tags: List[str] = Field(default_factory=list)
    status: Literal["pending", "processing", "processed", "published", "error"] = "pending"
    created_at: datetime = Field(default_factory=datetime.utcnow)
    publish_date: Optional[datetime] = None
    final_audio_path: Optional[str] = None
    transcript_path: Optional[str] = None
    cover_image_url: Optional[HttpUrl] = None
