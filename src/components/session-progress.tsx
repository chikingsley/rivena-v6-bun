import { cn } from "@/lib/utils"

export type SessionPhase = "introduction" | "exploration" | "reflection" | "closing"

interface SessionProgressProps {
  /**
   * Current phase of the session
   */
  sessionPhase: SessionPhase
  
  /**
   * Progress within the current phase (0-100)
   */
  phaseProgress: number
  
  /**
   * Optional class name for the container
   */
  className?: string
}

export function SessionProgress({
  sessionPhase,
  phaseProgress,
  className
}: SessionProgressProps) {
  // Calculate overall session progress
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
      if (phases[sessionPhase as SessionPhase].order > data.order) {
        progress += data.weight
      }
    })

    // Add current phase progress
    progress += (phaseProgress / 100) * phases[sessionPhase].weight

    return progress
  }

  return (
    <div className={cn("px-6 py-3", className)}>
      {/* Phase progress bar */}
      <div className="relative">
        <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
          <div 
            className="h-full rounded-full bg-primary" 
            style={{ width: `${getSessionProgress()}%` }}
          ></div>
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
        <div className={cn("text-center", sessionPhase === "exploration" && "font-medium text-primary")}>Exploration</div>
        <div className={cn("text-center", sessionPhase === "reflection" && "font-medium text-primary")}>Reflection</div>
        <div className="text-center -mr-2">Closing</div>
      </div>
    </div>
  )
} 