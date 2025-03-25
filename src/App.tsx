import "./index.css";
import { APITester } from "./APITester";
import { VoiceChat } from "./components/VoiceChat";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import voiceAIService from "./lib/voice-ai-service";

import logo from "./logo.svg";
import reactLogo from "./react.svg";

export function App() {
  const handleStartSession = async () => {
    return await voiceAIService.startSession();
  };

  const handleEndSession = async (sessionId: string) => {
    return await voiceAIService.endSession(sessionId);
  };

  const handleSleepBot = async (sessionId: string) => {
    return await voiceAIService.sleepBot(sessionId);
  };

  const handleWakeBot = async (sessionId: string) => {
    return await voiceAIService.wakeBot(sessionId);
  };

  return (
    <div className="container mx-auto p-8 text-center relative z-10">
      <div className="flex justify-center items-center gap-8 mb-8">
        <img
          src={logo}
          alt="Bun Logo"
          className="h-36 p-6 transition-all duration-300 hover:drop-shadow-[0_0_2em_#646cffaa] scale-120"
        />
        <img
          src={reactLogo}
          alt="React Logo"
          className="h-36 p-6 transition-all duration-300 hover:drop-shadow-[0_0_2em_#61dafbaa] [animation:spin_20s_linear_infinite]"
        />
      </div>

      <Card className="bg-card/50 backdrop-blur-sm border-muted mb-8">
        <CardContent className="pt-6">
          <h1 className="text-5xl font-bold my-4 leading-tight">Bun + React</h1>
          <p className="mb-4">
            Edit{" "}
            <code className="relative rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono text-sm">
              src/App.tsx
            </code>{" "}
            and save to test HMR
          </p>
        </CardContent>
      </Card>

      <Tabs defaultValue="voice" className="w-full">
        <TabsList className="mx-auto flex justify-center mb-6">
          <TabsTrigger value="voice">Voice Assistant</TabsTrigger>
          <TabsTrigger value="api">API Tester</TabsTrigger>
        </TabsList>
        <TabsContent value="voice">
          <VoiceChat 
            onStartSession={handleStartSession}
            onEndSession={handleEndSession}
            onSleepBot={handleSleepBot}
            onWakeBot={handleWakeBot}
          />
        </TabsContent>
        <TabsContent value="api">
          <APITester />
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default App;
