"use client"

import { useState } from "react"
import { ChevronLeft, ChevronRight, User } from "lucide-react"
import { cn } from "@/lib/utils"
import BottomNavigation from "@/components/bottom-navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export default function InsightsPage() {
  const [selectedPeriod, setSelectedPeriod] = useState("month")
  const [currentMonth, setCurrentMonth] = useState("March")
  const [selectedMood, setSelectedMood] = useState(null)

  // Mood options
  const moods = [
    { value: "very_negative", icon: "😞", label: "Very Negative" },
    { value: "negative", icon: "😔", label: "Negative" },
    { value: "neutral", icon: "😐", label: "Neutral" },
    { value: "positive", icon: "🙂", label: "Positive" },
    { value: "very_positive", icon: "😊", label: "Very Positive" },
  ]

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

      {/* Header */}
      <div className="px-4 pt-4 pb-2 flex justify-between items-center">
        <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
          <SelectTrigger className="w-32 bg-transparent border-none shadow-none focus:ring-0">
            <SelectValue placeholder="Select period" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="week">Week</SelectItem>
            <SelectItem value="month">Month</SelectItem>
            <SelectItem value="year">Year</SelectItem>
          </SelectContent>
        </Select>

        <Button
          variant="ghost"
          size="icon"
          className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center"
          onClick={() => (window.location.href = "/profile")}
        >
          <User size={18} className="text-gray-700" />
        </Button>
      </div>

      {/* Title */}
      <div className="px-4 pt-2 pb-6">
        <h1 className="text-4xl font-bold text-gray-800">trends.</h1>
      </div>

      {/* Empty state message */}
      <div className="px-4 text-center">
        <p className="text-xl text-gray-500">Here you will see how your mood changes during the month</p>
        <p className="text-gray-400 mt-2">But there is no data yet to show</p>
      </div>

      {/* Mood selection card with neomorphic styling */}
      <Card className="mx-4 mt-8 rounded-xl shadow-[0_4px_14px_rgba(0,0,0,0.08),_0_-2px_4px_rgba(255,255,255,0.9)_inset] bg-white">
        <CardContent className="p-6 text-center">
          <h2 className="text-2xl font-bold mb-2">How are you feeling right now?</h2>
          <p className="text-gray-500 mb-6">Fill your current mood to add first datapoint to your trends</p>

          <div className="flex justify-between items-center">
            {moods.map((mood) => (
              <Button
                key={mood.value}
                variant="ghost"
                className={cn(
                  "w-14 h-14 rounded-full flex items-center justify-center text-2xl transition-all",
                  selectedMood === mood.value
                    ? "bg-primary/20 shadow-[0_2px_8px_rgba(138,107,193,0.3)_inset]"
                    : "hover:bg-gray-100",
                )}
                onClick={() => setSelectedMood(mood.value)}
              >
                {mood.icon}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* General insights section */}
      <div className="px-4 mt-10">
        <h3 className="text-xs uppercase tracking-wider text-gray-500 font-semibold mb-4">GENERAL INSIGHTS</h3>

        {/* General insights card with neomorphic styling */}
        <Card className="rounded-xl shadow-[0_4px_14px_rgba(0,0,0,0.08),_0_-2px_4px_rgba(255,255,255,0.9)_inset] mb-4 bg-white">
          <CardContent className="p-4">
            <p className="text-gray-500">Your mood trends will appear here after you log a few entries</p>
          </CardContent>
        </Card>

        {/* Month selector */}
        <div className="flex items-center justify-between bg-gray-800 text-white rounded-full px-4 py-2 mt-4">
          <Button variant="ghost" size="icon" className="text-white p-1 h-auto">
            <ChevronLeft size={20} />
          </Button>

          <div className="flex flex-col items-center">
            <span className="text-sm text-gray-400">{currentMonth}</span>
            <span className="font-semibold">This month</span>
          </div>

          <Button variant="ghost" size="icon" className="text-white p-1 h-auto">
            <ChevronRight size={20} />
          </Button>
        </div>
      </div>

      {/* Bottom Navigation */}
      <div className="mt-auto">
        <BottomNavigation activeTab="insights" />
      </div>
    </div>
  )
}

