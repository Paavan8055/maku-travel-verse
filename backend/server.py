from fastapi import FastAPI, APIRouter
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List
import uuid
from datetime import datetime
import json
import subprocess
from typing import Optional, List, Dict, Any


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")


# Define Models
class StatusCheck(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    client_name: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)

class StatusCheckCreate(BaseModel):
    client_name: str

class EnvironmentSwitch(BaseModel):
    environment: str

class EnvironmentConfig(BaseModel):
    environments: dict
    current_environment: str
    switch_mode: str
    last_updated: str

# Enhanced Dream System Models
class BehaviorSignal(BaseModel):
    signal_type: str
    value: float
    context: dict = {}

class InteractionData(BaseModel):
    destination_id: str
    interaction_type: str
    duration_seconds: Optional[int] = None
    device_type: str
    referrer: str

class UserProfileRequest(BaseModel):
    user_id: str

class DreamCollectionUpdate(BaseModel):
    user_id: str
    destination_id: str
    action: str  # 'add' or 'remove'

# Add your routes to the router instead of directly to app
@api_router.get("/")
async def root():
    return {"message": "Hello World"}

@api_router.post("/status", response_model=StatusCheck)
async def create_status_check(input: StatusCheckCreate):
    status_dict = input.dict()
    status_obj = StatusCheck(**status_dict)
    _ = await db.status_checks.insert_one(status_obj.dict())
    return status_obj

@api_router.get("/status", response_model=List[StatusCheck])
async def get_status_checks():
    status_checks = await db.status_checks.find().to_list(1000)
    return [StatusCheck(**status_check) for status_check in status_checks]

@api_router.get("/environment/config")
async def get_environment_config():
    """Get current environment configuration"""
    try:
        config_path = Path(__file__).parent.parent / "preview-config.json"
        with open(config_path, 'r') as f:
            config = json.load(f)
        return config
    except Exception as e:
        logger.error(f"Failed to read environment config: {e}")
        return {"error": "Failed to read environment configuration"}

@api_router.post("/environment/switch")
async def switch_environment(env_switch: EnvironmentSwitch):
    """Switch between lovable and emergent environments"""
    try:
        target_env = env_switch.environment
        
        if target_env not in ["lovable", "emergent"]:
            return {"error": "Invalid environment. Must be 'lovable' or 'emergent'"}
        
        # Run the switch script
        switch_script = Path(__file__).parent.parent / "scripts" / "switch-environment.js"
        result = subprocess.run(
            ["node", str(switch_script), target_env],
            capture_output=True,
            text=True,
            cwd=str(Path(__file__).parent.parent)
        )
        
        if result.returncode == 0:
            return {
                "success": True,
                "message": f"Successfully switched to {target_env} environment",
                "environment": target_env,
                "output": result.stdout
            }
        else:
            return {
                "success": False,
                "error": "Failed to switch environment",
                "output": result.stderr
            }
            
    except Exception as e:
        logger.error(f"Failed to switch environment: {e}")
        return {"error": f"Failed to switch environment: {str(e)}"}

@api_router.get("/environment/status")
async def get_environment_status():
    """Get current environment status"""
    try:
        # Run the status script
        status_script = Path(__file__).parent.parent / "scripts" / "preview-status.sh"
        result = subprocess.run(
            ["bash", str(status_script)],
            capture_output=True,
            text=True,
            cwd=str(Path(__file__).parent.parent)
        )
        
        # Also read the config file
        config_path = Path(__file__).parent.parent / "preview-config.json"
        with open(config_path, 'r') as f:
            config = json.load(f)
        
        return {
            "config": config,
            "status_output": result.stdout,
            "timestamp": datetime.utcnow().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Failed to get environment status: {e}")
        return {"error": f"Failed to get environment status: {str(e)}"}

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
