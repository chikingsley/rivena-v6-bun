import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RTVIVoiceChat } from "@/components/rtvi-voice-chat";
import rtviVoiceService, { RTVISessionData } from "@/lib/rtvi-voice-service";

interface VoiceChatProps {
  onStartSession: () => Promise<any>;
  onEndSession: (sessionId: string) => Promise<boolean>;
  onSleepBot: (sessionId: string) => Promise<boolean>;
  onWakeBot: (sessionId: string) => Promise<boolean>;
}

export function VoiceChat({
  onStartSession,
  onEndSession,
  onSleepBot,
  onWakeBot,
}: VoiceChatProps) {
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [sessionData, setSessionData] = useState<RTVISessionData | null>(null);
  
  // Handle session start
  const handleSessionStart = () => {
    setIsSessionActive(true);
    // Use the original callback if needed
    onStartSession().catch(console.error);
  };
  
  // Handle session end
  const handleSessionEnd = () => {
    setIsSessionActive(false);
    if (sessionData?.sessionId) {
      onEndSession(sessionData.sessionId).catch(console.error);
    }
    setSessionData(null);
  };
  
  const renderStatusBadge = () => {
    if (!isSessionActive) return null;
    
    const status = sessionData?.status || 'active';
    const colorMap: Record<string, string> = {
      active: "bg-green-500",
      connecting: "bg-blue-500",
      inactive: "bg-yellow-500",
      error: "bg-red-500",
    };
    
    return (
      <Badge className={colorMap[status] || "bg-gray-500"}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };
  
  // Periodically update session data
  useEffect(() => {
    if (!isSessionActive) return;
    
    const interval = setInterval(async () => {
      try {
        const data = await rtviVoiceService.getSessionStatus();
        if (data) {
          setSessionData(data);
        }
      } catch (err) {
        console.error("Error fetching session status:", err);
      }
    }, 5000);
    
    return () => clearInterval(interval);
  }, [isSessionActive]);

  return (
    <Card className="w-full max-w-3xl mx-auto">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Voice Assistant</CardTitle>
          {renderStatusBadge()}
        </div>
      </CardHeader>

      <CardContent>
        <RTVIVoiceChat 
          onSessionStart={handleSessionStart}
          onSessionEnd={handleSessionEnd}
        />
      </CardContent>
    </Card>
  );
} 