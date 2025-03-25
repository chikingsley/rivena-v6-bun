/**
 * Voice AI Service Client
 * 
 * This module provides a client for interacting with the Voice AI Service.
 * It handles session creation, management, and cleanup.
 */

export interface VoiceSessionData {
  sessionId: string;
  roomUrl: string;
  token: string;
  status: 'active' | 'sleeping' | 'idle';
  lastActivity: string;
  metrics: {
    interruptions: number;
    totalTurns: number;
    botSpeakingTime?: number;
    avgResponseTime?: number;
  };
}

export interface VoiceSessionResponse {
  session_id: string;
  room_url: string;
  token: string;
}

export interface VoiceStatusResponse {
  session_id: string;
  status: string;
  metrics: {
    interruptions: number;
    total_turns: number;
    bot_speaking_time?: number;
    avg_response_time?: number;
    last_activity: string;
  };
}

export interface ActionResponse {
  success: boolean;
  message?: string;
}

/**
 * Voice AI Service client for interacting with the Python microservice
 */
export class VoiceAIService {
  private serviceUrl: string;
  
  constructor(serviceUrl = process.env.BUN_PUBLIC_VOICE_AI_SERVICE_URL || 'http://localhost:7860') {
    this.serviceUrl = serviceUrl;
  }
  
  /**
   * Start a new voice session
   * 
   * @returns Session information including room URL and token
   */
  async startSession(): Promise<VoiceSessionData> {
    try {
      const response = await fetch(`${this.serviceUrl}/connect`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error(`Failed to start session: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json() as VoiceSessionResponse;
      
      return {
        sessionId: data.session_id,
        roomUrl: data.room_url,
        token: data.token,
        status: 'active',
        lastActivity: new Date().toISOString(),
        metrics: {
          interruptions: 0,
          totalTurns: 0,
        },
      };
    } catch (error) {
      console.error('Error starting voice session:', error);
      throw error;
    }
  }
  
  /**
   * End a voice session
   * 
   * @param sessionId The session ID to end
   * @returns Success status
   */
  async endSession(sessionId: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.serviceUrl}/disconnect/${sessionId}`, {
        method: 'POST',
      });
      
      if (!response.ok) {
        throw new Error(`Failed to end session: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json() as ActionResponse;
      return data.success;
    } catch (error) {
      console.error(`Error ending voice session ${sessionId}:`, error);
      throw error;
    }
  }
  
  /**
   * Get the status of a voice session
   * 
   * @param sessionId The session ID to check
   * @returns Session status and metrics
   */
  async getSessionStatus(sessionId: string): Promise<VoiceSessionData> {
    try {
      const response = await fetch(`${this.serviceUrl}/status/${sessionId}`);
      
      if (!response.ok) {
        throw new Error(`Failed to get session status: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json() as VoiceStatusResponse;
      
      return {
        sessionId: data.session_id,
        roomUrl: '', // Not returned in status call
        token: '',   // Not returned in status call
        status: data.status as 'active' | 'sleeping' | 'idle',
        lastActivity: data.metrics.last_activity,
        metrics: {
          interruptions: data.metrics.interruptions,
          totalTurns: data.metrics.total_turns,
          botSpeakingTime: data.metrics.bot_speaking_time,
          avgResponseTime: data.metrics.avg_response_time,
        },
      };
    } catch (error) {
      console.error(`Error getting session status ${sessionId}:`, error);
      throw error;
    }
  }
  
  /**
   * Wake a sleeping bot
   * 
   * @param sessionId The session ID to wake
   * @returns Success status
   */
  async wakeBot(sessionId: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.serviceUrl}/wake/${sessionId}`, {
        method: 'POST',
      });
      
      if (!response.ok) {
        throw new Error(`Failed to wake bot: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json() as ActionResponse;
      return data.success;
    } catch (error) {
      console.error(`Error waking bot ${sessionId}:`, error);
      throw error;
    }
  }
  
  /**
   * Put a bot to sleep
   * 
   * @param sessionId The session ID to put to sleep
   * @returns Success status
   */
  async sleepBot(sessionId: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.serviceUrl}/sleep/${sessionId}`, {
        method: 'POST',
      });
      
      if (!response.ok) {
        throw new Error(`Failed to sleep bot: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json() as ActionResponse;
      return data.success;
    } catch (error) {
      console.error(`Error sleeping bot ${sessionId}:`, error);
      throw error;
    }
  }
  
  /**
   * List all active sessions
   * 
   * @returns List of active session IDs
   */
  async listSessions(): Promise<string[]> {
    try {
      const response = await fetch(`${this.serviceUrl}/sessions`);
      
      if (!response.ok) {
        throw new Error(`Failed to list sessions: ${response.status} ${response.statusText}`);
      }
      
      return await response.json() as string[];
    } catch (error) {
      console.error('Error listing sessions:', error);
      throw error;
    }
  }
}

export default new VoiceAIService(); 