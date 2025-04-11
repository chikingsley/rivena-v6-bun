import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Clock, ChevronDown, ChevronUp, Bookmark } from "lucide-react"
import { cn } from "@/lib/utils"

export interface TopicInfo {
  id: number | string
  title: string
  duration: number // in minutes
  active?: boolean
  transcript?: string
}

interface TopicPanelProps {
  /**
   * Current topic being discussed
   */
  currentTopic: string
  
  /**
   * Duration of the current topic in minutes and seconds
   */
  topicDuration: number
  topicSeconds: number
  
  /**
   * Progress in the current topic (0-100)
   */
  topicProgress: number
  
  /**
   * List of all topics covered in the session
   */
  topicHistory: TopicInfo[]
  
  /**
   * Optional class name for container
   */
  className?: string
}

export function TopicPanel({
  currentTopic,
  topicDuration,
  topicSeconds,
  topicProgress,
  topicHistory,
  className
}: TopicPanelProps) {
  const [topicsExpanded, setTopicsExpanded] = useState(false)
  
  // Toggle topics panel
  const toggleTopics = () => {
    setTopicsExpanded(!topicsExpanded)
  }
  
  // Format time display
  const formatTime = (mins: number, secs: number) => {
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }
  
  return (
    <div className={cn("mt-auto", className)}>
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
            <div 
              className="h-full rounded-full bg-primary" 
              style={{ width: `${topicProgress}%` }}
            ></div>
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
    </div>
  )
} 