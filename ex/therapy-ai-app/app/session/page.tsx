"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
// Add import for Calendar icon and CalendarModal component
import { ArrowLeft, Clock, ChevronDown, ChevronUp, Bookmark, Calendar } from "lucide-react"
import CalendarModal from "@/components/calendar-modal"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useRouter } from "next/navigation"

export default function SessionPage() {
  const router = useRouter()
  const [activeState, setActiveState] = useState("listening") // 'listening', 'speaking', 'reflecting'
  const [currentTopic, setCurrentTopic] = useState("Managing Workplace Anxiety")
  const [topicDuration, setTopicDuration] = useState(14) // minutes spent on current topic
  const [topicSeconds, setTopicSeconds] = useState(0) // seconds for the current topic timer
  const [sessionPhase, setSessionPhase] = useState("exploration") // 'introduction', 'exploration', 'reflection', 'closing'
  const [phaseProgress, setPhaseProgress] = useState(60) // progress within current phase (percent)
  const [userVoiceIntensity, setUserVoiceIntensity] = useState(0.5)
  const [sessionTime, setSessionTime] = useState(35) // minutes elapsed in session
  const [sessionSeconds, setSessionSeconds] = useState(12) // seconds for session timer
  const [topicsExpanded, setTopicsExpanded] = useState(false)
  const [topicProgress, setTopicProgress] = useState(70) // progress in current topic (percent)
  const [showCalendarModal, setShowCalendarModal] = useState(false)

  // Topics covered in this session
  const [topicHistory, setTopicHistory] = useState([
    { id: 1, title: "Week check-in", duration: 5, transcript: "..." },
    { id: 2, title: "Meeting preparation", duration: 8, transcript: "..." },
    { id: 3, title: "Managing Workplace Anxiety", duration: 14, active: true, transcript: "..." },
  ])

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

  // Calculate total session progress based on phases
  const getSessionProgress = () => {
    const phases = {
      introduction: { order: 0, weight: 15 },
      exploration: { order: 1, weight: 50 },
      reflection: { order: 2, weight: 25 },
      closing: { order: 3, weight: 10 },
    }

    let progress = 0

    // Add completed phases
    Object.entries(phases).forEach(([phase, data]) => {
      if (phases[sessionPhase].order > data.order) {
        progress += data.weight
      }
    })

    // Add current phase progress
    progress += (phaseProgress / 100) * phases[sessionPhase].weight

    return progress
  }

  // Format time display
  const formatTime = (mins, secs) => {
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  // Toggle topics panel
  const toggleTopics = () => {
    setTopicsExpanded(!topicsExpanded)
  }

  return (
    <div className="flex flex-col min-h-screen bg-[#F5F3FA]">
      <div className="flex items-center justify-center min-h-screen w-full">
        <div className="relative w-full max-w-md h-[100vh] flex flex-col bg-white shadow-lg overflow-hidden">
          {/* Rest of the content remains the same */}

          {/* Header */}
          <div className="relative px-6 pt-6 pb-3 flex items-center">
            <Button
              variant="ghost"
              size="icon"
              className="p-2 rounded-full bg-primary/20"
              onClick={() => router.push("/")}
            >
              <ArrowLeft className="w-5 h-5 text-primary" />
            </Button>

            <div className="flex-1 flex justify-center items-center">
              <Button variant="ghost" className="flex items-center px-4 py-1.5 rounded-full bg-primary/20 text-primary">
                <span className="font-medium">Deep Exploration</span>
                <ChevronDown className="ml-1 w-4 h-4" />
              </Button>
            </div>

            <Button
              variant="ghost"
              size="icon"
              className="p-2 rounded-full bg-primary/20"
              onClick={() => setShowCalendarModal(true)}
            >
              <Calendar className="w-5 h-5 text-primary" />
            </Button>

            {/* Session time in top right */}
            <div className="absolute top-0 right-0 mt-2 mr-3 text-xs text-gray-500">
              {formatTime(sessionTime, sessionSeconds)}
            </div>
          </div>

          {/* Combined Progress Visualization */}
          <div className="px-6 py-3">
            {/* Phase progress bar */}
            <div className="relative">
              <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                <div className="h-full rounded-full bg-primary" style={{ width: `${getSessionProgress()}%` }}></div>
              </div>

              {/* Phase markers */}
              <div className="flex justify-between absolute top-0 left-0 right-0 -mt-1">
                <div
                  className={cn(
                    "h-4 w-4 rounded-full border-2 border-primary",
                    sessionPhase === "introduction" ? "bg-primary" : "bg-white",
                  )}
                ></div>
                <div
                  className={cn(
                    "h-4 w-4 rounded-full border-2 border-primary",
                    sessionPhase === "exploration" ? "bg-primary" : "bg-white",
                  )}
                ></div>
                <div
                  className={cn(
                    "h-4 w-4 rounded-full border-2 border-primary",
                    sessionPhase === "reflection" ? "bg-primary" : "bg-white",
                  )}
                ></div>
                <div
                  className={cn(
                    "h-4 w-4 rounded-full border-2 border-primary",
                    sessionPhase === "closing" ? "bg-primary" : "bg-white",
                  )}
                ></div>
              </div>
            </div>

            {/* Phase labels */}
            <div className="flex justify-between mt-2 text-xs text-gray-700">
              <div className="text-center -ml-2">Intro</div>
              <div className="text-center font-medium text-primary">Exploration</div>
              <div className="text-center">Reflection</div>
              <div className="text-center -mr-2">Closing</div>
            </div>
          </div>

          {/* Main voice UI area */}
          <div className="flex-grow flex items-center justify-center relative">
            {/* Voice visualization - all modes have same size container */}
            <div className="relative flex items-center justify-center w-80 h-80">
              {/* AI Speaking visualization - rings only, no text */}
              <AnimatePresence>
                {activeState === "speaking" && (
                  <>
                    <motion.div
                      className="absolute rounded-full border-2 border-primary"
                      style={{ opacity: 0.7 }}
                      initial={{ width: 100, height: 100 }}
                      animate={{
                        width: [100, 140, 100],
                        height: [100, 140, 100],
                        opacity: [0.7, 0.4, 0.7],
                      }}
                      transition={{ repeat: Number.POSITIVE_INFINITY, duration: 2 }}
                    />
                    <motion.div
                      className="absolute rounded-full border-2 border-primary"
                      style={{ opacity: 0.5 }}
                      initial={{ width: 160, height: 160 }}
                      animate={{
                        width: [160, 200, 160],
                        height: [160, 200, 160],
                        opacity: [0.5, 0.2, 0.5],
                      }}
                      transition={{ repeat: Number.POSITIVE_INFINITY, duration: 2.7 }}
                    />
                    <motion.div
                      className="absolute rounded-full border-2 border-primary"
                      style={{ opacity: 0.3 }}
                      initial={{ width: 220, height: 220 }}
                      animate={{
                        width: [220, 260, 220],
                        height: [220, 260, 220],
                        opacity: [0.3, 0.1, 0.3],
                      }}
                      transition={{ repeat: Number.POSITIVE_INFINITY, duration: 3.5 }}
                    />
                  </>
                )}
              </AnimatePresence>

              {/* Reflecting visualization - more compact with fixed dimensions */}
              <AnimatePresence>
                {activeState === "reflecting" && (
                  <motion.div className="absolute" style={{ width: 240, height: 240 }}>
                    <svg width="100%" height="100%" viewBox="0 0 100 100">
                      <defs>
                        <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                          <stop offset="0%" stopColor="#8A6BC1" stopOpacity="0.2" />
                          <stop offset="50%" stopColor="#8A6BC1" stopOpacity="1" />
                          <stop offset="100%" stopColor="#8A6BC1" stopOpacity="0.2" />
                        </linearGradient>
                      </defs>

                      {/* Base circle */}
                      <circle cx="50" cy="50" r="40" fill="none" stroke="#8A6BC120" strokeWidth="2" />

                      {/* Animated arc */}
                      <motion.circle
                        cx="50"
                        cy="50"
                        r="40"
                        fill="none"
                        stroke="url(#lineGradient)"
                        strokeWidth="3"
                        strokeLinecap="round"
                        initial={{ strokeDasharray: "30 220" }}
                        animate={{
                          strokeDashoffset: [0, -251], // Full circle circumference is ~251
                        }}
                        transition={{
                          repeat: Number.POSITIVE_INFINITY,
                          duration: 3,
                          ease: "linear",
                        }}
                      />
                    </svg>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Central circle - solid for all states */}
              <motion.div
                className="rounded-full z-10 bg-primary"
                style={{
                  width: activeState === "listening" ? `${80 * (1 + userVoiceIntensity * 0.3)}px` : "80px",
                  height: activeState === "listening" ? `${80 * (1 + userVoiceIntensity * 0.3)}px` : "80px",
                }}
                animate={{
                  scale: activeState === "listening" ? [1, 1 + userVoiceIntensity * 0.2, 1] : 1,
                  transition: { duration: 0.2 },
                }}
              />
            </div>
          </div>

          {/* Bottom integrated section with current focus and topics toggle */}
          <div className="mt-auto">
            {/* Current focus + topics toggle button - full width with curved top */}
            <div
              className="w-full px-6 pt-3 pb-3 flex flex-col cursor-pointer bg-primary/10 rounded-t-3xl"
              onClick={toggleTopics}
            >
              {/* Current focus content */}
              <div className="mb-2">
                <div className="flex items-center justify-between">
                  <div className="text-xs text-gray-500 uppercase font-medium">Current Focus</div>
                  <div className="flex items-center text-sm text-primary">
                    <Clock className="w-3.5 h-3.5 mr-1" />
                    <span>{formatTime(topicDuration, topicSeconds)}</span>
                  </div>
                </div>
                <div className="font-semibold mt-1 text-gray-800">{currentTopic}</div>

                {/* Mini progress bar inside the focus section */}
                <div className="w-full h-1 bg-white rounded-full mt-2 overflow-hidden">
                  <div className="h-full rounded-full bg-primary" style={{ width: `${topicProgress}%` }}></div>
                </div>
              </div>

              {/* Topics toggle */}
              <div className="flex items-center justify-center border-t pt-2 border-white/30">
                <span className="text-sm font-medium mr-1 text-primary">Topics Covered</span>
                {topicsExpanded ? (
                  <ChevronDown className="w-4 h-4 text-primary" />
                ) : (
                  <ChevronUp className="w-4 h-4 text-primary" />
                )}
              </div>
            </div>

            {/* Expandable topics panel */}
            <AnimatePresence>
              {topicsExpanded && (
                <motion.div
                  className="px-6 pt-2 pb-4 bg-primary/10"
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {topicHistory.map((topic) => (
                      <div
                        key={topic.id}
                        className={cn(
                          "flex items-center p-2 rounded-lg transition-all cursor-pointer",
                          topic.active
                            ? "bg-primary/15 border-l-3 border-primary"
                            : "bg-white border-l-3 border-transparent",
                        )}
                      >
                        <div className="flex-1">
                          <div className={cn("text-sm font-medium", topic.active ? "text-primary" : "text-gray-800")}>
                            {topic.title}
                          </div>
                          <div className="text-xs text-gray-500">{topic.duration} min</div>
                        </div>

                        {topic.active && (
                          <div className="flex items-center">
                            <Bookmark className="w-4 h-4 text-primary" />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Home indicator */}
            <div className="flex justify-center py-4 bg-white">
              <div className="w-32 h-1 bg-gray-200 rounded-full"></div>
            </div>
          </div>
        </div>
      </div>

      {/* Calendar Modal */}
      <CalendarModal isOpen={showCalendarModal} onClose={() => setShowCalendarModal(false)} />
    </div>
  )
}

