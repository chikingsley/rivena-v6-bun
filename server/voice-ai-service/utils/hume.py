#
# Copyright (c) 2024–2025, Daily
#
# SPDX-License-Identifier: BSD 2-Clause License
#

import base64
import json
import uuid
import asyncio
from typing import AsyncGenerator, Dict, Optional, Union, List

from loguru import logger
from pydantic import BaseModel

from pipecat.frames.frames import (
    CancelFrame,
    EndFrame,
    ErrorFrame,
    Frame,
    StartFrame,
    StartInterruptionFrame,
    TTSAudioRawFrame,
    TTSStartedFrame,
    TTSStoppedFrame,
)
from pipecat.processors.frame_processor import FrameDirection
from pipecat.services.ai_services import AudioContextWordTTSService
from pipecat.transcriptions.language import Language
from pipecat.utils.text.base_text_aggregator import BaseTextAggregator
from pipecat.utils.text.skip_tags_aggregator import SkipTagsAggregator

try:
    from hume import AsyncHumeClient
    from hume.tts import PostedUtterance, PostedUtteranceVoiceWithId
except ModuleNotFoundError as e:
    logger.error(f"Exception: {e}")
    logger.error(
        "In order to use Hume, you need to `pip install hume`. Also, set `HUME_API_KEY` environment variable."
    )
    raise Exception(f"Missing module: {e}")


def language_to_hume_language(language: Language) -> Optional[str]:
    """Convert pipecat Language to Hume language code.

    Args:
        language: The pipecat Language enum value.

    Returns:
        str: Two-letter language code used by Hume (e.g., 'en' for English).
    """
    BASE_LANGUAGES = {
        Language.AR: "ar",  # Arabic
        Language.BG: "bg",  # Bulgarian
        Language.CS: "cs",  # Czech
        Language.DA: "da",  # Danish
        Language.DE: "de",  # German
        Language.EL: "el",  # Greek
        Language.EN: "en",  # English
        Language.ES: "es",  # Spanish
        Language.FI: "fi",  # Finnish
        Language.FR: "fr",  # French
        Language.HI: "hi",  # Hindi
        Language.HR: "hr",  # Croatian
        Language.HU: "hu",  # Hungarian
        Language.ID: "id",  # Indonesian
        Language.IT: "it",  # Italian
        Language.JA: "ja",  # Japanese
        Language.KO: "ko",  # Korean
        Language.NL: "nl",  # Dutch
        Language.NO: "no",  # Norwegian
        Language.PL: "pl",  # Polish
        Language.PT: "pt",  # Portuguese
        Language.RO: "ro",  # Romanian
        Language.RU: "ru",  # Russian
        Language.SK: "sk",  # Slovak
        Language.SV: "sv",  # Swedish
        Language.TR: "tr",  # Turkish
        Language.UK: "uk",  # Ukrainian
        Language.VI: "vi",  # Vietnamese
        Language.ZH: "zh",  # Chinese
    }

    result = BASE_LANGUAGES.get(language)

    # If not found in base languages, try to find the base language from a variant
    if not result:
        # Convert enum value to string and get the base language part (e.g. es-ES -> es)
        lang_str = str(language.value)
        base_code = lang_str.split("-")[0].lower()
        # Look up the base code in our supported languages
        result = base_code if base_code in BASE_LANGUAGES.values() else None

    return result


class HumeTTSService(AudioContextWordTTSService):
    """Text-to-Speech service using Hume's API.
    
    This implementation uses the official Hume Python SDK for TTS generation.
    
    Supports:
    - High-quality speech generation
    - Voice selection and customization
    - Voice styles and emotions
    """
    
    class InputParams(BaseModel):
        """Configuration parameters for Hume TTS service."""
        language: Optional[Language] = Language.EN
        speed: Optional[float] = 1.0
        emotion: Optional[Dict[str, float]] = None
        voice_style: Optional[str] = None
        
    def __init__(
        self,
        *,
        api_key: str,
        voice_id: Optional[str] = None,
        voice_name: Optional[str] = None,
        voice_description: Optional[str] = None,
        model: str = "v1",
        sample_rate: Optional[int] = None,
        params: InputParams = InputParams(),
        text_aggregator: Optional[BaseTextAggregator] = None,
        **kwargs,
    ):
        """Initialize Hume TTS service.

        Args:
            api_key: Hume API key for authentication
            voice_id: Optional ID of the voice to use (UUID format)
            voice_name: Optional name of a saved voice to use
            voice_description: Optional description to generate a voice
            model: Model version to use
            sample_rate: Audio sample rate in Hz
            params: Additional configuration parameters
        """
        super().__init__(
            aggregate_sentences=True,
            push_text_frames=False,
            push_stop_frames=True,
            pause_frame_processing=True,
            sample_rate=sample_rate or 24000,  # Use 24kHz as default
            text_aggregator=text_aggregator or SkipTagsAggregator([]),
            **kwargs,
        )
        
        # Set up Hume client
        self._api_key = api_key
        self._client = AsyncHumeClient(api_key=api_key)
        
        # Voice and model settings
        self._voice_id = voice_id
        self._voice_name = voice_name
        self._voice_description = voice_description or "A clear, professional voice assistant"
        self._model = model
        
        # Language and style settings
        self._language = self.language_to_service_language(params.language)
        self._speed = params.speed
        self._emotion = params.emotion
        self._voice_style = params.voice_style
        
        # Generation tracking
        self._context_id = None
        self._last_generation_id = None
        self._has_saved_voice = False
        self._websocket = None
        
    def can_generate_metrics(self) -> bool:
        return True

    def language_to_service_language(self, language: Language) -> Optional[str]:
        """Convert pipecat language to Hume language code."""
        return language_to_hume_language(language)

    async def set_model(self, model: str):
        """Update the TTS model."""
        self._model = model
        await super().set_model(model)
        logger.info(f"Switching TTS model to: [{model}]")

    async def start(self, frame: StartFrame):
        """Start the service."""
        await super().start(frame)

    async def stop(self, frame: EndFrame):
        """Stop the service."""
        await super().stop(frame)
        self._client = None

    async def cancel(self, frame: CancelFrame):
        """Cancel current operation."""
        await super().cancel(frame)
        self._context_id = None
        self._last_generation_id = None

    async def _handle_interruption(self, frame: StartInterruptionFrame, direction: FrameDirection):
        """Handle interruption by clearing current context."""
        await super()._handle_interruption(frame, direction)
        await self.stop_all_metrics()
        self._context_id = None

    async def flush_audio(self):
        """Flush any pending audio data."""
        self._context_id = None
        self._last_generation_id = None
        logger.trace(f"{self}: flushing audio")

    # Required abstract methods to satisfy the parent class
    
    async def _connect(self):
        """Connect to the service (required by parent class)."""
        # Not needed with SDK implementation
        pass
    
    async def _disconnect(self):
        """Disconnect from the service (required by parent class)."""
        # Not needed with SDK implementation
        pass
    
    async def _connect_websocket(self):
        """Connect to websocket (required by parent class)."""
        # Not needed with SDK implementation
        pass
    
    async def _disconnect_websocket(self):
        """Disconnect from websocket (required by parent class)."""
        # Not needed with SDK implementation
        pass
    
    async def _receive_messages(self):
        """Receive messages (required by parent class)."""
        # Not needed with SDK implementation
        pass
    
    def _get_websocket(self):
        """Get websocket (might be required by parent class)."""
        # Not needed with SDK implementation
        return None

    async def run_tts(self, text: str) -> AsyncGenerator[Frame, None]:
        """Generate speech from text using Hume's TTS API.

        Args:
            text: The text to convert to speech.

        Yields:
            Frames containing audio data and timing information.
        """
        logger.debug(f"{self}: Generating TTS [{text}]")

        if not text:
            text = " "  # Ensure we have at least one character
        
        try:
            await self.start_ttfb_metrics()
            yield TTSStartedFrame()
            
            # Create context ID if needed
            if not self._context_id:
                self._context_id = str(uuid.uuid4())
                await self.create_audio_context(self._context_id)
            
            # Prepare utterance based on available voice information
            utterance = None
            
            try:
                if self._voice_id:
                    # Try to use specified voice ID
                    from hume.tts import PostedUtteranceVoiceWithId
                    utterance = PostedUtterance(
                        voice=PostedUtteranceVoiceWithId(id=self._voice_id),
                        text=text,
                        speed=self._speed,
                    )
                elif self._voice_name:
                    # Try to use specified voice name
                    from hume.tts import PostedUtteranceVoiceWithName
                    utterance = PostedUtterance(
                        voice=PostedUtteranceVoiceWithName(name=self._voice_name),
                        text=text,
                        speed=self._speed,
                    )
                else:
                    # Use description-based voice generation
                    utterance = PostedUtterance(
                        description=self._voice_description,
                        text=text,
                        speed=self._speed,
                    )
            except Exception as e:
                # Fallback to using description if voice ID/name fails
                logger.warning(f"Error setting up voice parameters: {e}")
                utterance = PostedUtterance(
                    description=self._voice_description,
                    text=text,
                    speed=self._speed,
                )
            
            # Add context for continuity if we have a previous generation
            context_param = None
            if self._last_generation_id:
                from hume.tts import PostedContextWithGenerationId
                context_param = PostedContextWithGenerationId(
                    generation_id=self._last_generation_id
                )
            
            # Call Hume TTS API
            try:
                response = await self._client.tts.synthesize_json(
                    utterances=[utterance],
                    context=context_param,
                    num_generations=1
                )
            except Exception as api_error:
                # Catch API errors and handle voice not found issues
                error_msg = str(api_error)
                if "not found" in error_msg.lower() or "does not exist" in error_msg.lower():
                    logger.warning(f"Voice not found, falling back to description: {api_error}")
                    
                    # Clear the problematic voice reference
                    if self._voice_id:
                        self._voice_id = None
                    if self._voice_name:
                        self._voice_name = None
                        
                    # Try again with description
                    utterance = PostedUtterance(
                        description=self._voice_description,
                        text=text,
                        speed=self._speed,
                    )
                    
                    # Second attempt with description
                    response = await self._client.tts.synthesize_json(
                        utterances=[utterance],
                        context=context_param,
                        num_generations=1
                    )
                else:
                    # Re-raise other API errors
                    raise
            
            # Process response
            if not response.generations:
                logger.error(f"{self} error: No generations returned")
                yield ErrorFrame(f"{self} error: No generations returned")
                return
            
            # Store generation ID for continuity
            generation = response.generations[0]
            self._last_generation_id = generation.generation_id
            
            # Save voice if needed and we don't have a voice_id or voice_name yet
            if not self._has_saved_voice and not self._voice_id and not self._voice_name:
                try:
                    # Generate a voice name based on description
                    voice_name = f"pipecat-voice-{uuid.uuid4().hex[:8]}"
                    await self._client.tts.voices.create(
                        name=voice_name,
                        generation_id=self._last_generation_id
                    )
                    self._voice_name = voice_name
                    self._has_saved_voice = True
                    logger.info(f"Created and saved Hume voice with name: {voice_name}")
                except Exception as e:
                    logger.warning(f"Failed to save voice: {e}")
            
            # Process audio data
            if generation.audio:
                # Stop TTFB metrics after first audio data received
                await self.stop_ttfb_metrics()
                
                # Convert from base64 to binary
                audio_data = base64.b64decode(generation.audio)
                
                # Skip initial WAV header for streaming (if present)
                if audio_data.startswith(b"RIFF"):
                    # Skip the WAV header
                    # Find the data chunk
                    data_chunk_pos = audio_data.find(b"data")
                    if data_chunk_pos > 0:
                        # Skip the data chunk header (8 bytes)
                        audio_data = audio_data[data_chunk_pos + 8:]
                
                # Create and push audio frame
                frame = TTSAudioRawFrame(
                    audio=audio_data,
                    sample_rate=self.sample_rate,
                    num_channels=1,
                )
                await self.append_to_audio_context(self._context_id, frame)
                
                # Update usage metrics
                await self.start_tts_usage_metrics(text)
                
                # Yield the frame for streaming
                yield frame
            
            # Signal completion
            yield TTSStoppedFrame()
            
        except Exception as e:
            logger.error(f"{self} error generating TTS: {e}")
            yield ErrorFrame(f"{self} error: {str(e)}")
            self._context_id = None

    async def create_voice_with_name(self, description: str, name: str) -> Optional[str]:
        """Create a new voice with a specific name and description.
        
        Args:
            description: The description of the voice to create
            name: Name to save the voice with
            
        Returns:
            The name of the saved voice if successful, None otherwise
        """
        try:
            # First generate speech with the description to get a generation_id
            utterance = PostedUtterance(
                description=description,
                text="Hello, this is a test of my voice.",
            )
            
            response = await self._client.tts.synthesize_json(
                utterances=[utterance],
                num_generations=1
            )
            
            if not response.generations:
                logger.error("No generations returned when creating voice")
                return None
                
            # Get the generation ID
            generation_id = response.generations[0].generation_id
            
            # Create a voice with this generation ID
            await self._client.tts.voices.create(
                name=name,
                generation_id=generation_id
            )
            
            # Update instance variables
            self._voice_name = name
            self._voice_description = description
            self._has_saved_voice = True
            
            logger.info(f"Successfully created voice '{name}' with description: {description}")
            return name
            
        except Exception as e:
            logger.error(f"Error creating voice: {e}")
            return None
            
    async def list_available_voices(self) -> List[Dict]:
        """List all available voices for the current API key.
        
        Returns:
            List of voice dictionaries with details like ID and name
        """
        try:
            response = await self._client.tts.voices.list()
            if hasattr(response, 'voices'):
                return [{'id': voice.id, 'name': voice.name} for voice in response.voices]
            return []
        except Exception as e:
            logger.error(f"Error listing voices: {e}")
            return [] 