# backend/app/main.py

# Import the core FastAPI framework class to instantiate our web server.
from fastapi import FastAPI
# Import CORSMiddleware to allow our React frontend to communicate with this API without security blocks.
from fastapi.middleware.cors import CORSMiddleware
# Import our validated settings object from the config module we just created.
from app.core.config import settings

# Define a factory function to construct and configure the FastAPI application instance.
def get_application() -> FastAPI:
    # Initialize the FastAPI app with the title, version, and route configurations from our settings.
    app = FastAPI(
        title=settings.PROJECT_NAME,
        version=settings.VERSION,
        # Dynamically set the OpenAPI JSON schema URL based on our API_V1_STR prefix.
        openapi_url=f"{settings.API_V1_STR}/openapi.json"
    )

    # Attach the CORS middleware to the application to handle cross-origin requests.
    app.add_middleware(
        CORSMiddleware,
        # Explicitly whitelist the default React development server port (3000) for incoming traffic.
        allow_origins=["http://localhost:3000"],
        # Allow cookies and authentication credentials to be passed between frontend and backend.
        allow_credentials=True,
        # Permit all HTTP methods (GET, POST, PUT, DELETE, etc.).
        allow_methods=["*"],
        # Permit all HTTP headers in the requests.
        allow_headers=["*"],
    )

    # Return the fully configured FastAPI application instance.
    return app

# Call the factory function to create the global 'app' object that Uvicorn will serve.
app = get_application()

# Define a simple GET endpoint at the root "/health" path to monitor server uptime.
# Tag this endpoint as "System" so it groups neatly in the Swagger UI documentation.
@app.get("/health", tags=["System"])
# Define the asynchronous handler function for the health check route.
async def health_check():
    # Return a JSON dictionary confirming the API is responsive, returning its name and version.
    return {
        "status": "healthy",
        "service": settings.PROJECT_NAME,
        "version": settings.VERSION
    }