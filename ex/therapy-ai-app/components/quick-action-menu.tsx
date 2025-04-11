"use client"

import { motion, AnimatePresence } from "framer-motion"
import { X, Sparkles, FileText, SmilePlus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"

interface QuickActionMenuProps {
  isOpen: boolean
  onClose: () => void
}

export default function QuickActionMenu({ isOpen, onClose }: QuickActionMenuProps) {
  const actions = [
    {
      id: "vibe-check",
      title: "Vibe Checkup",
      icon: <Sparkles className="w-5 h-5" />,
      description: "Quick mood and energy check",
      color: "#F0C26E",
    },
    {
      id: "deep-exploration",
      title: "Deep Exploration",
      icon: <FileText className="w-5 h-5" />,
      description: "Dive deep into your thoughts",
      color: "#8A6BC1",
    },
    {
      id: "continue",
      title: "Continue Yesterday",
      icon: <SmilePlus className="w-5 h-5" />,
      description: "Pick up where you left off",
      color: "#6BAA75",
    },
  ]

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-end justify-center z-50"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="bg-white w-full rounded-t-3xl overflow-hidden max-w-md"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 25 }}
          >
            <div className="p-4">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold">Quick Actions</h2>
                <Button variant="ghost" size="icon" className="w-8 h-8 rounded-full bg-gray-100" onClick={onClose}>
                  <X size={16} />
                </Button>
              </div>

              <div className="space-y-3 mb-6">
                {actions.map((action) => (
                  <Card
                    key={action.id}
                    className="p-4 flex items-center space-x-4 cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => {
                      onClose()
                      window.location.href = "/session"
                    }}
                  >
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center"
                      style={{ backgroundColor: `${action.color}20`, color: action.color }}
                    >
                      {action.icon}
                    </div>
                    <div className="flex-1">
                      <div className="font-medium">{action.title}</div>
                      <div className="text-sm text-gray-500">{action.description}</div>
                    </div>
                  </Card>
                ))}
              </div>

              {/* Home indicator */}
              <div className="flex justify-center pb-4">
                <div className="w-32 h-1 bg-gray-200 rounded-full"></div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

