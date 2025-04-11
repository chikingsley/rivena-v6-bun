"""
Voice AI Service - FastAPI Application

This is the main entry point for the Voice AI microservice. It provides
API endpoints for managing bot sessions and integrates with the Elysia server.
"""

import os
import asyncio
import uuid
from typing import Dict, Any, Optional, List

import aiohttp
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, BackgroundTasks, Request
from fastapi.middleware.cors import CORSMiddleware
from loguru import logger
from pydantic import BaseModel, Field

from bot import VoiceBotManager
from utils.room_pool import RoomPool

# Load environment variables
load_dotenv(override=True)

# Configure logging
import sys
logger.remove()
logger.add(sys.stderr, level="INFO")
logger.add("logs/voice_service_{time}.log", rotation="500 MB", level="DEBUG")

# Initialize FastAPI app
app = FastAPI(
    title="Voice AI Service",
    description="API for managing voice assistant bot sessions",
    version="1.0.0",
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=os.getenv("ALLOW_ORIGINS", "*").split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Add a route for handling OPTIONS requests
@app.options("/{path:path}")
async def preflight_handler(request: Request, path: str):
    return {}

# Initialize session storage
active_bots: Dict[str, VoiceBotManager] = {}
room_pool: Optional[RoomPool] = None


# Pydantic models for API requests/responses
class ConnectResponse(BaseModel):
    session_id: str
    room_url: str
    token: str


class StatusResponse(BaseModel):
    session_id: str
    status: str
    metrics: Dict[str, Any]


class DisconnectResponse(BaseModel):
    success: bool


class ActionResponse(BaseModel):
    success: bool
    message: str = ""


@app.on_event("startup")
async def startup_event():
    """Initialize components on application startup."""
    global room_pool
    
    # Create aiohttp session
    aiohttp_session = aiohttp.ClientSession()
    
    # Initialize Daily room pool
    daily_api_key = os.getenv("DAILY_API_KEY")
    if not daily_api_key:
        logger.warning("DAILY_API_KEY not set - room pool initialization skipped")
        return
        
    room_pool = RoomPool(
        daily_api_key=daily_api_key,
        aiohttp_session=aiohttp_session,
        pool_size=int(os.getenv("ROOM_POOL_SIZE", "2")),
    )
    
    # Initialize the room pool
    await room_pool.initialize()
    logger.info(f"Room pool initialized with {room_pool.pool_size} rooms")


@app.on_event("shutdown")
async def shutdown_event():
    """Clean up resources on application shutdown."""
    # Clean up bot sessions
    tasks = []
    for session_id, bot in active_bots.items():
        logger.info(f"Shutting down bot session: {session_id}")
        tasks.append(bot.disconnect())
    
    if tasks:
        await asyncio.gather(*tasks)
    
    # Clean up room pool
    if room_pool:
        await room_pool.cleanup()
    
    logger.info("Application shutdown complete")


async def run_bot(bot: VoiceBotManager):
    """Run the bot in a background task."""
    try:
        await bot.initialize()
        await bot.run()
    except Exception as e:
        logger.error(f"Error in bot session {bot.session_id}: {str(e)}")
    finally:
        # Clean up bot session
        session_id = bot.session_id
        if session_id in active_bots:
            del active_bots[session_id]
        logger.info(f"Bot session ended: {session_id}")


@app.post("/connect", response_model=ConnectResponse)
async def connect(background_tasks: BackgroundTasks) -> ConnectResponse:
    """
    Start a new bot session.
    
    Creates a new room (or gets one from the pool) and initializes a bot.
    
    Returns:
        ConnectResponse: Session details including session ID, room URL, and token
    """
    try:
        # Get a room from the pool
        if room_pool:
            room = await room_pool.get_room()
            room_url = room["room_url"]
            user_token = room["user_token"]
            bot_token = room["bot_token"]
        else:
            # For testing without a room pool
            room_url = os.getenv("TEST_ROOM_URL")
            user_token = None
            bot_token = None
            
            if not room_url:
                raise HTTPException(status_code=500, detail="No room pool configured and TEST_ROOM_URL not set")
        
        # Create a unique session ID
        session_id = str(uuid.uuid4())
        
        # Create bot instance
        bot = VoiceBotManager(
            room_url=room_url,
            token=bot_token,
            session_id=session_id,
        )
        
        # Store bot in active sessions
        active_bots[session_id] = bot
        
        # Start bot in background
        background_tasks.add_task(run_bot, bot)
        
        logger.info(f"Started new bot session: {session_id} for room: {room_url}")
        
        # Return connection details
        return ConnectResponse(
            session_id=session_id,
            room_url=room_url,
            token=user_token,
        )
        
    except Exception as e:
        logger.error(f"Error starting bot session: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/status/{session_id}", response_model=StatusResponse)
async def get_status(session_id: str) -> StatusResponse:
    """
    Get the status of a bot session.
    
    Args:
        session_id: The ID of the session to check
        
    Returns:
        StatusResponse: Current status and metrics for the session
    """
    if session_id not in active_bots:
        raise HTTPException(status_code=404, detail="Session not found")
    
    bot = active_bots[session_id]
    status_data = await bot.get_status()
    
    return StatusResponse(
        session_id=session_id,
        status=status_data["status"],
        metrics=status_data["metrics"],
    )


@app.post("/disconnect/{session_id}", response_model=DisconnectResponse)
async def disconnect(session_id: str) -> DisconnectResponse:
    """
    End a bot session.
    
    Args:
        session_id: The ID of the session to end
        
    Returns:
        DisconnectResponse: Success status
    """
    # Even if session is not found, return success to avoid errors
    if session_id not in active_bots:
        logger.info(f"Session {session_id} not found during disconnect - may have already been cleaned up")
        return DisconnectResponse(success=True)
    
    try:
        bot = active_bots[session_id]
        await bot.disconnect()
    except Exception as e:
        logger.error(f"Error disconnecting session {session_id}: {str(e)}")
    finally:
        # Always clean up the session
        if session_id in active_bots:
            del active_bots[session_id]
        logger.info(f"Session {session_id} cleaned up")
    
    return DisconnectResponse(success=True)


@app.post("/wake/{session_id}", response_model=ActionResponse)
async def wake_bot(session_id: str) -> ActionResponse:
    """
    Wake a bot from sleep mode.
    
    Args:
        session_id: The ID of the session to wake
        
    Returns:
        ActionResponse: Success status and message
    """
    if session_id not in active_bots:
        raise HTTPException(status_code=404, detail="Session not found")
    
    # Since we removed the wake method in the simplified bot, return a message
    return ActionResponse(success=True, message="Wake functionality not implemented in simplified bot")


@app.post("/sleep/{session_id}", response_model=ActionResponse)
async def sleep_bot(session_id: str) -> ActionResponse:
    """
    Put a bot into sleep mode.
    
    Args:
        session_id: The ID of the session to put to sleep
        
    Returns:
        ActionResponse: Success status and message
    """
    if session_id not in active_bots:
        raise HTTPException(status_code=404, detail="Session not found")
    
    # Since we removed the sleep method in the simplified bot, return a message
    return ActionResponse(success=True, message="Sleep functionality not implemented in simplified bot")


@app.get("/sessions", response_model=List[str])
async def list_sessions() -> List[str]:
    """
    List all active bot sessions.
    
    Returns:
        List[str]: List of active session IDs
    """
    return list(active_bots.keys())


if __name__ == "__main__":
    import uvicorn
    
    # Run the FastAPI app
    uvicorn.run(
        "app:app",
        host=os.getenv("HOST", "0.0.0.0"),
        port=int(os.getenv("PORT", "7860")),
        reload=os.getenv("DEBUG", "false").lower() == "true",
    ) 