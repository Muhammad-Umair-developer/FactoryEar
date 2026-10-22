# backend/app/core/config.py

# Import BaseSettings from pydantic_settings to automatically load and validate environment variables.
from pydantic_settings import BaseSettings

# Define a Settings class that inherits from BaseSettings to enforce strict type checking on our configuration.
class Settings(BaseSettings):
    # Set the overarching project name, useful for Swagger UI documentation and logging.
    PROJECT_NAME: str = "Factory Ear API"
    
    # Define the current API version to help track breaking changes as the project evolves.
    VERSION: str = "1.0.0"
    
    # Establish a universal prefix for all API routes so we can easily route versioned traffic (e.g., /api/v1).
    API_V1_STR: str = "/api/v1"
    
    # Define the PostgreSQL database username, defaulting to "postgres" for local development.
    POSTGRES_USER: str = "postgres"
    
    # Define the PostgreSQL database password, defaulting to "postgres" for local development.
    POSTGRES_PASSWORD: str = "postgres"
    
    # Define the database server hostname, defaulting to "localhost" assuming the DB runs on the same machine.
    POSTGRES_SERVER: str = "localhost"
    
    # Define the database port, defaulting to 5432, which is the standard PostgreSQL port.
    POSTGRES_PORT: str = "5432"
    
    # Define the specific database name we will use to store machine profiles and acoustic anomalies.
    POSTGRES_DB: str = "factory_ear_db"
    
    # Define the Redis connection URL, required for caching model baselines and speeding up repetitive inference.
    REDIS_URL: str = "redis://localhost:6379/0"
    
    # Define the MLflow tracking URI so the backend knows where to fetch the latest registered Isolation Forest/CNN models.
    MLFLOW_TRACKING_URI: str = "http://localhost:5000"
    
    # Use the @property decorator to dynamically construct the database connection string on the fly.
    @property
    def SQLALCHEMY_DATABASE_URI(self) -> str:
        # Notice the addition of '+psycopg2' here
        return f"postgresql+psycopg2://{self.POSTGRES_USER}:{self.POSTGRES_PASSWORD}@{self.POSTGRES_SERVER}:{self.POSTGRES_PORT}/{self.POSTGRES_DB}"

    # Define an inner Config class to tell Pydantic where to look for these environment variables.
    class Config:
        # Instruct Pydantic to read overrides from a local .env file if it exists.
        env_file = ".env"

# Instantiate a global settings object so other files can import this single, validated configuration state.
settings = Settings()