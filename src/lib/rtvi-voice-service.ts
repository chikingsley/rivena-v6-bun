/**
 * RTVI Voice Service
 * 
 * This service provides a real-time voice interface using WebRTC (via Daily.co).
 * It handles session creation, WebRTC connections, and real-time events for voice interactions.
 */

import { RTVIClient, RTVIClientOptions, RTVIClientHelper, Participant, RTVIEvent } from '@pipecat-ai/client-js'
import { DailyTransport } from '@pipecat-ai/daily-transport'
import { EventEmitter } from 'events'

// Helper class for custom voice events
class TherapyVoiceHelper extends RTVIClientHelper {
  protected _options: any
  private _emitter: EventEmitter

  constructor(options: any, emitter: EventEmitter) {
    super(options)
    this._options = options
    this._emitter = emitter
  }

  handleMessage(rtviMessage: any): void {
    // Process custom messages from the server
    if (rtviMessage.type === 'audio_buffering_started') {
      this._emitter.emit('bufferingStarted')
    } else if (rtviMessage.type === 'audio_buffering_stopped') {
      this._emitter.emit('bufferingStopped')
    }
  }

  getMessageTypes(): string[] {
    return ['audio_buffering_started', 'audio_buffering_stopped']
  }
}

export interface RTVISessionData {
  sessionId: string
  roomUrl: string
  token: string
  status: 'connecting' | 'active' | 'inactive' | 'error'
  lastActivity: string
  metrics: {
    interruptions: number
    totalTurns: number
    botSpeakingTime?: number
    avgResponseTime?: number
  }
}

export interface VoiceState {
  activeState: 'listening' | 'speaking' | 'reflecting'
  voiceIntensity: number
  sessionTime: number
  sessionSeconds: number
  currentTopic: string
  topicDuration: number
  topicSeconds: number
  sessionPhase: 'introduction' | 'exploration' | 'reflection' | 'closing'
  phaseProgress: number
  topicProgress: number
}

export type VoiceStateListener = (state: VoiceState) => void

/**
 * RTVIVoiceService manages real-time voice interactions with a therapy bot
 */
export class RTVIVoiceService extends EventEmitter {
  private client: RTVIClient | null = null
  private sessionData: RTVISessionData | null = null
  private voiceState: VoiceState
  private voiceStateListeners: VoiceStateListener[] = []
  private sessionTimerInterval: NodeJS.Timeout | null = null
  private topicTimerInterval: NodeJS.Timeout | null = null
  private intensityInterval: NodeJS.Timeout | null = null
  private serviceUrl: string

  constructor(serviceUrl = process.env.BUN_PUBLIC_VOICE_AI_SERVICE_URL || 'http://localhost:7860') {
    super()
    this.serviceUrl = serviceUrl
    
    // Initialize voice state
    this.voiceState = {
      activeState: 'reflecting',
      voiceIntensity: 0.5,
      sessionTime: 0,
      sessionSeconds: 0,
      currentTopic: 'Introduction',
      topicDuration: 0,
      topicSeconds: 0,
      sessionPhase: 'introduction',
      phaseProgress: 0,
      topicProgress: 0
    }

    // Set up event listeners
    this.on('bufferingStarted', this.handleBufferingStarted.bind(this))
    this.on('bufferingStopped', this.handleBufferingStopped.bind(this))
  }

  /**
   * Start a new voice session
   */
  async startSession(): Promise<RTVISessionData> {
    try {
      // Create session via HTTP
      const response = await fetch(`${this.serviceUrl}/connect`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })

      if (!response.ok) {
        throw new Error(`Failed to start session: ${response.status}`)
      }

      const data = await response.json()
      this.sessionData = {
        sessionId: data.id || 'session-' + Date.now(),
        roomUrl: data.room_url,
        token: data.token,
        status: 'connecting',
        lastActivity: new Date().toISOString(),
        metrics: {
          interruptions: 0,
          totalTurns: 0
        }
      }

      // Initialize the RTVI client with WebRTC
      await this.initializeRTVIClient()
      
      // Start timers
      this.startTimers()
      
      return this.sessionData
    } catch (error) {
      console.error('Error starting voice session:', error)
      throw error
    }
  }

  /**
   * Initialize the RTVI client
   */
  private async initializeRTVIClient() {
    if (!this.sessionData) {
      throw new Error('No active session')
    }

    // Create the transport
    const transport = new DailyTransport({
      bufferLocalAudioUntilBotReady: true
    })

    // Create the RTVI client
    const RTVIConfig: RTVIClientOptions = {
      transport,
      params: {
        // The baseURL and endpoint are not needed as we've already created the session
        // We just need to provide the room details
        directConnect: {
          roomUrl: this.sessionData.roomUrl,
          token: this.sessionData.token
        }
      },
      enableMic: true,
      enableCam: false,
      callbacks: {
        onConnected: () => {
          if (this.sessionData) {
            this.sessionData.status = 'active'
            this.updateVoiceState({ activeState: 'reflecting' })
          }
          this.emit('connected')
        },
        onDisconnected: () => {
          if (this.sessionData) {
            this.sessionData.status = 'inactive'
          }
          this.emit('disconnected')
        },
        onBotConnected: (participant: Participant) => {
          this.emit('botConnected', participant)
        },
        onBotReady: () => {
          this.emit('botReady')
        },
        onUserTranscript: (data: any) => {
          if (data.final) {
            if (this.sessionData) {
              this.sessionData.metrics.totalTurns++
            }
            this.emit('userTranscript', data.text)
            // Check for topic changes in transcript
            this.processTranscriptForTopics(data.text)
          }
        },
        onBotTranscript: (data: any) => {
          this.emit('botTranscript', data.text)
        },
        onUserSpeechStart: () => {
          this.updateVoiceState({ activeState: 'listening' })
          this.emit('userSpeechStart')
        },
        onUserSpeechEnd: () => {
          this.emit('userSpeechEnd')
        },
        onBotSpeechStart: () => {
          this.updateVoiceState({ activeState: 'speaking' })
          this.emit('botSpeechStart')
        },
        onBotSpeechEnd: () => {
          this.updateVoiceState({ activeState: 'reflecting' })
          this.emit('botSpeechEnd')
        },
        onUserVoiceActivity: (intensity: number) => {
          this.updateVoiceState({ voiceIntensity: intensity })
        },
        onMessageError: (error: any) => console.error('Message error:', error),
        onError: (error: any) => {
          console.error('Error:', error)
          if (this.sessionData) {
            this.sessionData.status = 'error'
          }
          this.emit('error', error)
        },
      },
    }

    this.client = new RTVIClient(RTVIConfig)
    
    // Register the helper
    this.client.registerHelper("transport", new TherapyVoiceHelper({}, this))

    // Connect to the room
    await this.client.connect()
  }

  /**
   * Start session timers
   */
  private startTimers() {
    // Session timer
    this.sessionTimerInterval = setInterval(() => {
      this.updateVoiceState({
        sessionSeconds: (this.voiceState.sessionSeconds + 1) % 60,
        sessionTime: this.voiceState.sessionSeconds === 59 
          ? this.voiceState.sessionTime + 1 
          : this.voiceState.sessionTime
      })
    }, 1000)

    // Topic timer
    this.topicTimerInterval = setInterval(() => {
      this.updateVoiceState({
        topicSeconds: (this.voiceState.topicSeconds + 1) % 60,
        topicDuration: this.voiceState.topicSeconds === 59 
          ? this.voiceState.topicDuration + 1 
          : this.voiceState.topicDuration,
        topicProgress: Math.min(this.voiceState.topicProgress + 0.05, 100)
      })
    }, 1000)
  }

  /**
   * Clean up timers
   */
  private stopTimers() {
    if (this.sessionTimerInterval) {
      clearInterval(this.sessionTimerInterval)
      this.sessionTimerInterval = null
    }
    
    if (this.topicTimerInterval) {
      clearInterval(this.topicTimerInterval)
      this.topicTimerInterval = null
    }
    
    if (this.intensityInterval) {
      clearInterval(this.intensityInterval)
      this.intensityInterval = null
    }
  }

  /**
   * Handle audio buffering started event
   */
  private handleBufferingStarted() {
    console.log('Audio buffering started')
  }

  /**
   * Handle audio buffering stopped event
   */
  private handleBufferingStopped() {
    console.log('Audio buffering stopped')
  }

  /**
   * End a voice session
   */
  async endSession(): Promise<boolean> {
    if (!this.sessionData) {
      return false
    }

    try {
      // Disconnect RTVI client
      if (this.client) {
        await this.client.disconnect()
        this.client = null
      }

      // Clean up timers
      this.stopTimers()

      // Notify server
      await fetch(`${this.serviceUrl}/disconnect/${this.sessionData.sessionId}`, {
        method: 'POST'
      })

      this.sessionData = null
      return true
    } catch (error) {
      console.error(`Error ending voice session:`, error)
      throw error
    }
  }

  /**
   * Get the current session status
   */
  async getSessionStatus(): Promise<RTVISessionData | null> {
    if (!this.sessionData) {
      return null
    }

    try {
      const response = await fetch(`${this.serviceUrl}/status/${this.sessionData.sessionId}`)
      
      if (!response.ok) {
        console.error(`Failed to get session status: ${response.status}`)
        return this.sessionData
      }
      
      const data = await response.json()
      
      this.sessionData = {
        ...this.sessionData,
        status: data.status,
        lastActivity: data.metrics.last_activity,
        metrics: {
          interruptions: data.metrics.interruptions,
          totalTurns: data.metrics.total_turns,
          botSpeakingTime: data.metrics.bot_speaking_time,
          avgResponseTime: data.metrics.avg_response_time,
        },
      }
      
      return this.sessionData
    } catch (error) {
      console.error(`Error getting session status:`, error)
      return this.sessionData
    }
  }

  /**
   * Update the voice state and notify listeners
   */
  private updateVoiceState(partialState: Partial<VoiceState>) {
    this.voiceState = { ...this.voiceState, ...partialState }
    this.notifyStateListeners()
  }

  /**
   * Notify all state listeners of the current state
   */
  private notifyStateListeners() {
    for (const listener of this.voiceStateListeners) {
      listener(this.voiceState)
    }
  }

  /**
   * Add a listener for voice state changes
   */
  addVoiceStateListener(listener: VoiceStateListener) {
    this.voiceStateListeners.push(listener)
    // Immediately notify with current state
    listener(this.voiceState)
    return () => this.removeVoiceStateListener(listener)
  }

  /**
   * Remove a voice state listener
   */
  removeVoiceStateListener(listener: VoiceStateListener) {
    const index = this.voiceStateListeners.indexOf(listener)
    if (index !== -1) {
      this.voiceStateListeners.splice(index, 1)
    }
  }

  /**
   * Process transcript to detect topic changes
   */
  private processTranscriptForTopics(transcript: string) {
    // Simple implementation - in a real system this would use more sophisticated NLP
    const lowercaseText = transcript.toLowerCase()
    
    // Check for explicit topic changes
    if (lowercaseText.includes('let\'s talk about') || lowercaseText.includes('i want to discuss')) {
      const topicMatch = transcript.match(/(?:let's talk about|i want to discuss) (.*?)(?:\.|\?|$)/i)
      if (topicMatch && topicMatch[1]) {
        const newTopic = topicMatch[1].trim()
        this.updateVoiceState({ 
          currentTopic: newTopic,
          topicDuration: 0,
          topicSeconds: 0,
          topicProgress: 0
        })
        
        // This would be a good place to add the topic to session history
      }
    }
    
    // In a full implementation, we'd use intent recognition or keyword extraction
  }

  /**
   * Advance the session phase
   */
  advanceSessionPhase() {
    const phases: Array<'introduction' | 'exploration' | 'reflection' | 'closing'> = [
      'introduction', 'exploration', 'reflection', 'closing'
    ]
    
    const currentIndex = phases.indexOf(this.voiceState.sessionPhase)
    if (currentIndex < phases.length - 1) {
      this.updateVoiceState({ 
        sessionPhase: phases[currentIndex + 1],
        phaseProgress: 0
      })
    }
  }
}

// Export singleton instance
export default new RTVIVoiceService() 