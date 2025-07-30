# Podcast Pro Plus API

## Project Overview

Podcast Pro Plus is a web-based application designed to automate the most tedious parts of podcast production. The goal is to create a system where a user can upload raw audio files, define a template for their show's structure, and have the application automatically handle audio assembly, AI-powered cleanup, transcription, and metadata generation (show notes, tags, etc.).

The primary user persona is a podcaster aged 50-70 with average to below-average technical savvy, so the final user interface must be extremely intuitive and user-friendly.

---

## Current Status (As of July 30, 2025)

The project has completed the core backend functionality and is now beginning frontend development.

**Completed Functionality:**
* **Phase 1: Core Audio Assembly:** Stitching, normalization, and basic background music.
* **Phase 2: AI Content Processing:** Transcription, filler/pause removal, and metadata generation.
* **Phase 3: Advanced Keyword Functionality:** "Flubber," "Commercial," and a fully implemented "Intern" command with ElevenLabs TTS.
* **Advanced Templates:** A powerful, rule-based template system is in place, supporting both static and AI-generated audio segments, along with complex, rule-based background music.

**Next Steps:**
* Build the frontend UI, starting with the Template Editor.
* Connect the frontend to the backend API.
* Implement Phase 4: Publishing to podcast hosts.

---

## Project Structure

The project uses a FastAPI backend with the following structure:

-   `/api/`: The main FastAPI application.
    -   `/core/`: Core configuration, including API key management (`config.py`).
    -   `/models/`: Pydantic data models for the database schema (`user.py`, `podcast.py`).
    -   `/routers/`: API endpoints that define the routes (`templates.py`, `episodes.py`).
    -   `/services/`: The business logic of the application (`audio_processor.py`, `transcription.py`, `ai_enhancer.py`, `keyword_detector.py`, `publisher.py`).
    -   `main.py`: The entry point for the FastAPI application.
-   `...` (other project folders)

---

## Setup and Installation

To set up a new development environment for this project, follow these steps:

1.  **Prerequisites:**
    * Install Python 3.12.
    * Install FFmpeg and ensure it is available in your system's PATH.

2.  **Create and Activate Virtual Environment:**
    ```bash
    py -3.12 -m venv venv
    source venv/Scripts/activate
    ```

3.  **Install Dependencies:**
    ```bash
    pip install -r requirements.txt
    ```

4.  **Configure Environment Variables:**
    Create a `.env` file in the root directory for your secret API keys.
    ```bash
    echo 'OPENAI_API_KEY="YOUR_API_KEY_GOES_HERE"' > .env
    echo 'ELEVENLABS_API_KEY="YOUR_API_KEY_GOES_HERE"' >> .env
    echo 'SPREAKER_API_TOKEN="YOUR_API_KEY_GOES_HERE"' >> .env
    ```
    *Replace the placeholder text with your actual API keys.*

---

## How to Run the Application

With your virtual environment active, run the following command from the project's root directory:
```bash
uvicorn api.main:app --reload
The API will be available at http://127.0.0.1:8000.
