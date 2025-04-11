import { Button } from "@/components/ui/button"
import { ArrowLeft, ChevronDown, Calendar } from "lucide-react"

interface SessionHeaderProps {
  /**
   * Current session time in minutes and seconds
   */
  sessionTime: number
  sessionSeconds: number
  
  /**
   * Session mode - what type of session is this
   */
  sessionMode?: string
  
  /**
   * Callback for when the back button is clicked
   */
  onBackClick: () => void
  
  /**
   * Callback for when the calendar button is clicked
   */
  onCalendarClick: () => void
}

export function SessionHeader({
  sessionTime,
  sessionSeconds,
  sessionMode = "Deep Exploration",
  onBackClick,
  onCalendarClick
}: SessionHeaderProps) {
  // Format time display
  const formatTime = (mins: number, secs: number) => {
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }
  
  return (
    <div className="relative px-6 pt-6 pb-3 flex items-center">
      <Button
        variant="ghost"
        size="icon"
        className="p-2 rounded-full bg-primary/20"
        onClick={onBackClick}
      >
        <ArrowLeft className="w-5 h-5 text-primary" />
      </Button>

      <div className="flex-1 flex justify-center items-center">
        <Button variant="ghost" className="flex items-center px-4 py-1.5 rounded-full bg-primary/20 text-primary">
          <span className="font-medium">{sessionMode}</span>
          <ChevronDown className="ml-1 w-4 h-4" />
        </Button>
      </div>

      <Button
        variant="ghost"
        size="icon"
        className="p-2 rounded-full bg-primary/20"
        onClick={onCalendarClick}
      >
        <Calendar className="w-5 h-5 text-primary" />
      </Button>

      {/* Session time in top right */}
      <div className="absolute top-0 right-0 mt-2 mr-3 text-xs text-gray-500">
        {formatTime(sessionTime, sessionSeconds)}
      </div>
    </div>
  )
} 