import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { SessionHeader } from "@/components/session-header"
import { SessionProgress, SessionPhase } from "@/components/session-progress"
import { VoiceVisualization } from "@/components/voice-visualization"
import { TopicPanel, TopicInfo } from "@/components/topic-panel"
import CalendarModal from "@/components/calendar-modal"

interface TherapySessionProps {
  /**
   * Initial state for the therapy session
   */
  initialTopics?: TopicInfo[]
  initialPhase?: SessionPhase
  initialTopic?: string
}

export function TherapySession({
  initialTopics = [
    { id: 1, title: "Week check-in", duration: 5, transcript: "..." },
    { id: 2, title: "Meeting preparation", duration: 8, transcript: "..." },
    { id: 3, title: "Managing Workplace Anxiety", duration: 14, active: true, transcript: "..." },
  ],
  initialPhase = "exploration",
  initialTopic = "Managing Workplace Anxiety"
}: TherapySessionProps) {
  const router = useRouter()
  
  // State for session components
  const [activeState, setActiveState] = useState<"listening" | "speaking" | "reflecting">("listening")
  const [currentTopic, setCurrentTopic] = useState(initialTopic)
  const [topicDuration, setTopicDuration] = useState(14) // minutes spent on current topic
  const [topicSeconds, setTopicSeconds] = useState(0) // seconds for the current topic timer
  const [sessionPhase, setSessionPhase] = useState<SessionPhase>(initialPhase)
  const [phaseProgress, setPhaseProgress] = useState(60) // progress within current phase (percent)
  const [userVoiceIntensity, setUserVoiceIntensity] = useState(0.5)
  const [sessionTime, setSessionTime] = useState(35) // minutes elapsed in session
  const [sessionSeconds, setSessionSeconds] = useState(12) // seconds for session timer
  const [topicProgress, setTopicProgress] = useState(70) // progress in current topic (percent)
  const [showCalendarModal, setShowCalendarModal] = useState(false)

  // Topic history
  const [topicHistory, setTopicHistory] = useState<TopicInfo[]>(initialTopics)

  // Demo cycling through states
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveState((prev) => {
        if (prev === "listening") return "speaking"
        if (prev === "speaking") return "reflecting"
        return "listening"
      })
    }, 4000)

    return () => clearInterval(interval)
  }, [])

  // Working timer for the session
  useEffect(() => {
    const interval = setInterval(() => {
      setSessionSeconds((prev) => {
        if (prev === 59) {
          setSessionTime((prevMin) => prevMin + 1)
          return 0
        }
        return prev + 1
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [])

  // Working timer for the topic
  useEffect(() => {
    const interval = setInterval(() => {
      setTopicSeconds((prev) => {
        if (prev === 59) {
          setTopicDuration((prevMin) => prevMin + 1)
          return 0
        }
        return prev + 1
      })

      // Update topic progress
      setTopicProgress((prev) => {
        if (prev < 100) {
          return prev + 0.05
        }
        return prev
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [])

  // Simulate dynamic voice intensity for listening state
  useEffect(() => {
    if (activeState === "listening") {
      const intensityInterval = setInterval(() => {
        setUserVoiceIntensity(Math.random() * 0.7 + 0.3) // Random value between 0.3 and 1
      }, 150)

      return () => clearInterval(intensityInterval)
    }
  }, [activeState])

  return (
    <div className="flex flex-col min-h-screen bg-[#F5F3FA]">
      <div className="flex items-center justify-center min-h-screen w-full">
        <div className="relative w-full max-w-md h-[100vh] flex flex-col bg-white shadow-lg overflow-hidden">
          {/* Header */}
          <SessionHeader 
            sessionTime={sessionTime}
            sessionSeconds={sessionSeconds}
            onBackClick={() => router.push("/")}
            onCalendarClick={() => setShowCalendarModal(true)}
          />

          {/* Progress visualization */}
          <SessionProgress 
            sessionPhase={sessionPhase}
            phaseProgress={phaseProgress}
          />

          {/* Main voice UI area */}
          <div className="flex-grow flex items-center justify-center relative">
            <VoiceVisualization
              activeState={activeState}
              userVoiceIntensity={userVoiceIntensity}
            />
          </div>

          {/* Topic panel */}
          <TopicPanel
            currentTopic={currentTopic}
            topicDuration={topicDuration}
            topicSeconds={topicSeconds}
            topicProgress={topicProgress}
            topicHistory={topicHistory}
          />

          {/* Home indicator */}
          <div className="flex justify-center py-4 bg-white">
            <div className="w-32 h-1 bg-gray-200 rounded-full"></div>
          </div>
        </div>
      </div>

      {/* Calendar Modal */}
      <CalendarModal isOpen={showCalendarModal} onClose={() => setShowCalendarModal(false)} />
    </div>
  )
} 