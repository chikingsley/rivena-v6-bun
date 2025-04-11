"use client"

import { useState } from "react"
import { User, Sun, Moon, ArrowRight, Flame, Brain, Sparkles } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import BottomNavigation from "@/components/bottom-navigation"
import CalendarModal from "@/components/calendar-modal"
import QuickActionMenu from "@/components/quick-action-menu"

export default function HomePage() {
  const [showCalendarModal, setShowCalendarModal] = useState(false)
  const [showQuickActionMenu, setShowQuickActionMenu] = useState(false)
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)

  // Current day and streak data
  const streakCount = 5
  const currentDate = new Date()
  const days = [
    { day: "Su", date: "09", completed: false },
    { day: "Mo", date: "10", completed: true },
    { day: "Tu", date: "11", completed: false, current: true },
    { day: "We", date: "12", completed: false },
    { day: "Th", date: "13", completed: false },
    { day: "Fr", date: "14", completed: false },
    { day: "Sa", date: "15", completed: false },
  ]

  // Session suggestions
  const suggestions = [
    {
      title: "Managing workplace anxiety",
      description: "Continuing from Monday",
      duration: "15 min",
      type: "Deep Exploration",
      icon: <Brain className="w-5 h-5 text-primary" />,
    },
    {
      title: "Quick energy check-in",
      description: "New session available",
      duration: "5 min",
      type: "Vibe Check",
      icon: <Sparkles className="w-5 h-5 text-[#F0C26E]" />,
    },
    {
      title: "Mindfulness practice",
      description: "Recommended for you",
      duration: "10 min",
      type: "Skill Building",
      icon: <Sun className="w-5 h-5 text-[#6BAA75]" />,
    },
  ]

  return (
    <div className="flex flex-col min-h-screen bg-[#F5F3FA]">
      {/* Status bar */}
      <div className="w-full pt-2 px-4 flex justify-between items-center">
        <div className="text-sm text-gray-500">06:51</div>
        <div className="flex items-center gap-1">
          <div>•••</div>
          <div>📶</div>
          <div>🔋</div>
        </div>
      </div>

      {/* Header */}
      <div className="p-4 flex justify-between items-center">
        {/* Streak counter */}
        <div className="flex items-center">
          <div className="h-8 px-3 rounded-full flex items-center justify-center border-2 border-[#D9A440] bg-[#F0C26E]/30">
            <Flame size={16} className="text-[#D9A440]" />
            <span className="ml-1 font-bold text-[#D9A440]">{streakCount}</span>
          </div>
        </div>

        {/* Centered greeting */}
        <div className="absolute left-0 right-0 flex flex-col items-center justify-center">
          <div className="text-lg font-semibold">Good Morning.</div>
          <div className="text-sm text-gray-500">
            {currentDate.toLocaleDateString("en-US", { month: "long", day: "numeric" })}
          </div>
        </div>

        {/* Profile */}
        <Button
          variant="ghost"
          size="icon"
          className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center"
          onClick={() => (window.location.href = "/profile")}
        >
          <User size={18} className="text-gray-700" />
        </Button>
      </div>

      {/* Weekly Calendar */}
      <div className="px-4 py-2 flex justify-between">
        {days.map((day, index) => (
          <div
            key={index}
            className={cn(
              "flex flex-col items-center p-2 rounded-lg cursor-pointer",
              day.current ? "border-2 border-primary" : "",
              selectedDate === index ? "border-2 border-primary" : "",
            )}
            onClick={() => setSelectedDate(selectedDate === index ? null : index)}
          >
            <div className={cn("text-sm", day.current ? "text-gray-800" : "text-gray-500")}>{day.day}</div>
            <div className={cn("font-bold", day.current ? "text-gray-800" : "text-gray-500")}>{day.date}</div>
            {day.completed && (
              <div className="mt-1 text-xs">
                <div className="w-4 h-4 rounded-full flex items-center justify-center bg-primary">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M9 16.2L4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4L9 16.2z" fill="white" />
                  </svg>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Session Cards */}
      <div className="px-4 py-4 flex space-x-4">
        {/* Morning Check-in Card */}
        <Card
          className="flex-1 rounded-xl shadow-md hover:shadow-lg transition-all cursor-pointer transform hover:-translate-y-1 duration-200 bg-white"
          onClick={() => (window.location.href = "/session")}
        >
          <CardContent className="p-6 flex flex-col h-full justify-center">
            <div className="text-xl font-bold mb-1">Let's start your day</div>
            <div className="text-gray-500 text-sm mb-4">with morning reflection</div>
            <div className="flex items-center justify-center">
              <div className="w-12 h-12 rounded-full flex items-center justify-center bg-primary/20">
                <Sun size={24} className="text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Evening Reflection Card */}
        <Card
          className="flex-1 rounded-xl shadow-md hover:shadow-lg transition-all cursor-pointer transform hover:-translate-y-1 duration-200 bg-white"
          onClick={() => (window.location.href = "/session")}
        >
          <CardContent className="p-6 flex flex-col h-full justify-center">
            <div className="text-xl font-bold mb-1">Evening Reflection</div>
            <div className="text-gray-500 text-sm mb-4">Sum up your day</div>
            <div className="flex items-center justify-center">
              <div className="w-12 h-12 rounded-full flex items-center justify-center bg-primary/20">
                <Moon size={24} className="text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Suggestions Section */}
      <div className="px-4 py-4">
        <div className="uppercase tracking-wider text-xs font-semibold mb-3 text-gray-500">Session Suggestions</div>

        <div className="space-y-3">
          {suggestions.map((suggestion, index) => (
            <Card
              key={index}
              className="rounded-xl shadow-md hover:shadow-lg transition-all cursor-pointer transform hover:-translate-y-0.5 duration-200 bg-white"
              onClick={() => (window.location.href = "/session")}
            >
              <CardContent className="p-4">
                <div className="flex items-start">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center mr-3 bg-primary/20">
                    {suggestion.icon}
                  </div>
                  <div className="flex-1">
                    <div className="text-sm text-gray-500">{suggestion.description}</div>
                    <div className="text-base font-semibold mb-1">{suggestion.title}</div>
                    <div className="text-sm text-gray-500">
                      {suggestion.duration} • {suggestion.type}
                    </div>
                  </div>
                  <div className="w-8 h-8 rounded-full flex items-center justify-center bg-primary">
                    <ArrowRight size={18} className="text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Bottom Navigation */}
      <div className="mt-auto">
        <BottomNavigation activeTab="home" onQuickActionClick={() => setShowQuickActionMenu(true)} />
      </div>

      {/* Calendar Modal */}
      <CalendarModal isOpen={showCalendarModal} onClose={() => setShowCalendarModal(false)} />

      {/* Quick Action Menu */}
      <QuickActionMenu isOpen={showQuickActionMenu} onClose={() => setShowQuickActionMenu(false)} />
    </div>
  )
}

