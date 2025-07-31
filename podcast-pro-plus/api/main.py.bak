from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .routers import templates, episodes

app = FastAPI(
    title="Podcast Pro Plus API",
    description="The backend service for the Podcast Pro Plus application.",
    version="0.1.0",
)

# --- Add CORS Middleware ---
# This allows our React frontend (running on localhost:5173) to send requests to our backend.
origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
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
