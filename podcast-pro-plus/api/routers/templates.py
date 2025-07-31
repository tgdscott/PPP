import json
from fastapi import APIRouter, HTTPException, status
from typing import Dict, List, Any
from uuid import UUID, uuid4
from pathlib import Path

# Import the new, advanced PodcastTemplate model
from ..models.podcast import PodcastTemplate

# --- File-based Persistence ---
TEMPLATES_FILE = Path("templates.json")

def migrate_template_data(data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Checks for and migrates a single template dictionary from an old format to the new format.
    This makes the app resilient to changes in the template structure over time.
    """
    # Migration 1: Check for old segment format (pre-source object)
    if 'segments' in data and data['segments']:
        migrated_segments = []
        for seg in data['segments']:
            if 'source' not in seg:
                # This is the old format, migrate it to the new source structure
                migrated_segments.append({
                    "id": seg.get("id", str(uuid4())),
                    "segment_type": seg.get("segment_type"),
                    "source": {
                        "source_type": "static",
                        "filename": seg.get("filename", "")
                    }
                })
            else:
                migrated_segments.append(seg)
        data['segments'] = migrated_segments

    # Migration 2: Check if the 'timing' field is missing
    if 'timing' not in data:
        data['timing'] = {"content_start_offset_s": -2.0, "outro_start_offset_s": -5.0}
    
    return data

def load_templates_from_disk() -> Dict[UUID, PodcastTemplate]:
    """Loads templates from the JSON file, migrating old formats if necessary."""
    if not TEMPLATES_FILE.exists():
        return {}
    
    db = {}
    with open(TEMPLATES_FILE, "r") as f:
        try:
            templates_data = json.load(f)
            for id_str, template_data in templates_data.items():
                try:
                    # Attempt to migrate the data before parsing
                    migrated_data = migrate_template_data(template_data)
                    db[UUID(id_str)] = PodcastTemplate(**migrated_data)
                except Exception as e:
                    print(f"WARNING: Could not load/migrate template with ID {id_str}. Skipping. Error: {e}")
        except json.JSONDecodeError:
            print("WARNING: templates.json is corrupted or empty.")
            return {}
    return db

def save_templates_to_disk(db: Dict[UUID, PodcastTemplate]):
    """Saves the current templates dictionary to the JSON file."""
    serializable_db = {}
    for id, template in db.items():
        template_dict = json.loads(template.json())
        serializable_db[str(id)] = template_dict
    with open(TEMPLATES_FILE, "w") as f:
        json.dump(serializable_db, f, indent=2)

router = APIRouter(
    prefix="/templates",
    tags=["Templates"],
)

db: Dict[UUID, PodcastTemplate] = load_templates_from_disk()


@router.get("/", response_model=List[PodcastTemplate])
async def list_templates():
    """Retrieve a list of all saved podcast templates."""
    return list(db.values())


@router.post("/", response_model=PodcastTemplate, status_code=status.HTTP_201_CREATED)
async def create_template(template_in: PodcastTemplate):
    """Create a new, advanced podcast template and save it to disk."""
    template_in.id = uuid4()
    db[template_in.id] = template_in
    save_templates_to_disk(db)
    return template_in


@router.put("/{template_id}", response_model=PodcastTemplate)
async def update_template(template_id: UUID, template_in: PodcastTemplate):
    """Update an existing podcast template."""
    if template_id not in db:
        raise HTTPException(status_code=404, detail=f"Template with ID {template_id} not found")
    
    template_in.id = template_id
    db[template_id] = template_in
    save_templates_to_disk(db)
    return template_in


@router.get("/{template_id}", response_model=PodcastTemplate)
async def get_template(template_id: UUID):
    """Retrieve an advanced podcast template by its ID."""
    if template_id not in db:
        raise HTTPException(status_code=404, detail=f"Template with ID {template_id} not found")
    return db[template_id]
