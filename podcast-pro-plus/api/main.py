from fastapi import FastAPI
from .routers import templates, episodes # We don't need to add publisher here, it's used by episodes.

# Create the main FastAPI application instance
app = FastAPI(
    title="Podcast Pro Plus API",
    description="The backend service for the Podcast Pro Plus application.",
    version="0.1.0",
)

# Include the routers in the main application
app.include_router(templates.router)
app.include_router(episodes.router)

@app.get("/", tags=["Root"])
async def read_root():
    """
    A simple root endpoint to confirm the API is running.
    """
    return {"message": "Welcome to the Podcast Pro Plus API!"}
