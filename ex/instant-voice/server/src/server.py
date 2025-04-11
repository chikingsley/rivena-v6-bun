#
# Copyright (c) 2025, Daily
#
# SPDX-License-Identifier: BSD 2-Clause License
#
"""
FastAPI server that manages Daily rooms and voice chatbot instances.
This server provides endpoints for creating and managing voice chat sessions,
handling room creation/deletion, and bot process management.
"""

import asyncio
import os
from contextlib import asynccontextmanager
from typing import Any, Dict, List

import aiohttp
import uvicorn
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from pipecat.transports.services.helpers.daily_rest import DailyRESTHelper, DailyRoomParams

# Load environment variables
load_dotenv(override=True)

NUMBER_OF_ROOMS = 1


class RoomPool:
    """
    Manages a pool of pre-created Daily rooms for quick allocation.
    
    This class maintains a pool of available rooms to reduce latency when users request
    new chat sessions. It handles room creation, allocation, and cleanup.
    
    Attributes:
        daily_rest_helper (DailyRESTHelper): Helper for Daily API operations
        pool (List[Dict[str, str]]): List of available room information
        lock (asyncio.Lock): Lock for thread-safe pool operations
    """

    def __init__(self, daily_rest_helper: DailyRESTHelper):
        """
        Initialize the room pool.
        
        Args:
            daily_rest_helper: Helper instance for Daily API operations
        """
        self.daily_rest_helper = daily_rest_helper
        self.pool: List[Dict[str, str]] = []
        self.lock = asyncio.Lock()

    async def fill_pool(self, count: int):
        """
        Fills the pool with a specified number of new rooms.
        
        Args:
            count: Number of rooms to create and add to the pool
        """
        for _ in range(count):
            await self.add_room()

    async def add_room(self):
        """
        Creates a new Daily room and adds it to the pool.
        
        The room is created with both user and bot tokens for authentication.
        """
        try:
            room = await self.daily_rest_helper.create_room(DailyRoomParams())
            if not room.url:
                raise HTTPException(status_code=500, detail="Failed to create room")

            user_token = await self.daily_rest_helper.get_token(room.url)
            if not user_token:
                raise HTTPException(status_code=500, detail="Failed to get user token")

            bot_token = await self.daily_rest_helper.get_token(room.url)
            if not bot_token:
                raise HTTPException(status_code=500, detail="Failed to get bot token")

            async with self.lock:
                self.pool.append(
                    {"room_url": room.url, "user_token": user_token, "bot_token": bot_token}
                )

        except Exception as e:
            print(f"Error adding room to pool: {e}")

    async def get_room(self) -> Dict[str, str]:
        """
        Retrieves a room from the pool and initiates creation of a replacement.
        
        Returns:
            Dict containing room URL and tokens for both user and bot
        
        Raises:
            HTTPException: If no rooms are available
        """
        async with self.lock:
            if not self.pool:
                raise HTTPException(status_code=503, detail="No available rooms")

            room = self.pool.pop(0)  # Get first available room

        # Start a background task to replenish the pool
        asyncio.create_task(self.add_room())

        return room

    async def delete_room(self, room_url: str):
        """
        Deletes a specific room from Daily's servers.
        
        Args:
            room_url: URL of the room to delete
        """
        await self.daily_rest_helper.delete_room_by_url(room_url)

    async def cleanup(self):
        """Deletes all rooms in the pool during shutdown."""
        for rooms in self.pool:
            room_url = rooms["room_url"]
            await self.delete_room(room_url)


class BotManager:
    """
    Manages bot subprocess instances and their lifecycle.
    
    This class handles starting, monitoring, and cleaning up bot processes,
    as well as managing their associations with Daily rooms.
    
    Attributes:
        bot_procs (Dict[int, asyncio.subprocess.Process]): Map of process IDs to bot processes
        room_mappings (Dict[int, str]): Map of process IDs to room URLs
    """

    def __init__(self):
        """Initialize the bot manager with empty process and room mappings."""
        self.bot_procs: Dict[int, asyncio.subprocess.Process] = {}
        self.room_mappings: Dict[int, str] = {}

    async def start_bot(self, room_url: str, token: str) -> int:
        """
        Starts a new bot process for a specific room.
        
        Args:
            room_url: URL of the Daily room for the bot to join
            token: Authentication token for the bot
            
        Returns:
            Process ID of the started bot
            
        Raises:
            HTTPException: If bot process creation fails
        """
        bot_file = "single_bot"
        command = f"python3 -m {bot_file} -u {room_url} -t {token}"

        try:
            proc = await asyncio.create_subprocess_shell(
                command,
                cwd=os.path.dirname(os.path.abspath(__file__)),
            )
            if proc.pid is None:
                raise HTTPException(status_code=500, detail="Failed to get subprocess PID")

            self.bot_procs[proc.pid] = proc
            self.room_mappings[proc.pid] = room_url
            # Monitor the process and delete the room when it exits
            asyncio.create_task(self._monitor_process(proc.pid))

            return proc.pid
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to start subprocess: {e}")

    async def _monitor_process(self, pid: int):
        """
        Monitors a bot process and handles cleanup when it exits.
        
        Args:
            pid: Process ID to monitor
        """
        proc = self.bot_procs.get(pid)
        if proc:
            await proc.wait()  # Wait for the process to exit
            room_url = self.room_mappings.pop(pid, None)

            if room_url:
                await room_pool.delete_room(room_url)
                print(f"Deleted room: {room_url}")

            del self.bot_procs[pid]

    async def cleanup(self):
        """
        Terminates all running bot processes and cleans up associated rooms.
        This is called during server shutdown.
        """
        for pid, proc in list(self.bot_procs.items()):
            try:
                proc.terminate()
                await asyncio.wait_for(proc.wait(), timeout=5)

                room_url = self.room_mappings.pop(pid, None)
                if room_url:
                    await room_pool.delete_room(room_url)
                    print(f"Deleted room: {room_url}")

            except asyncio.TimeoutError:
                print(f"Process {pid} did not terminate in time.")
            except Exception as e:
                print(f"Error terminating process {pid}: {e}")

        # Clear remaining mappings
        self.bot_procs.clear()
        self.room_mappings.clear()


# Global instances
bot_manager = BotManager()
room_pool: RoomPool  # Will be initialized in lifespan


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Manages the lifecycle of the FastAPI application.
    
    This context manager:
    1. Initializes the Daily API client session
    2. Sets up the room pool
    3. Handles cleanup during shutdown
    
    Args:
        app: FastAPI application instance
    """
    global room_pool
    aiohttp_session = aiohttp.ClientSession()
    daily_rest_helper = DailyRESTHelper(
        daily_api_key=os.getenv("DAILY_API_KEY", ""),
        daily_api_url=os.getenv("DAILY_API_URL", "https://api.daily.co/v1"),
        aiohttp_session=aiohttp_session,
    )

    room_pool = RoomPool(daily_rest_helper)
    await room_pool.fill_pool(NUMBER_OF_ROOMS)  # Fill pool on startup

    yield  # Run app

    await bot_manager.cleanup()
    await room_pool.cleanup()
    await aiohttp_session.close()


# Initialize FastAPI app with lifespan manager
app = FastAPI(lifespan=lifespan)

# Configure CORS to allow requests from any origin
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.post("/connect")
async def bot_connect(request: Request) -> Dict[Any, Any]:
    """
    Endpoint to create a new chat session.
    
    This endpoint:
    1. Gets an available room from the pool
    2. Starts a bot process for the room
    3. Returns connection details to the client
    
    Returns:
        Dict containing room URL and user token for connection
    """
    try:
        room = await room_pool.get_room()
        await bot_manager.start_bot(room["room_url"], room["bot_token"])
    except HTTPException as e:
        return {"error": str(e)}

    return {
        "room_url": room["room_url"],
        "token": room["user_token"],
    }


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=7860)
