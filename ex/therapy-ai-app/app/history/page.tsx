"use client"

import { useState } from "react"
import { ChevronRight, Lightbulb, User } from "lucide-react"
import { cn } from "@/lib/utils"
import BottomNavigation from "@/components/bottom-navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

export default function HistoryPage() {
  const [activeTab, setActiveTab] = useState("day")
  const [selectedDate, setSelectedDate] = useState(new Date())

  // Sample history data
  const historyItems = [
    {
      id: 1,
      type: "session",
      title: "Morning reflection",
      time: "7:15 AM",
      duration: 12,
      topics: ["Self-care", "Work preparation"],
      mood: "positive",
    },
    {
      id: 2,
      type: "life_event",
      title: "Your first day in therapy",
      time: "6:25 AM",
      icon: <Lightbulb className="w-5 h-5 text-[#F0C26E]" />,
    },
    {
      id: 3,
      type: "session",
      title: "Anxiety management",
      time: "Yesterday",
      duration: 18,
      topics: ["Workplace stress", "Breathing techniques"],
      mood: "neutral",
    },
    {
      id: 4,
      type: "session",
      title: "Evening reflection",
      time: "Monday",
      durationn: 15,
      topics: ["Daily achievements", "Gratitude practice"],
      mood: "positive",
    },
  ]

  const formatDate = (date) => {
    return date.toLocaleDateString("en-US", { weekday: "long", day: "2-digit", month: "short" })
  }

  return (
    <div className="flex flex-col min-h-screen bg-[#F5F3FA]">
      {/* Status bar */}
      <div className="w-full pt-2 px-4 flex justify-between items-center">
        <div className="text-sm text-gray-500">06:33</div>
        <div className="flex items-center gap-1">
          <div>•••</div>
          <div>📶</div>
          <div>🔋</div>
        </div>
      </div>

      {/* Header with tabs */}
      <div className="px-4 pt-4 pb-2 flex justify-between items-center">
        <div className="flex space-x-6 border-b">
          {["Day", "Week", "Month", "Year"].map((tab) => (
            <Button
              key={tab}
              variant="link"
              className={cn(
                "pb-2 px-0 font-medium",
                activeTab === tab.toLowerCase() ? "text-primary border-b-2 border-primary" : "text-gray-400",
              )}
              onClick={() => setActiveTab(tab.toLowerCase())}
            >
              {tab}
            </Button>
          ))}
        </div>

        <Button
          variant="ghost"
          size="icon"
          className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center"
          onClick={() => (window.location.href = "/profile")}
        >
          <User size={18} className="text-gray-700" />
        </Button>
      </div>

      {/* Date selector */}
      <Button
        variant="ghost"
        className="flex justify-between items-center w-full px-4 py-3 text-left"
        onClick={() => {}}
      >
        <span className="text-xl font-semibold">{formatDate(selectedDate)}</span>
        <ChevronRight className="w-5 h-5" />
      </Button>

      {/* History items */}
      <div className="flex-1 px-4 py-2 space-y-3">
        {historyItems.map((item) => (
          <Card
            key={item.id}
            className="rounded-xl shadow-[0_4px_14px_rgba(0,0,0,0.08),_0_-2px_4px_rgba(255,255,255,0.9)_inset] hover:shadow-[0_6px_20px_rgba(0,0,0,0.1),_0_-2px_4px_rgba(255,255,255,0.9)_inset] transition-all cursor-pointer bg-white"
            onClick={() => (window.location.href = "/session")}
          >
            <CardContent className="p-4">
              {item.type === "life_event" ? (
                <div className="flex items-center">
                  <div className="w-10 h-10 rounded-full bg-[#F0C26E]/20 flex items-center justify-center mr-3">
                    {item.icon}
                  </div>
                  <div className="flex-1">
                    <div className="text-xs uppercase tracking-wide text-gray-500">LIFE EVENT</div>
                    <div className="font-medium">{item.title}</div>
                  </div>
                  <div className="text-sm text-gray-500">{item.time}</div>
                </div>
              ) : (
                <div className="flex items-center">
                  <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center mr-3">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path
                        d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"
                        fill="#8A6BC1"
                      />
                      <circle cx="9" cy="10" r="2" fill="#5A4580" />
                      <circle cx="15" cy="10" r="2" fill="#5A4580" />
                      <path
                        d="M12 16c-1.3 0-2.45-.65-3.13-1.65l-1.44.87C8.38 16.8 10.09 18 12 18c1.92 0 3.61-1.2 4.57-2.78l-1.43-.87C14.46 15.35 13.29 16 12 16z"
                        fill="#5A4580"
                      />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <div className="font-medium">{item.title}</div>
                    <div className="text-xs text-gray-500">
                      {item.duration} min • {item.topics.join(", ")}
                    </div>
                  </div>
                  <div className="text-sm text-gray-500">{item.time}</div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Bottom Navigation */}
      <div className="mt-auto">
        <BottomNavigation activeTab="history" />
      </div>
    </div>
  )
}

