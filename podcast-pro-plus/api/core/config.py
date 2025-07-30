from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    # This tells Pydantic to load variables from a .env file
    OPENAI_API_KEY: str = "YOUR_API_KEY_HERE"
    ELEVENLABS_API_KEY: str = "YOUR_API_KEY_HERE"
    SPREAKER_API_TOKEN: str = "YOUR_SPREAKER_TOKEN_HERE"

    class Config:
        env_file = ".env"

# Create an instance of the settings
settings = Settings()
