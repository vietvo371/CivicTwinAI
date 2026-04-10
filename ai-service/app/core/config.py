import os
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    PROJECT_NAME: str = "CivicTwin AI Service"
    VERSION: str = "1.0.0"
    
    # DB Configuration (Defaults to match Laravel's .env)
    DB_HOST: str = "127.0.0.1"
    DB_PORT: str = "5432"
    DB_DATABASE: str = "civictwin"
    DB_USERNAME: str = "postgres"
    DB_PASSWORD: str = "secret"
    
    @property
    def DATABASE_URL(self) -> str:
        # Check if environment variable DATABASE_URL is set directly
        env_url = os.getenv("DATABASE_URL")
        if env_url:
            if env_url.startswith("postgresql://"):
                return env_url.replace("postgresql://", "postgresql+asyncpg://")
            return env_url
        
        # Otherwise build from component variables
        return f"postgresql+asyncpg://{self.DB_USERNAME}:{self.DB_PASSWORD}@{self.DB_HOST}:{self.DB_PORT}/{self.DB_DATABASE}"

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

settings = Settings()
