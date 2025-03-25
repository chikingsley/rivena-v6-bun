# Voice AI Integration with Elysia

## Architecture Overview

We will implement a microservices architecture with three core components:

1. **Elysia Backend** (Bun/TypeScript)
   - Handles user authentication, session management
   - Communicates with Voice AI Service via REST API
   - Provides API endpoints for frontend

2. **Voice AI Service** (Python/FastAPI)
   - Manages Daily rooms and bot sessions
   - Implements voice processing features
   - Exposes REST API for room/bot management

3. **Frontend** (Vite/React/TypeScript)
   - Connects to Daily rooms
   - Provides user interface for voice interactions
   - Communicates with Elysia Backend for session management

```
┌─────────────┐        ┌──────────────┐        ┌─────────────┐
│             │        │              │        │             │
│   Frontend  │◄─────►│ Elysia Server │◄─────►│   Voice AI   │
│   (Vite)    │        │    (Bun)     │        │   Service   │
│             │        │              │        │  (Python)   │
└─────────────┘        └──────────────┘        └─────────────┘
       ▲                                               │
       │                                               │
       └───────────────────────────────────────────────┘
                     (Daily WebRTC)
```

## Features to Implement

Our Voice AI Service will include:

1. **Interruptible Conversations**
   - Using Anthropic Claude for LLM
   - Clean handling of interruptions
   - Resuming conversation after interruption

2. **Voice Quality Enhancements**
   - Krisp for noise reduction
   - High-quality TTS (ElevenLabs/Cartesia)

3. **Wake/Sleep Mode**
   - Wake phrase detection ("Hey assistant")
   - Sleep phrase handling ("Go to sleep")
   - Status indicators in UI

4. **User Idle Detection**
   - Progressive prompts for inactive users
   - Graceful conversation closure
   - Room cleanup after extended inactivity

5. **Persistent Context**
   - Conversation history within sessions
   - Option to save/load conversations

6. **Debug and Monitoring**
   - Observer pattern for monitoring events
   - Logging of interruptions and speech events
   - Performance metrics

7. **Function Calling**
   - Integration with backend services
   - Extensible function registry

8. **RAG Support** (Commented out initially)
   - Infrastructure for future RAG implementation
   - Document/knowledge integration

## Implementation Steps

### 1. Setup Project Structure

```
/server
  /voice-ai-service
    /src
      app.py                # FastAPI application entry point
      bot_service.py        # Core bot management logic
      room_pool.py          # Daily room pool management
      utils/
        observers.py        # Custom observers for monitoring
        processors.py       # Custom frame processors
      features/
        anthropic_llm.py    # Anthropic LLM integration
        wake_sleep.py       # Wake/sleep mode implementation
        user_idle.py        # User idle detection
        krisp_filter.py     # Voice filtering
        function_calling.py # Function calling implementation
        context.py          # Conversation context management
        rag.py              # RAG implementation (future)
    requirements.txt
    Dockerfile

/elysia-server
  /src
    index.ts               # Elysia server entry point
    routes/
      voice.routes.ts      # Voice AI endpoints
    services/
      voice-ai.service.ts  # Voice AI integration service
    models/
      voice-session.ts     # Voice session data types
  package.json
  tsconfig.json
  Dockerfile

/frontend
  /src
    components/
      VoiceChat.tsx        # Voice chat component
      StatusIndicator.tsx  # Bot status indicator
    services/
      daily.service.ts     # Daily integration
      api.service.ts       # Backend API integration
  package.json
  tsconfig.json
  vite.config.ts
```

### 2. Voice AI Service Development

1. **Core Service Implementation**
   - Set up FastAPI application
   - Implement room pool management
   - Create bot service for managing instances

2. **Feature Implementation**
   - Add Anthropic LLM integration
   - Implement Krisp filtering
   - Add wake/sleep mode
   - Implement user idle detection
   - Add persistent context management
   - Implement observers for monitoring
   - Integrate function calling

3. **API Endpoints**
   - `/connect` - Create new bot session
   - `/disconnect/{session_id}` - End bot session
   - `/status/{session_id}` - Get bot status
   - `/wake/{session_id}` - Wake the bot
   - `/sleep/{session_id}` - Put bot in sleep mode

### 3. Elysia Server Integration

1. **Voice AI Service Client**
   - Create a client for Voice AI Service
   - Implement room/session management
   - Handle authentication and user sessions

2. **API Endpoints**
   - `/api/voice/start` - Start voice session
   - `/api/voice/end` - End voice session
   - `/api/voice/status` - Get session status
   - `/api/voice/wake` - Wake the bot
   - `/api/voice/sleep` - Put bot in sleep mode

### 4. Frontend Implementation

1. **Voice Chat Component**
   - Implement Daily integration
   - Create UI for voice interactions
   - Add status indicators

2. **API Integration**
   - Connect with Elysia backend
   - Handle session lifecycle

### 5. Deployment

1. **Docker Compose Setup**
   - Configure services for development
   - Set up environment variables

2. **Kubernetes Configuration** (optional)
   - Create deployment manifests
   - Configure scaling and resource limits

## API Contract

### Voice AI Service API

```typescript
// Start a new bot session
POST /connect
Response: {
  session_id: string,
  room_url: string,
  token: string
}

// End a bot session
POST /disconnect/{session_id}
Response: {
  success: boolean
}

// Get bot status
GET /status/{session_id}
Response: {
  status: "active" | "sleeping" | "idle",
  last_activity: string, // ISO timestamp
  metrics: {
    interruptions: number,
    total_turns: number
  }
}

// Wake the bot
POST /wake/{session_id}
Response: {
  success: boolean
}

// Put bot in sleep mode
POST /sleep/{session_id}
Response: {
  success: boolean
}
```

### Elysia Server API

```typescript
// Start a voice session
POST /api/voice/start
Response: {
  session_id: string,
  room_url: string,
  token: string
}

// End a voice session
POST /api/voice/end
Request: {
  session_id: string
}
Response: {
  success: boolean
}

// Get session status
GET /api/voice/status/{session_id}
Response: {
  status: "active" | "sleeping" | "idle",
  last_activity: string,
  metrics: {
    interruptions: number,
    total_turns: number
  }
}

// Wake the bot
POST /api/voice/wake/{session_id}
Response: {
  success: boolean
}

// Put bot in sleep mode
POST /api/voice/sleep/{session_id}
Response: {
  success: boolean
}
```

## Technical Considerations

### Environment Variables

Voice AI Service:
```
DAILY_API_KEY=xxx
ANTHROPIC_API_KEY=xxx
KRISP_TOKEN=xxx
ELEVENLABS_API_KEY=xxx
ELEVENLABS_VOICE_ID=xxx
ALLOW_ORIGINS=http://localhost:3000,https://yourdomain.com
```

Elysia Server:
```
VOICE_AI_SERVICE_URL=http://localhost:7860
DAILY_API_KEY=xxx
JWT_SECRET=xxx
```

### Performance Optimization

1. **Room Pool Management**
   - Pre-create Daily rooms to reduce latency
   - Efficiently recycle rooms after use

2. **Bot Process Management**
   - Monitor resource usage of bot processes
   - Implement timeout for inactive sessions

3. **Caching**
   - Cache TTS results for common phrases
   - Optimize context serialization

### Scaling Considerations

1. **Horizontal Scaling**
   - Design Voice AI Service to be stateless
   - Use Redis for shared state if needed

2. **Resource Management**
   - Monitor Python process memory usage
   - Implement graceful degradation

3. **Cost Optimization**
   - Close inactive sessions
   - Optimize API calls to external services

## Next Steps

1. Implement the basic Voice AI Service with core functionality
2. Create simple Elysia integration endpoints
3. Develop minimal UI for testing
4. Iteratively add advanced features
5. Implement monitoring and observability
6. Optimize for production use 