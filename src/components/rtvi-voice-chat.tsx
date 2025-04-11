import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { VoiceVisualization } from "@/components/voice-visualization"
import rtviVoiceService, { VoiceState } from "@/lib/rtvi-voice-service"
import { Mic, MicOff, PhoneOff } from "lucide-react"

interface RTVIVoiceChatProps {
  /**
   * Optional class name
   */
  className?: string
  
  /**
   * Callback for when a session starts
   */
  onSessionStart?: () => void
  
  /**
   * Callback for when a session ends
   */
  onSessionEnd?: () => void
}

export function RTVIVoiceChat({
  className,
  onSessionStart,
  onSessionEnd
}: RTVIVoiceChatProps) {
  // Session state
  const [isConnected, setIsConnected] = useState(false)
  const [isConnecting, setIsConnecting] = useState(false)
  const [sessionId, setSessionId] = useState<string | null>(null)
  
  // Voice visualization state
  const [voiceState, setVoiceState] = useState<VoiceState>({
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
  })
  
  // Transcript state
  const [transcript, setTranscript] = useState<Array<{role: 'user' | 'bot', text: string}>>([])
  
  // Set up event listeners for the voice service
  useEffect(() => {
    // Set up voice state listener
    const removeVoiceStateListener = rtviVoiceService.addVoiceStateListener(setVoiceState)
    
    // Set up transcript listeners
    const userTranscriptHandler = (text: string) => {
      setTranscript(prev => [...prev, {role: 'user', text}])
    }
    
    const botTranscriptHandler = (text: string) => {
      setTranscript(prev => [...prev, {role: 'bot', text}])
    }
    
    rtviVoiceService.on('userTranscript', userTranscriptHandler)
    rtviVoiceService.on('botTranscript', botTranscriptHandler)
    
    // Connection state handlers
    const handleConnected = () => {
      setIsConnected(true)
      setIsConnecting(false)
      if (onSessionStart) onSessionStart()
    }
    
    const handleDisconnected = () => {
      setIsConnected(false)
      setIsConnecting(false)
      setSessionId(null)
      if (onSessionEnd) onSessionEnd()
    }
    
    rtviVoiceService.on('connected', handleConnected)
    rtviVoiceService.on('disconnected', handleDisconnected)
    
    // Clean up
    return () => {
      removeVoiceStateListener()
      rtviVoiceService.removeListener('userTranscript', userTranscriptHandler)
      rtviVoiceService.removeListener('botTranscript', botTranscriptHandler)
      rtviVoiceService.removeListener('connected', handleConnected)
      rtviVoiceService.removeListener('disconnected', handleDisconnected)
    }
  }, [onSessionStart, onSessionEnd])
  
  // Start a new session
  const startSession = async () => {
    try {
      setIsConnecting(true)
      setTranscript([])
      const session = await rtviVoiceService.startSession()
      setSessionId(session.sessionId)
    } catch (error) {
      console.error('Failed to start session', error)
      setIsConnecting(false)
    }
  }
  
  // End the current session
  const endSession = async () => {
    if (!sessionId) return
    
    try {
      await rtviVoiceService.endSession()
    } catch (error) {
      console.error('Failed to end session', error)
    }
  }
  
  // Format time for display
  const formatTime = (mins: number, secs: number) => {
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }
  
  return (
    <div className={className}>
      <Card className="p-4 relative">
        {/* Voice visualization */}
        <div className="flex justify-center pt-8 pb-6 relative">
          {/* Session timer */}
          {isConnected && (
            <div className="absolute top-2 right-2 text-xs text-gray-500">
              {formatTime(voiceState.sessionTime, voiceState.sessionSeconds)}
            </div>
          )}
          
          <VoiceVisualization
            activeState={voiceState.activeState}
            userVoiceIntensity={voiceState.voiceIntensity}
            size={240}
          />
        </div>
        
        {/* Current topic indicator */}
        {isConnected && (
          <div className="text-center mb-4">
            <div className="text-xs uppercase text-gray-500">Current topic</div>
            <div className="font-medium">{voiceState.currentTopic}</div>
          </div>
        )}
        
        {/* Connection controls */}
        <div className="flex justify-center gap-4">
          {!isConnected ? (
            <Button
              onClick={startSession}
              disabled={isConnecting}
              className="bg-primary hover:bg-primary/90 text-white"
            >
              {isConnecting ? "Connecting..." : "Start Conversation"}
              <Mic className="ml-2 h-4 w-4" />
            </Button>
          ) : (
            <Button 
              onClick={endSession}
              variant="destructive"
            >
              End Conversation
              <PhoneOff className="ml-2 h-4 w-4" />
            </Button>
          )}
        </div>
        
        {/* Transcript display */}
        {transcript.length > 0 && (
          <div className="mt-6 max-h-60 overflow-y-auto border rounded-md p-3">
            <h3 className="font-medium text-sm mb-2">Transcript</h3>
            <div className="space-y-2">
              {transcript.map((item, index) => (
                <div key={index} className={`text-sm ${item.role === 'bot' ? 'text-primary' : 'text-gray-700'}`}>
                  <span className="font-semibold">{item.role === 'bot' ? 'AI: ' : 'You: '}</span>
                  {item.text}
                </div>
              ))}
            </div>
          </div>
        )}
      </Card>
    </div>
  )
} 