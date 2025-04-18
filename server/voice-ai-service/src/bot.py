"""
Simplified Voice Bot Implementation

This bot focuses on the core features:
1. Interruptible conversations using Anthropic Claude
2. Persistent conversation context
3. Observer pattern for monitoring
"""

import asyncio
import os
import sys
import json
from datetime import datetime
from typing import Dict, List, Optional, Callable, Any

import aiohttp
from dotenv import load_dotenv
from loguru import logger

# Import essential components only
from pipecat.audio.vad.silero import SileroVADAnalyzer
from pipecat.frames.frames import EndFrame, LLMMessagesFrame, TTSSpeakFrame, Frame, StartInterruptionFrame, BotStartedSpeakingFrame, BotStoppedSpeakingFrame, UserStoppedSpeakingFrame
from pipecat.pipeline.pipeline import Pipeline
from pipecat.pipeline.runner import PipelineRunner
from pipecat.pipeline.task import PipelineParams, PipelineTask
from pipecat.processors.aggregators.openai_llm_context import OpenAILLMContext
from pipecat.processors.user_idle_processor import UserIdleProcessor
from pipecat.processors.frame_processor import FrameDirection, FrameProcessor
from pipecat.services.anthropic import AnthropicLLMService
from pipecat.services.elevenlabs import ElevenLabsTTSService  # Import ElevenLabs but will comment its usage
from pipecat.transports.services.daily import DailyParams, DailyTransport, DailyTransportMessageFrame
from pipecat.observers.base_observer import BaseObserver
from pipecat.observers.loggers.llm_log_observer import LLMLogObserver

# Import custom observers
from utils.observers import VoiceBotObserver

# Load environment variables
load_dotenv(override=True)

# Configure logging
logger.remove(0)
logger.add(sys.stderr, level="DEBUG")

# Constants
CONVERSATION_STORAGE_PATH = "/tmp/voice_bot_conversations/"
SYSTEM_INSTRUCTION = """
You are a helpful AI assistant in a voice conversation. Your goal is to be helpful, informative, and engaging.

Key points:
- Keep responses concise and to the point when possible
- If interrupted, resume your thought where you left off
- If asked to expand on a topic, provide more detailed information
- Speak naturally as this is a voice conversation
"""

# Ensure conversation storage directory exists
os.makedirs(CONVERSATION_STORAGE_PATH, exist_ok=True)


class VoiceBotManager:
    """
    Simplified manager class for the voice bot.
    """

    def __init__(self, room_url: str, token: str = None, session_id: str = None):
        """
        Initialize the voice bot with core components.
        
        Args:
            room_url: URL of the Daily room to join
            token: Optional token for the Daily room
            session_id: Optional session ID for tracking
        """
        self.room_url = room_url
        self.token = token
        self.session_id = session_id or datetime.now().strftime("%Y%m%d_%H%M%S")
        self.task: Optional[PipelineTask] = None
        self.runner: Optional[PipelineRunner] = None
        self.transport: Optional[DailyTransport] = None
        self.llm: Optional[AnthropicLLMService] = None
        self.tts = None  # Will be set during initialization
        self.context: Optional[OpenAILLMContext] = None
        self.user_idle: Optional[UserIdleProcessor] = None
        self.observers: List[BaseObserver] = []
        self.metrics = {
            "interruptions": 0,
            "total_turns": 0,
            "last_activity": datetime.now().isoformat(),
            "bot_speaking_time": 0,
            "user_speaking_time": 0,
            "total_tokens": 0,
            "prompt_tokens": 0,
            "completion_tokens": 0,
        }
        self.status = "initializing"  # initializing, active, sleeping, idle
        self.function_registry = {}
        self.messages = [
            {"role": "system", "content": SYSTEM_INSTRUCTION}
        ]

    async def initialize(self):
        """
        Initialize all components and connect to the Daily room.
        """
        # 1. Set up Daily transport with minimal config
        self.transport = DailyTransport(
            self.room_url,
            self.token,
            "Voice Assistant",
            DailyParams(
                audio_out_enabled=True,
                camera_out_enabled=False,
                transcription_enabled=True,
                vad_enabled=True,
                vad_analyzer=SileroVADAnalyzer(),
            ),
        )

        # 2. Initialize ElevenLabs TTS service
        self.tts = ElevenLabsTTSService(
            api_key=os.getenv("ELEVENLABS_API_KEY"),
            voice_id=os.getenv("ELEVENLABS_VOICE_ID", "EXAVITQu4vr4xnSDxMaL"),  # Default voice
            model=os.getenv("ELEVENLABS_MODEL", "eleven_turbo_v2"),
            sample_rate=16000,
        )
        
        # Comment out the following code for Hume TTS that can be uncommented later
        """
        # Alternative: Hume TTS
        from utils.hume import HumeTTSService
        
        self.tts = HumeTTSService(
            api_key=os.getenv("HUME_API_KEY"),
            voice_description="A warm, friendly professional voice with a conversational tone",
            model="v1", 
            sample_rate=16000,
        )
        """

        # 3. Initialize Anthropic LLM service
        self.llm = AnthropicLLMService(
            api_key=os.getenv("ANTHROPIC_API_KEY"),
            model=os.getenv("ANTHROPIC_MODEL", "claude-3-opus-20240229"),
        )

        # 4. Set up conversation context
        self.context = OpenAILLMContext(self.messages)
        self.context_aggregator = self.llm.create_context_aggregator(self.context)

        # 5. Set up user idle detection
        self.user_idle = UserIdleProcessor(
            callback=self.handle_user_idle,
            timeout=float(os.getenv("USER_IDLE_TIMEOUT", "15.0")),
        )

        # 6. Register basic functions
        self._register_functions()

        # 7. Set up event handlers
        self._setup_event_handlers()

        # 8. Create observer
        self.bot_observer = VoiceBotObserver(metrics=self.metrics)
        self.observers.append(self.bot_observer)
        self.observers.append(LLMLogObserver())

        # 9. Create the pipeline
        self._create_pipeline()

        logger.info(f"Bot initialized for room: {self.room_url}")
        self.status = "active"
        return self

    def _register_functions(self):
        """Register the bot's available functions."""
        
        async def save_conversation(function_name, tool_call_id, args, llm, context, result_callback):
            """Save the current conversation to a file."""
            timestamp = datetime.now().strftime("%Y-%m-%d_%H:%M:%S")
            filename = f"{CONVERSATION_STORAGE_PATH}{self.session_id}_{timestamp}.json"
            
            try:
                with open(filename, "w") as file:
                    messages = context.get_messages_for_persistent_storage()
                    json.dump(messages, file, indent=2)
                await result_callback({"success": True, "filename": filename})
            except Exception as e:
                await result_callback({"success": False, "error": str(e)})
                
        async def load_conversation(function_name, tool_call_id, args, llm, context, result_callback):
            """Load a conversation from a file."""
            filename = args.get("filename")
            
            if not filename:
                await result_callback({"success": False, "error": "No filename provided"})
                return
                
            try:
                with open(filename, "r") as file:
                    loaded_messages = json.load(file)
                    context.set_messages(loaded_messages)
                await result_callback({"success": True})
                await self.tts.say("I've loaded that conversation.")
            except Exception as e:
                await result_callback({"success": False, "error": str(e)})
                
        async def get_saved_conversations(function_name, tool_call_id, args, llm, context, result_callback):
            """Get a list of saved conversations."""
            import glob
            
            pattern = f"{CONVERSATION_STORAGE_PATH}{self.session_id}_*.json"
            files = glob.glob(pattern)
            
            await result_callback({"files": files})
        
        # Register the functions
        self.function_registry = {
            "save_conversation": save_conversation,
            "load_conversation": load_conversation,
            "get_saved_conversations": get_saved_conversations,
        }

    def _setup_event_handlers(self):
        """Set up event handlers for the transport."""
        
        @self.transport.event_handler("on_first_participant_joined")
        async def on_first_participant_joined(transport, participant):
            logger.info(f"Participant joined: {participant['id']}")
            await transport.capture_participant_transcription(participant["id"])
            
            # Initial greeting
            intro_message = "Hello! I'm your voice assistant. How can I help you today?"
            await self.tts.say(intro_message)
            
            # Update metrics
            self.metrics["last_activity"] = datetime.now().isoformat()
            
            # Start the conversation context
            await self.task.queue_frames([self.context_aggregator.user().get_context_frame()])

        @self.transport.event_handler("on_participant_left")
        async def on_participant_left(transport, participant, reason):
            logger.info(f"Participant left: {participant['id']}, reason: {reason}")
            self.status = "idle"
            await self.task.cancel()

        @self.transport.event_handler("on_call_state_updated")
        async def on_call_state_updated(transport, state):
            if state == "left":
                logger.info("Bot left the call")
                await self.task.queue_frame(EndFrame())

    def _create_pipeline(self):
        """Create the processing pipeline."""
        
        # Main pipeline
        pipeline = Pipeline(
            [
                self.transport.input(),  # Input from Daily
                self.user_idle,          # Check for user idle
                self.context_aggregator.user(),  # User context
                self.llm,               # LLM processing
                self.tts,               # Text-to-speech
                self.transport.output(),  # Output to Daily
                self.context_aggregator.assistant(),  # Assistant context
            ]
        )
        
        # Create task with interruption handling
        self.task = PipelineTask(
            pipeline,
            params=PipelineParams(
                allow_interruptions=True,
                enable_metrics=True,
                enable_usage_metrics=True,
                report_only_initial_ttfb=True,
            ),
            observers=self.observers,
        )
        
        # Initialize runner
        self.runner = PipelineRunner(handle_sigint=False)

    async def handle_user_idle(self, user_idle: UserIdleProcessor, retry_count: int) -> bool:
        """
        Handle user inactivity with progressive prompts.
        
        Args:
            user_idle: The user idle processor
            retry_count: The number of retry attempts
            
        Returns:
            Boolean indicating whether to continue checking for idle
        """
        # Update status
        self.status = "idle"
        self.metrics["last_activity"] = datetime.now().isoformat()
        
        if retry_count == 1:
            # First attempt: Add a gentle prompt
            logger.info("User idle - first prompt")
            self.messages.append(
                {
                    "role": "system", 
                    "content": "The user has been quiet. Politely and briefly ask if they're still there."
                }
            )
            await user_idle.push_frame(LLMMessagesFrame(self.messages))
            return True
            
        elif retry_count == 2:
            # Second attempt: More direct prompt
            logger.info("User idle - second prompt")
            self.messages.append(
                {
                    "role": "system",
                    "content": "The user is still inactive. Ask if they'd like to continue the conversation."
                }
            )
            await user_idle.push_frame(LLMMessagesFrame(self.messages))
            return True
            
        else:
            # Third attempt: End the conversation
            logger.info("User idle - ending conversation")
            await user_idle.push_frame(
                TTSSpeakFrame("It seems you're not available right now. I'll end our session. Feel free to start a new conversation when you're ready.")
            )
            await self.task.queue_frame(EndFrame())
            return False

    async def run(self):
        """Start the bot and run until completion."""
        logger.info(f"Starting bot session: {self.session_id}")
        await self.runner.run(self.task)
        logger.info(f"Bot session ended: {self.session_id}")

    async def get_status(self) -> Dict[str, Any]:
        """
        Get the current status of the bot.
        
        Returns:
            Dictionary with status information
        """
        return {
            "session_id": self.session_id,
            "status": self.status,
            "metrics": self.metrics,
        }

    async def disconnect(self) -> bool:
        """
        Disconnect the bot from the room.
        
        Returns:
            Success status
        """
        if self.task:
            await self.task.cancel()
            return True
        return False


async def main():
    """
    Main function for running the bot as a standalone application.
    """
    import argparse
    
    parser = argparse.ArgumentParser(description="Simplified Voice Bot")
    parser.add_argument("-u", "--url", type=str, required=True, help="URL of the Daily room")
    parser.add_argument("-t", "--token", type=str, help="Token for the Daily room")
    parser.add_argument("-s", "--session", type=str, help="Session ID")
    args = parser.parse_args()
    
    # Initialize and run the bot
    bot = VoiceBotManager(args.url, args.token, args.session)
    await bot.initialize()
    await bot.run()


if __name__ == "__main__":
    asyncio.run(main()) 