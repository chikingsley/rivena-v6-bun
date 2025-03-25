"""
Daily Room Pool Management

This module provides a RoomPool class that manages a pool of Daily rooms
for quick allocation to voice bot sessions. It handles room creation,
retrieval, and cleanup.
"""

import asyncio
import os
import time
from typing import Dict, List, Optional, Any

import aiohttp
from fastapi import HTTPException
from loguru import logger


class RoomPool:
    """
    Manages a pool of pre-created Daily rooms for quick allocation.
    
    This class maintains a pool of available rooms to reduce latency when users request
    new voice bot sessions. It handles room creation, allocation, and cleanup.
    
    Attributes:
        daily_api_key (str): Daily API key for authentication
        daily_api_url (str): URL of the Daily API
        aiohttp_session (aiohttp.ClientSession): HTTP client session
        pool (List[Dict[str, str]]): List of available room information
        lock (asyncio.Lock): Lock for thread-safe pool operations
        pool_size (int): Target size for the room pool
    """

    def __init__(
        self,
        daily_api_key: str,
        aiohttp_session: aiohttp.ClientSession,
        pool_size: int = 2,
        daily_api_url: str = "https://api.daily.co/v1",
    ):
        """
        Initialize the room pool.
        
        Args:
            daily_api_key: Daily API key for authentication
            aiohttp_session: HTTP client session for API requests
            pool_size: Target number of rooms to maintain in the pool
            daily_api_url: URL of the Daily API
        """
        self.daily_api_key = daily_api_key
        self.daily_api_url = daily_api_url
        self.aiohttp_session = aiohttp_session
        self.pool: List[Dict[str, str]] = []
        self.lock = asyncio.Lock()
        self.pool_size = pool_size

    async def initialize(self):
        """Initialize the room pool by filling it to the target size."""
        await self.fill_pool(self.pool_size)

    async def fill_pool(self, count: int):
        """
        Fills the pool with a specified number of new rooms.
        
        Args:
            count: Number of rooms to create and add to the pool
        """
        logger.info(f"Filling room pool with {count} rooms")
        tasks = [self.add_room() for _ in range(count)]
        await asyncio.gather(*tasks)
        logger.info(f"Room pool filled, current size: {len(self.pool)}")

    async def add_room(self):
        """
        Creates a new Daily room and adds it to the pool.
        
        The room is created with both user and bot tokens for authentication.
        """
        try:
            # Create room
            room_url = await self._create_room()
            if not room_url:
                logger.error("Failed to create room - no URL returned")
                return

            # Get tokens
            user_token = await self._create_token(room_url)
            bot_token = await self._create_token(room_url)

            if not user_token or not bot_token:
                logger.error(f"Failed to create tokens for room {room_url}")
                await self._delete_room(room_url)
                return

            # Add to pool
            async with self.lock:
                self.pool.append({
                    "room_url": room_url,
                    "user_token": user_token,
                    "bot_token": bot_token
                })
                logger.debug(f"Added room to pool: {room_url}")

        except Exception as e:
            logger.error(f"Error adding room to pool: {e}")

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
                logger.warning("Room pool empty, creating room on demand")
                await self.add_room()
                
                if not self.pool:
                    raise HTTPException(status_code=503, detail="No available rooms")

            room = self.pool.pop(0)  # Get first available room
            logger.info(f"Retrieved room from pool: {room['room_url']} (remaining: {len(self.pool)})")

        # Start a background task to replenish the pool
        asyncio.create_task(self.add_room())

        return room

    async def delete_room(self, room_url: str):
        """
        Deletes a specific room from Daily's servers.
        
        Args:
            room_url: URL of the room to delete
        """
        await self._delete_room(room_url)

    async def cleanup(self):
        """Deletes all rooms in the pool during shutdown."""
        logger.info(f"Cleaning up {len(self.pool)} rooms in pool")
        tasks = []
        
        for room in self.pool:
            room_url = room["room_url"]
            logger.debug(f"Scheduling deletion of room: {room_url}")
            tasks.append(self.delete_room(room_url))
            
        if tasks:
            await asyncio.gather(*tasks)
            
        self.pool = []
        logger.info("Room pool cleanup complete")

    # === Private API Methods ===

    async def _create_room(self) -> Optional[str]:
        """
        Creates a new Daily room.
        
        Returns:
            Room URL if successful, None otherwise
        """
        url = f"{self.daily_api_url}/rooms"
        headers = {
            "Authorization": f"Bearer {self.daily_api_key}",
            "Content-Type": "application/json"
        }
        
        # Default room configuration
        data = {
            "properties": {
                "exp": int((time.time() + 86400) * 1000),  # 24 hours
                "enable_screenshare": True,
                "enable_chat": True,
                "start_video_off": False,
                "start_audio_off": False,
            }
        }
        
        try:
            async with self.aiohttp_session.post(url, json=data, headers=headers) as response:
                if response.status != 200:
                    error_text = await response.text()
                    logger.error(f"Failed to create room: {response.status} - {error_text}")
                    return None
                    
                result = await response.json()
                return result.get("url")
                
        except Exception as e:
            logger.error(f"Error creating room: {e}")
            return None

    async def _create_token(self, room_url: str) -> Optional[str]:
        """
        Creates a token for a Daily room.
        
        Args:
            room_url: URL of the room to create a token for
            
        Returns:
            Token string if successful, None otherwise
        """
        # Extract room name from URL
        room_name = room_url.split("/")[-1] if room_url else ""
        if not room_name:
            logger.error(f"Invalid room URL: {room_url}")
            return None
            
        url = f"{self.daily_api_url}/meeting-tokens"
        headers = {
            "Authorization": f"Bearer {self.daily_api_key}",
            "Content-Type": "application/json"
        }
        
        # Token configuration
        data = {
            "properties": {
                "room_name": room_name,
                "exp": int((time.time() + 86400) * 1000),  # 24 hours
                "is_owner": True
            }
        }
        
        try:
            async with self.aiohttp_session.post(url, json=data, headers=headers) as response:
                if response.status != 200:
                    error_text = await response.text()
                    logger.error(f"Failed to create token: {response.status} - {error_text}")
                    return None
                    
                result = await response.json()
                return result.get("token")
                
        except Exception as e:
            logger.error(f"Error creating token: {e}")
            return None

    async def _delete_room(self, room_url: str) -> bool:
        """
        Deletes a Daily room.
        
        Args:
            room_url: URL of the room to delete
            
        Returns:
            True if successful, False otherwise
        """
        # Extract room name from URL
        room_name = room_url.split("/")[-1] if room_url else ""
        if not room_name:
            logger.error(f"Invalid room URL: {room_url}")
            return False
            
        url = f"{self.daily_api_url}/rooms/{room_name}"
        headers = {
            "Authorization": f"Bearer {self.daily_api_key}",
            "Content-Type": "application/json"
        }
        
        try:
            async with self.aiohttp_session.delete(url, headers=headers) as response:
                if response.status != 200:
                    error_text = await response.text()
                    logger.error(f"Failed to delete room: {response.status} - {error_text}")
                    return False
                    
                logger.info(f"Successfully deleted room: {room_url}")
                return True
                
        except Exception as e:
            logger.error(f"Error deleting room: {e}")
            return False 