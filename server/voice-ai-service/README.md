# Voice AI Service

A microservice that provides voice assistant capabilities using Daily and Anthropic.

## Features

- **Interruptible Conversations**: Using Anthropic Claude for LLM processing
- **Voice Quality**: Krisp noise reduction
- **Wake/Sleep Mode**: Voice commands to control bot attention
- **User Idle Detection**: Handles inactive users gracefully
- **Persistent Context**: Conversation history within sessions
- **Monitoring**: Observer pattern for tracking metrics
- **Function Calling**: Extensions for backend integration

## Architecture

This service works as a microservice component that:
1. Creates and manages Daily rooms
2. Runs voice bot instances for each active session
3. Provides a REST API for the main Elysia server to interact with

## Setup

### Prerequisites

- Python 3.10+
- [Daily.co](https://daily.co) account with API key
- [Anthropic](https://anthropic.com) API key
- [ElevenLabs](https://elevenlabs.io) API key (for high-quality TTS)
- [Krisp](https://krisp.ai) token (optional)

### Installation

1. Clone the repository
2. Create a virtual environment:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Copy `.env.example` to `.env` and fill in your API keys and configuration

### Running the Service

```bash
# Start the FastAPI server
uvicorn app:app --host 0.0.0.0 --port 7860 --reload
```

## API Endpoints

### Connect to a Voice Bot

```
POST /connect
```

Response:
```json
{
  "session_id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "room_url": "https://your-domain.daily.co/room-name",
  "token": "token_for_frontend"
}
```

### Disconnect from a Voice Bot

```
POST /disconnect/{session_id}
```

Response:
```json
{
  "success": true
}
```

### Get Bot Status

```
GET /status/{session_id}
```

Response:
```json
{
  "session_id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "status": "active",
  "metrics": {
    "interruptions": 2,
    "total_turns": 15,
    "last_activity": "2023-10-15T14:30:45.123Z"
  }
}
```

### Wake Bot

```
POST /wake/{session_id}
```

Response:
```json
{
  "success": true,
  "message": "Bot woken up"
}
```

### Sleep Bot

```
POST /sleep/{session_id}
```

Response:
```json
{
  "success": true,
  "message": "Bot put to sleep"
}
```

### List Active Sessions

```
GET /sessions
```

Response:
```json
[
  "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "8ae92f12-4382-4621-a9fc-1c857f66bfa2"
]
```

## Integration with Elysia Server

This service is designed to be called from an Elysia server running in the Bun runtime. See the main documentation for details on the integration.

## Extending

### Adding Custom Functions

You can add custom functions to the bot by extending the `_register_functions` method in `bot.py`. 