"use client"

import { useState } from "react"
import { ChevronRight, Sun, Moon, X, Lock } from "lucide-react"
import { cn } from "@/lib/utils"
import BottomNavigation from "@/components/bottom-navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { useRouter } from "next/navigation"

export default function ProfilePage() {
  const router = useRouter()
  const [darkMode, setDarkMode] = useState(false)

  return (
    <div className={cn("flex flex-col min-h-screen", darkMode ? "dark bg-gray-900" : "bg-[#F5F3FA]")}>
      {/* Status bar */}
      <div className="w-full pt-2 px-4 flex justify-between items-center">
        <div className={cn("text-sm", darkMode ? "text-gray-400" : "text-gray-500")}>06:32</div>
        <div className="flex items-center gap-1">
          <div>•••</div>
          <div>📶</div>
          <div>🔋</div>
        </div>
      </div>

      {/* Header with close button */}
      <div className="px-4 pt-4 pb-2 flex justify-between items-center">
        <div></div> {/* Empty div for spacing */}
        <Button variant="ghost" size="icon" className="rounded-full" onClick={() => router.push("/")}>
          <X size={20} className={darkMode ? "text-white" : "text-gray-700"} />
        </Button>
      </div>

      {/* Title */}
      <div className="px-4 pt-2 pb-6">
        <h1 className={cn("text-4xl font-bold", darkMode ? "text-white" : "text-gray-800")}>your profile.</h1>
      </div>

      {/* Premium card with neomorphic styling */}
      <Card
        className={cn(
          "mx-4 rounded-xl",
          darkMode
            ? "bg-gray-800 text-white shadow-[0_4px_14px_rgba(0,0,0,0.2),_0_-2px_4px_rgba(255,255,255,0.05)_inset]"
            : "bg-white shadow-[0_4px_14px_rgba(0,0,0,0.08),_0_-2px_4px_rgba(255,255,255,0.9)_inset]",
        )}
      >
        <CardContent className="p-6 text-center">
          <div className="flex items-center justify-center mb-2">
            <Lock className="w-6 h-6 text-gray-400 mr-2" />
          </div>
          <h2 className={cn("text-xl font-bold mb-2", darkMode ? "text-white" : "text-gray-800")}>
            Unlock all our exercises, prompts, AI features, Cloud Sync, and more
          </h2>
          <p className={cn("text-sm mb-4", darkMode ? "text-gray-300" : "text-gray-600")}>With Therapy Premium Plans</p>

          <Button
            variant={darkMode ? "outline" : "secondary"}
            className={cn(
              "rounded-full px-6",
              darkMode ? "border-gray-600 text-white hover:bg-gray-700" : "bg-gray-200 text-gray-800",
            )}
          >
            Try 7 Days for Free
          </Button>
        </CardContent>
      </Card>

      {/* Personalize section */}
      <div className="px-4 mt-8">
        <h3
          className={cn(
            "text-xs uppercase tracking-wider font-semibold mb-4",
            darkMode ? "text-gray-400" : "text-gray-500",
          )}
        >
          PERSONALIZE
        </h3>

        {/* Personalize cards with neomorphic styling */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <Card
            className={cn(
              "rounded-xl transition-all hover:shadow-lg cursor-pointer",
              darkMode
                ? "bg-gray-800 shadow-[0_4px_14px_rgba(0,0,0,0.2),_0_-2px_4px_rgba(255,255,255,0.05)_inset]"
                : "bg-white shadow-[0_4px_14px_rgba(0,0,0,0.08),_0_-2px_4px_rgba(255,255,255,0.9)_inset]",
            )}
          >
            <CardContent className="p-4 flex flex-col items-center justify-center">
              <Sun className={cn("w-6 h-6 mb-2", darkMode ? "text-white" : "text-gray-800")} />
              <span className={cn("text-center font-medium", darkMode ? "text-white" : "text-gray-800")}>
                Morning Preparation
              </span>
            </CardContent>
          </Card>

          <Card
            className={cn(
              "rounded-xl transition-all hover:shadow-lg cursor-pointer",
              darkMode
                ? "bg-gray-800 shadow-[0_4px_14px_rgba(0,0,0,0.2),_0_-2px_4px_rgba(255,255,255,0.05)_inset]"
                : "bg-white shadow-[0_4px_14px_rgba(0,0,0,0.08),_0_-2px_4px_rgba(255,255,255,0.9)_inset]",
            )}
          >
            <CardContent className="p-4 flex flex-col items-center justify-center">
              <Moon className={cn("w-6 h-6 mb-2", darkMode ? "text-white" : "text-gray-800")} />
              <span className={cn("text-center font-medium", darkMode ? "text-white" : "text-gray-800")}>
                Evening Reflection
              </span>
            </CardContent>
          </Card>
        </div>

        {/* Settings list */}
        <div className="space-y-1">
          <Button
            variant="ghost"
            className={cn(
              "w-full flex items-center justify-between py-4 px-4 rounded-lg",
              darkMode ? "text-white hover:bg-gray-800" : "text-gray-800 hover:bg-gray-100",
            )}
          >
            <span>Preferences</span>
            <ChevronRight size={18} className="text-gray-400" />
          </Button>

          <Button
            variant="ghost"
            className={cn(
              "w-full flex items-center justify-between py-4 px-4 rounded-lg",
              darkMode ? "text-white hover:bg-gray-800" : "text-gray-800 hover:bg-gray-100",
            )}
            onClick={() => setDarkMode(!darkMode)}
          >
            <span>Appearance</span>
            <div className="flex items-center">
              <span className="mr-2 text-sm text-gray-400">{darkMode ? "Dark" : "Light"}</span>
              <Switch checked={darkMode} onCheckedChange={setDarkMode} />
            </div>
          </Button>

          <Button
            variant="ghost"
            className={cn(
              "w-full flex items-center justify-between py-4 px-4 rounded-lg",
              darkMode ? "text-white hover:bg-gray-800" : "text-gray-800 hover:bg-gray-100",
            )}
          >
            <span>Therapy Shield</span>
            <ChevronRight size={18} className="text-gray-400" />
          </Button>
        </div>
      </div>

      {/* Bottom Navigation */}
      <div className="mt-auto">
        <BottomNavigation activeTab="profile" />
      </div>
    </div>
  )
}

