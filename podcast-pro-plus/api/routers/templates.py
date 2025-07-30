from fastapi import APIRouter, HTTPException, status
from typing import Dict
from uuid import UUID, uuid4

# Import the new, advanced PodcastTemplate model
from ..models.podcast import PodcastTemplate

# Create an API router
router = APIRouter(
    prefix="/templates",
    tags=["Templates"],
)

# --- In-Memory Database ---
# This is a temporary stand-in for a real database.
# We use a simple dictionary to store templates, with the key being the template's UUID.
db: Dict[UUID, PodcastTemplate] = {}


@router.post("/", response_model=PodcastTemplate, status_code=status.HTTP_201_CREATED)
async def create_template(template_in: PodcastTemplate):
    """
    Create a new, advanced podcast template.

    This endpoint accepts the full template structure, including the list of
    segments (static or AI-generated) and background music rules.
    """
    # In a real application, the user_id would come from an authentication token.
    # We are assigning it directly from the input for now.
    template_in.id = uuid4() # Assign a new unique ID to the template
    db[template_in.id] = template_in
    return template_in


@router.get("/{template_id}", response_model=PodcastTemplate)
async def get_template(template_id: UUID):
    """
    Retrieve an advanced podcast template by its ID.
    """
    if template_id not in db:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Template with ID {template_id} not found",
        )
    return db[template_id]
