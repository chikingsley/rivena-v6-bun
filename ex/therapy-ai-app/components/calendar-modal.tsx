"use client"
import { motion, AnimatePresence } from "framer-motion"
import { X, ArrowLeft, MoreVertical } from "lucide-react"
import { Button } from "@/components/ui/button"

interface CalendarDay {
  date: Date
  current: boolean
  isToday: boolean
  currentMonth: boolean
  hasSession: boolean
  sessionType?: "deep-exploration" | "check-in" | "skill-building"
}

interface Session {
  date: string
  topic: string
  duration: number
  sessionType: "deep-exploration" | "check-in" | "skill-building"
  current: boolean
}

interface CalendarModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function CalendarModal({ isOpen, onClose }: CalendarModalProps) {
  const theme = {
    primary: "#8A6BC1",
    accent: "#F0C26E",
    success: "#6BAA75",
  }

  // Generate calendar days for the current month
  const generateCalendarDays = (): CalendarDay[] => {
    const today = new Date()
    const currentMonth = new Date(today.getFullYear(), today.getMonth(), 1)
    const days: CalendarDay[] = []

    // Add previous month's days
    const firstDay = currentMonth.getDay()
    for (let i = firstDay - 1; i >= 0; i--) {
      const date = new Date(currentMonth)
      date.setDate(-i)
      days.push({
        date,
        current: false,
        isToday: false,
        currentMonth: false,
        hasSession: Math.random() > 0.7,
        sessionType: Math.random() > 0.5 ? "deep-exploration" : "check-in",
      })
    }

    // Add current month's days
    const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate()
    for (let i = 1; i <= daysInMonth; i++) {
      const date = new Date(currentMonth)
      date.setDate(i)
      days.push({
        date,
        current: i === today.getDate(),
        isToday: i === today.getDate(),
        currentMonth: true,
        hasSession: Math.random() > 0.7,
        sessionType: Math.random() > 0.5 ? "deep-exploration" : "check-in",
      })
    }

    // Add next month's days
    const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDay()
    for (let i = 1; i < 7 - lastDay; i++) {
      const date = new Date(currentMonth)
      date.setMonth(date.getMonth() + 1)
      date.setDate(i)
      days.push({
        date,
        current: false,
        isToday: false,
        currentMonth: false,
        hasSession: Math.random() > 0.7,
        sessionType: Math.random() > 0.5 ? "deep-exploration" : "check-in",
      })
    }

    return days
  }

  const calendarDays = generateCalendarDays()

  // Sample session data
  const calendarData: Session[] = [
    {
      date: new Date().toISOString(),
      topic: "Managing Workplace Anxiety",
      duration: 25,
      sessionType: "deep-exploration",
      current: true,
    },
    {
      date: new Date(Date.now() - 86400000).toISOString(),
      topic: "Morning Check-in",
      duration: 10,
      sessionType: "check-in",
      current: false,
    },
    {
      date: new Date(Date.now() - 172800000).toISOString(),
      topic: "Mindfulness Practice",
      duration: 15,
      sessionType: "skill-building",
      current: false,
    },
  ]

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="bg-white m-4 rounded-xl overflow-hidden shadow-xl w-full max-w-md"
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 50, opacity: 0 }}
            transition={{ type: "spring", damping: 25 }}
          >
            {/* Modal Header */}
            <div className="p-4 flex items-center justify-between border-b border-gray-100">
              <div className="text-lg font-semibold">Session Timeline</div>
              <Button variant="ghost" size="icon" className="w-8 h-8 rounded-full bg-gray-100" onClick={onClose}>
                <X size={16} />
              </Button>
            </div>

            {/* Month Navigation */}
            <div className="px-4 py-2 flex justify-between items-center">
              <Button variant="ghost" size="icon" className="p-1">
                <ArrowLeft size={16} />
              </Button>
              <div className="font-medium">March 2025</div>
              <Button variant="ghost" size="icon" className="p-1">
                <MoreVertical size={16} />
              </Button>
            </div>

            {/* Calendar Grid */}
            <div className="px-4 py-2">
              {/* Day headers */}
              <div className="grid grid-cols-7 mb-2">
                {["S", "M", "T", "W", "T", "F", "S"].map((day, index) => (
                  <div key={index} className="text-center text-xs text-gray-500">
                    {day}
                  </div>
                ))}
              </div>

              {/* Calendar days */}
              <div className="grid grid-cols-7 gap-1">
                {calendarDays.map((day, index) => (
                  <div
                    key={index}
                    className="relative aspect-square flex flex-col items-center justify-center rounded-lg cursor-pointer hover:bg-primary/10 transition-colors"
                    style={{
                      backgroundColor: day.isToday ? `${theme.primary}20` : "transparent",
                      opacity: day.currentMonth ? 1 : 0.3,
                    }}
                  >
                    <div
                      className="w-7 h-7 flex items-center justify-center rounded-full"
                      style={{
                        backgroundColor: day.current ? theme.primary : "transparent",
                        color: day.current ? "white" : day.isToday ? theme.primary : "inherit",
                      }}
                    >
                      {day.date.getDate()}
                    </div>

                    {day.hasSession && (
                      <div
                        className="w-4 h-1 rounded-full mt-0.5"
                        style={{
                          backgroundColor:
                            day.sessionType === "deep-exploration"
                              ? theme.primary
                              : day.sessionType === "check-in"
                                ? theme.accent
                                : theme.success,
                        }}
                      ></div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Session Details */}
            <div className="p-4 border-t border-gray-100">
              <div className="text-sm font-semibold mb-2">Session History</div>

              <div className="space-y-3 max-h-48 overflow-y-auto">
                {calendarData.map((session, index) => (
                  <div
                    key={index}
                    className="flex items-start p-2 rounded-lg cursor-pointer hover:bg-gray-50"
                    style={{
                      backgroundColor: session.current ? `${theme.primary}10` : "transparent",
                      borderLeft: session.current ? `3px solid ${theme.primary}` : "none",
                    }}
                  >
                    <div
                      className="w-2 h-2 mt-1.5 mr-2 rounded-full"
                      style={{
                        backgroundColor:
                          session.sessionType === "deep-exploration"
                            ? theme.primary
                            : session.sessionType === "check-in"
                              ? theme.accent
                              : theme.success,
                      }}
                    ></div>
                    <div className="flex-1">
                      <div className="flex justify-between">
                        <div className="text-sm font-medium">{session.topic}</div>
                        <div className="text-xs text-gray-500">{session.duration} min</div>
                      </div>
                      <div className="text-xs text-gray-500">
                        {new Date(session.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })} •
                        {session.sessionType === "deep-exploration"
                          ? " Deep Exploration"
                          : session.sessionType === "check-in"
                            ? " Check-in"
                            : " Skill Building"}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 flex justify-between border-t border-gray-100">
              <Button variant="ghost" className="px-4 py-2 rounded-lg bg-primary/20 text-primary hover:bg-primary/30">
                Schedule Session
              </Button>
              <Button variant="default" className="px-4 py-2 rounded-lg" onClick={onClose}>
                Close
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

