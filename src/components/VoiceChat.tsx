import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { VoiceSessionData } from "@/lib/voice-ai-service";
import DailyIframe from "@daily-co/daily-js";
import type { DailyCall } from "@daily-co/daily-js";

interface VoiceChatProps {
  onStartSession: () => Promise<VoiceSessionData>;
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
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [session, setSession] = useState<VoiceSessionData | null>(null);
  const callFrameRef = useRef<DailyCall | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Initialize Daily call when session data is available
  useEffect(() => {
    if (session && containerRef.current && !callFrameRef.current) {
      const callFrame = DailyIframe.createFrame(containerRef.current, {
        showLeaveButton: true,
        iframeStyle: {
          width: "100%",
          height: "100%",
          border: "0",
          borderRadius: "12px",
        },
      });

      callFrame
        .join({
          url: session.roomUrl,
          token: session.token,
        })
        .then(() => {
          console.log("Joined Daily call");
        })
        .catch((err) => {
          setError(`Failed to join call: ${err.message}`);
        });

      callFrame.on("left-meeting", handleCallEnded);

      callFrameRef.current = callFrame;
      
      return () => {
        callFrame.destroy();
        callFrameRef.current = null;
      };
    }
  }, [session]);

  const handleStartSession = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const sessionData = await onStartSession();
      setSession(sessionData);
    } catch (err) {
      setError(typeof err === "string" ? err : (err as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCallEnded = async () => {
    if (session) {
      try {
        await onEndSession(session.sessionId);
      } catch (err) {
        console.error("Error ending session:", err);
      }
      setSession(null);
    }
  };

  const handleToggleSleep = async () => {
    if (!session) return;
    
    try {
      setIsLoading(true);
      let success;
      
      if (session.status === "sleeping") {
        success = await onWakeBot(session.sessionId);
        if (success) {
          setSession({
            ...session,
            status: "active",
          });
        }
      } else {
        success = await onSleepBot(session.sessionId);
        if (success) {
          setSession({
            ...session,
            status: "sleeping",
          });
        }
      }
      
      if (!success) {
        setError("Failed to change bot state");
      }
    } catch (err) {
      setError(typeof err === "string" ? err : (err as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  const renderStatusBadge = () => {
    if (!session) return null;
    
    const colorMap = {
      active: "bg-green-500",
      sleeping: "bg-blue-500",
      idle: "bg-yellow-500",
    };
    
    return (
      <Badge className={`${colorMap[session.status]}`}>
        {session.status.charAt(0).toUpperCase() + session.status.slice(1)}
      </Badge>
    );
  };

  return (
    <Card className="w-full max-w-3xl mx-auto">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Voice Assistant</CardTitle>
          {renderStatusBadge()}
        </div>
      </CardHeader>

      <CardContent>
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        {!session ? (
          <div className="text-center py-12">
            <p className="mb-4">Start a voice conversation with the AI assistant</p>
            <Button onClick={handleStartSession} disabled={isLoading}>
              {isLoading ? "Starting..." : "Start Conversation"}
            </Button>
          </div>
        ) : (
          <div className="h-[400px] relative" ref={containerRef}>
            {/* Daily iframe will be inserted here */}
          </div>
        )}
      </CardContent>

      {session && (
        <CardFooter className="flex justify-between border-t pt-4">
          <div className="text-sm">
            <div>Turns: {session.metrics.totalTurns}</div>
            <div>Interruptions: {session.metrics.interruptions}</div>
          </div>
          <div>
            <Button
              variant="outline"
              onClick={handleToggleSleep}
              disabled={isLoading}
              className="mr-2"
            >
              {session.status === "sleeping" ? "Wake Bot" : "Sleep Bot"}
            </Button>
            <Button variant="destructive" onClick={handleCallEnded} disabled={isLoading}>
              End Call
            </Button>
          </div>
        </CardFooter>
      )}
    </Card>
  );
} 