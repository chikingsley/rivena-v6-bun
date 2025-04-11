#!/usr/bin/env python3
"""
Comprehensive Hume AI Text-to-Speech API Example
This script demonstrates using the Hume AI TTS API with a wide range of options.
"""

from hume import HumeClient
from hume.tts import (
    FormatMp3, 
    FormatWav,
    FormatPcm,
    PostedContextWithUtterances, 
    PostedContextWithGenerationId,
    PostedUtterance, 
    PostedUtteranceVoiceWithId,
    PostedUtteranceVoiceWithName
)
import base64
import os
import json
from datetime import datetime

# Initialize client
client = HumeClient(
    api_key="YOUR_API_KEY",
)

# Create output directory
output_dir = "hume_tts_output"
os.makedirs(output_dir, exist_ok=True)

# Example 1: Multiple utterances with different configurations
print("Generating speech with multiple utterances and options...")
response = client.tts.synthesize_json(
    # Multiple utterances with different configurations
    utterances=[
        # First utterance with custom voice by ID
        PostedUtterance(
            text="Beauty is no quality in things themselves: It exists merely in the mind which contemplates them.",
            description="Middle-aged masculine voice with a clear, rhythmic Scots lilt, rounded vowels, and a warm, steady tone with an articulate, academic quality.",
            speed=1.2,  # Slightly faster than normal
            trailing_silence=0.5,  # Half a second of silence after
            voice=PostedUtteranceVoiceWithId(
                id="voice-id-123",
                provider="CUSTOM_VOICE"
            ),
            # voice=PostedUtteranceVoiceWithName(
            #     name="philosopher-voice",
            #     provider="HUME_AI"
            # )
        ),
    ],
    # # Context with multiple utterances for style consistency
    # context=PostedContextWithUtterances(
    #     utterances=[
    #         PostedUtterance(
    #             text="How can people see beauty so differently?",
    #             description="A curious student with a clear and respectful tone, seeking clarification on Hume's ideas with a straightforward question.",
    #         ),
    #         PostedUtterance(
    #             text="That's a profound question that philosophers have debated for centuries.",
    #             description="A thoughtful professor considering the question carefully before responding.",
    #         )
    #     ],
    # ),
    # format=FormatMp3(),  
    format=FormatWav(),
    # format=FormatPcm(),
    num_generations=1,  # Generate two variations
)