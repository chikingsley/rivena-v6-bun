"use client"
import { Home, Clock, BarChart, User, Plus } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import Link from "next/link"

interface BottomNavigationProps {
  activeTab: "home" | "history" | "insights" | "profile"
  onQuickActionClick: () => void
}

// Fix the navigation bar spacing and multi-action button position
export default function BottomNavigation({ activeTab, onQuickActionClick }: BottomNavigationProps) {
  return (
    <div className="relative">
      {/* Floating action button */}
      <div className="absolute left-0 right-0 -top-7 flex justify-center z-10">
        <Button variant="default" size="icon" className="w-14 h-14 rounded-full shadow-lg" onClick={onQuickActionClick}>
          <Plus size={24} />
        </Button>
      </div>

      {/* Navigation container */}
      <div className="flex justify-between items-center px-6 py-4 bg-white rounded-t-2xl shadow-[0_-4px_20px_rgba(0,0,0,0.08)]">
        <Link
          href="/"
          className={cn(
            "flex flex-col items-center justify-center px-4 py-1 rounded-xl transition-all",
            activeTab === "home" ? "bg-primary/15" : "hover:bg-gray-100",
          )}
        >
          <Home size={20} className={activeTab === "home" ? "text-primary" : "text-gray-400"} />
          <div className={cn("text-xs mt-1", activeTab === "home" ? "text-primary font-medium" : "text-gray-400")}>
            Home
          </div>
        </Link>

        <Link
          href="/history"
          className={cn(
            "flex flex-col items-center justify-center px-4 py-1 rounded-xl transition-all",
            activeTab === "history" ? "bg-primary/15" : "hover:bg-gray-100",
          )}
        >
          <Clock size={20} className={activeTab === "history" ? "text-primary" : "text-gray-400"} />
          <div className={cn("text-xs mt-1", activeTab === "history" ? "text-primary font-medium" : "text-gray-400")}>
            History
          </div>
        </Link>

        {/* Empty space for FAB */}
        <div className="w-14"></div>

        <Link
          href="/insights"
          className={cn(
            "flex flex-col items-center justify-center px-4 py-1 rounded-xl transition-all",
            activeTab === "insights" ? "bg-primary/15" : "hover:bg-gray-100",
          )}
        >
          <BarChart size={20} className={activeTab === "insights" ? "text-primary" : "text-gray-400"} />
          <div className={cn("text-xs mt-1", activeTab === "insights" ? "text-primary font-medium" : "text-gray-400")}>
            Insights
          </div>
        </Link>

        <Link
          href="/profile"
          className={cn(
            "flex flex-col items-center justify-center px-4 py-1 rounded-xl transition-all",
            activeTab === "profile" ? "bg-primary/15" : "hover:bg-gray-100",
          )}
        >
          <User size={20} className={activeTab === "profile" ? "text-primary" : "text-gray-400"} />
          <div className={cn("text-xs mt-1", activeTab === "profile" ? "text-primary font-medium" : "text-gray-400")}>
            Profile
          </div>
        </Link>
      </div>
    </div>
  )
}

