#
# Copyright (c) 2025, Daily
#
# SPDX-License-Identifier: BSD 2-Clause License
#
"""
A voice-enabled chatbot implementation using Daily's video/audio platform and Google's Gemini LLM.
This bot joins a Daily room and interacts with users through voice conversations.
"""

import argparse
import asyncio
import os
import sys

from dotenv import load_dotenv
from loguru import logger
from pipecat.audio.vad.silero import SileroVADAnalyzer
from pipecat.pipeline.pipeline import Pipeline
from pipecat.pipeline.runner import PipelineRunner
from pipecat.pipeline.task import PipelineParams, PipelineTask
from pipecat.processors.aggregators.openai_llm_context import OpenAILLMContext
from pipecat.processors.frameworks.rtvi import RTVIConfig, RTVIProcessor, RTVIObserver
from pipecat.services.gemini_multimodal_live import GeminiMultimodalLiveLLMService
from pipecat.transports.services.daily import DailyParams, DailyTransport

load_dotenv(override=True)

logger.remove(0)
logger.add(sys.stderr, level="DEBUG")

SYSTEM_INSTRUCTION = f"""
"You are Gemini Chatbot, a friendly, helpful robot.

Your goal is to demonstrate your capabilities in a succinct way.

Your output will be converted to audio so don't include special characters in your answers.

Respond to what the user said in a creative and helpful way. Keep your responses brief. One or two sentences at most.
"""


def extract_arguments() -> tuple[str, str | None]:
    """
    Parse command line arguments for Daily room URL and token.
    
    Returns:
        tuple: (room_url, token) where room_url is the Daily room URL and token is optional authentication token
    """
    parser = argparse.ArgumentParser(description="Instant Voice Example")
    parser.add_argument(
        "-u", "--url", type=str, required=True, help="URL of the Daily room to join"
    )
    parser.add_argument(
        "-t", "--token", type=str, required=False, help="Token of the Daily room to join"
    )
    args, unknown = parser.parse_known_args()
    url = args.url or os.getenv("DAILY_SAMPLE_ROOM_URL")
    token = args.token
    return url, token


async def main():
    """
    Main function that sets up and runs the voice chatbot.
    
    This function:
    1. Sets up the Daily transport for audio communication
    2. Initializes the Gemini LLM service for conversation
    3. Creates a pipeline for processing audio and generating responses
    4. Handles participant events and manages the conversation flow
    """
    room_url, token = extract_arguments()
    print(f"room_url: {room_url}")

    # Initialize Daily transport with voice activity detection
    daily_transport = DailyTransport(
        room_url,
        token,
        "Instant voice Chatbot",
        DailyParams(
            audio_out_enabled=True,
            vad_enabled=True,
            vad_analyzer=SileroVADAnalyzer(),
            vad_audio_passthrough=True,
        ),
    )

    # Initialize Gemini LLM service for conversation
    llm = GeminiMultimodalLiveLLMService(
        api_key=os.getenv("GOOGLE_API_KEY"),
        voice_id="Puck",  # Available voices: Aoede, Charon, Fenrir, Kore, Puck
        transcribe_user_audio=True,
        transcribe_model_audio=True,
        system_instruction=SYSTEM_INSTRUCTION,
    )

    # Set up conversation context management
    context = OpenAILLMContext()
    context_aggregator = llm.create_context_aggregator(context)

    # Initialize RTVI for real-time voice interaction UI
    rtvi = RTVIProcessor(config=RTVIConfig(config=[]), transport=daily_transport)

    # Create the processing pipeline
    pipeline = Pipeline(
        [
            daily_transport.input(),  # Handle incoming audio
            context_aggregator.user(),  # Process user context
            rtvi,  # Real-time voice interaction
            llm,  # Language model processing
            daily_transport.output(),  # Handle outgoing audio
            context_aggregator.assistant(),  # Process assistant context
        ]
    )

    # Set up pipeline task with interruption handling
    task = PipelineTask(
        pipeline,
        params=PipelineParams(allow_interruptions=True),
        observers=[RTVIObserver(rtvi)],
    )

    @rtvi.event_handler("on_client_ready")
    async def on_client_ready(rtvi):
        """Handle client ready event by setting bot ready state."""
        await rtvi.set_bot_ready()

    @daily_transport.event_handler("on_first_participant_joined")
    async def on_first_participant_joined(transport, participant):
        """Initialize conversation when first participant joins."""
        await task.queue_frames([context_aggregator.user().get_context_frame()])

    @daily_transport.event_handler("on_participant_left")
    async def on_participant_left(transport, participant, reason):
        """Clean up and cancel task when participant leaves."""
        print(f"Participant left: {participant}")
        await task.cancel()

    # Run the pipeline
    runner = PipelineRunner(handle_sigint=False)
    await runner.run(task)


if __name__ == "__main__":
    asyncio.run(main())
