"""
Custom observers for the voice bot.

These observers are used to monitor and track events in the voice bot,
providing insights into bot performance and behavior.
"""

from typing import Dict, Any

from loguru import logger
from pipecat.frames.frames import (
    Frame, 
    StartInterruptionFrame,
    BotStartedSpeakingFrame,
    BotStoppedSpeakingFrame,
    UserStoppedSpeakingFrame,
    LLMFullResponseEndFrame
)
from pipecat.observers.base_observer import BaseObserver
from pipecat.processors.frame_processor import FrameDirection, FrameProcessor

class VoiceBotObserver(BaseObserver):
    """
    Observer for tracking metrics and events in the voice bot.
    
    This observer tracks:
    - Interruptions (when user interrupts the bot)
    - Bot speaking events (start/stop)
    - User turns
    - Response latency
    
    It updates the metrics dictionary in real-time to provide
    insights into the conversation flow.
    """
    
    def __init__(self, metrics: Dict[str, Any] = None):
        """
        Initialize the observer with a metrics dictionary.
        
        Args:
            metrics: Dictionary to store metrics (will be updated in-place)
        """
        self.metrics = metrics or {
            "interruptions": 0,
            "total_turns": 0,
            "bot_speaking_time": 0,
            "last_activity": None,
            "avg_response_time": 0
        }
        self._speaking_start_time = None
        self._last_turn_start_time = None
        self._total_response_time = 0
        self._response_count = 0
    
    async def on_push_frame(
        self,
        src: FrameProcessor,
        dst: FrameProcessor,
        frame: Frame,
        direction: FrameDirection,
        timestamp: int,
    ):
        """
        Handle frame events as they pass through the pipeline.
        
        Args:
            src: Source processor
            dst: Destination processor
            frame: The frame being processed
            direction: Direction of the frame (upstream/downstream)
            timestamp: Current timestamp (in nanoseconds)
        """
        # Convert timestamp to seconds for readability
        time_sec = timestamp / 1_000_000_000
        
        # Create direction arrow for logging
        arrow = "→" if direction == FrameDirection.DOWNSTREAM else "←"
        
        # Track interruptions
        if isinstance(frame, StartInterruptionFrame):
            logger.info(f"⚡ INTERRUPTION: {src} {arrow} {dst} at {time_sec:.2f}s")
            self.metrics["interruptions"] += 1
        
        # Track bot speaking events
        elif isinstance(frame, BotStartedSpeakingFrame):
            logger.info(f"🔊 BOT STARTED SPEAKING: {src} {arrow} {dst} at {time_sec:.2f}s")
            self._speaking_start_time = time_sec
            
            # If this is a response to user, calculate response time
            if self._last_turn_start_time is not None:
                response_time = time_sec - self._last_turn_start_time
                logger.info(f"⏱️ Response time: {response_time:.2f}s")
                
                # Update average response time
                self._total_response_time += response_time
                self._response_count += 1
                self.metrics["avg_response_time"] = self._total_response_time / self._response_count
                
                # Reset for next turn
                self._last_turn_start_time = None
        
        # Track bot speaking end
        elif isinstance(frame, BotStoppedSpeakingFrame):
            logger.info(f"🔇 BOT STOPPED SPEAKING: {src} {arrow} {dst} at {time_sec:.2f}s")
            
            # Calculate speaking duration
            if self._speaking_start_time is not None:
                speaking_duration = time_sec - self._speaking_start_time
                logger.info(f"⏱️ Bot speaking duration: {speaking_duration:.2f}s")
                self.metrics["bot_speaking_time"] += speaking_duration
                self._speaking_start_time = None
        
        # Track user turns
        elif isinstance(frame, UserStoppedSpeakingFrame):
            logger.info(f"👤 USER STOPPED SPEAKING: {src} {arrow} {dst} at {time_sec:.2f}s")
            self.metrics["total_turns"] += 1
            self._last_turn_start_time = time_sec
        
        # Track LLM responses
        elif isinstance(frame, LLMFullResponseEndFrame):
            logger.info(f"🧠 LLM RESPONSE ENDED: {src} {arrow} {dst} at {time_sec:.2f}s")


class DebugObserver(BaseObserver):
    """
    Observer for verbose debugging of frame processing.
    
    This observer logs detailed information about all frames
    passing through the pipeline, which is useful for debugging
    and understanding the flow of data.
    """
    
    def __init__(self, verbose: bool = False):
        """
        Initialize the debug observer.
        
        Args:
            verbose: Whether to log all frames (True) or just key events (False)
        """
        self.verbose = verbose
    
    async def on_push_frame(
        self,
        src: FrameProcessor,
        dst: FrameProcessor,
        frame: Frame,
        direction: FrameDirection,
        timestamp: int,
    ):
        """Log frame information."""
        # Convert timestamp to seconds
        time_sec = timestamp / 1_000_000_000
        
        # Direction arrow
        arrow = "→" if direction == FrameDirection.DOWNSTREAM else "←"
        
        # Always log important frames
        if isinstance(frame, (StartInterruptionFrame, BotStartedSpeakingFrame, 
                             BotStoppedSpeakingFrame, UserStoppedSpeakingFrame,
                             LLMFullResponseEndFrame)):
            logger.debug(f"DEBUG [{type(frame).__name__}]: {src} {arrow} {dst} at {time_sec:.2f}s")
        
        # Log all frames if verbose
        elif self.verbose:
            logger.debug(f"DEBUG [{type(frame).__name__}]: {src} {arrow} {dst} at {time_sec:.2f}s") 