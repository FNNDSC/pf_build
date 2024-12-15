from fastapi import FastAPI, APIRouter
from fastapi.middleware.cors import CORSMiddleware
from app.api.v1.routes import credentialRouter
from app.models.bootstrapModel import BootstrapModel
from app.api.v1.routes.usersRouter import router as user_router  # Example route
from app.api.v1.routes.credentialRouter import router as credential_router
from app.api.v1.routes.bootstrapRouter import router as bootstrap_router
from os import path
from typing import List, Dict
import toml

# Metadata for OpenAPI documentation
tags_metadata: List[Dict[str, str]] = [
    {
        "name": "Bootstrap services",
        "description": """
            Provide API endpoints for bootstrapping a ChRIS plugin application
            with user-specified configurations.
        """,
    },
    {
        "name": "Credentialling services",
        "description": """
            Provide API endpoints for setting a vaultKey which is used to unlock
            sensitive data.
            """,
    },
    {
        "name": "Users services",
        "description": """
            Endpoints for managing user-related operations.
        """,
    },
]

# Parse ABOUT and VERSION from pyproject.toml
# Resolve the project root directory dynamically
project_root: str = path.abspath(path.join(path.dirname(__file__), ".."))
# Path to pyproject.toml in the project root
pyproject_path: str = path.join(project_root, "pyproject.toml")
pyproject_data: Dict = toml.load(pyproject_path)

str_name: str = pyproject_data["project"]["name"]
str_about: str = pyproject_data["project"]["description"]
str_version: str = pyproject_data["project"]["version"]

print(f"Starting server '{str_name}:{str_version}' -- {str_about}")

# Create FastAPI app instance
app: FastAPI = FastAPI(
    title="Bootstrap API Service",
    version=str_version,
    description=str_about,
    openapi_tags=tags_metadata,
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "OPTIONS"],
    allow_headers=["*"],
)

# Include routers
app.include_router(bootstrap_router, prefix="/api/vi")
app.include_router(user_router, prefix="/api/v1")
app.include_router(credential_router, prefix="/api/v1")
