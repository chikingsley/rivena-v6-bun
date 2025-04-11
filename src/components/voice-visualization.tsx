import { motion, AnimatePresence } from "framer-motion"

interface VoiceVisualizationProps {
  /**
   * Current state of voice interaction
   * - listening: User is speaking
   * - speaking: AI is speaking
   * - reflecting: AI is processing/thinking
   */
  activeState: "listening" | "speaking" | "reflecting"
  
  /**
   * Voice intensity value between 0 and 1
   * Used for the listening state visualization
   */
  userVoiceIntensity: number
  
  /**
   * Optional primary color for the visualization
   * Defaults to the theme's primary color
   */
  primaryColor?: string
  
  /**
   * Optional size for the visualization container
   * Defaults to 320px (w-80 h-80)
   */
  size?: number
}

export function VoiceVisualization({ 
  activeState,
  userVoiceIntensity,
  primaryColor = "#8A6BC1", // Default primary purple
  size = 320 // Default size (w-80 h-80)
}: VoiceVisualizationProps) {
  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      {/* AI Speaking visualization - rings only, no text */}
      <AnimatePresence>
        {activeState === "speaking" && (
          <>
            <motion.div
              className="absolute rounded-full"
              style={{ 
                opacity: 0.7,
                borderWidth: 2,
                borderColor: primaryColor
              }}
              initial={{ width: size * 0.31, height: size * 0.31 }} // ~100px at size=320
              animate={{
                width: [size * 0.31, size * 0.44, size * 0.31], // ~[100, 140, 100]px at size=320
                height: [size * 0.31, size * 0.44, size * 0.31],
                opacity: [0.7, 0.4, 0.7],
              }}
              transition={{ repeat: Number.POSITIVE_INFINITY, duration: 2 }}
            />
            <motion.div
              className="absolute rounded-full"
              style={{ 
                opacity: 0.5,
                borderWidth: 2,
                borderColor: primaryColor
              }}
              initial={{ width: size * 0.5, height: size * 0.5 }} // ~160px at size=320
              animate={{
                width: [size * 0.5, size * 0.625, size * 0.5], // ~[160, 200, 160]px at size=320
                height: [size * 0.5, size * 0.625, size * 0.5],
                opacity: [0.5, 0.2, 0.5],
              }}
              transition={{ repeat: Number.POSITIVE_INFINITY, duration: 2.7 }}
            />
            <motion.div
              className="absolute rounded-full"
              style={{ 
                opacity: 0.3,
                borderWidth: 2,
                borderColor: primaryColor
              }}
              initial={{ width: size * 0.69, height: size * 0.69 }} // ~220px at size=320
              animate={{
                width: [size * 0.69, size * 0.81, size * 0.69], // ~[220, 260, 220]px at size=320
                height: [size * 0.69, size * 0.81, size * 0.69],
                opacity: [0.3, 0.1, 0.3],
              }}
              transition={{ repeat: Number.POSITIVE_INFINITY, duration: 3.5 }}
            />
          </>
        )}
      </AnimatePresence>

      {/* Reflecting visualization - more compact with fixed dimensions */}
      <AnimatePresence>
        {activeState === "reflecting" && (
          <motion.div className="absolute" style={{ width: size * 0.75, height: size * 0.75 }}> {/* 240px at size=320 */}
            <svg width="100%" height="100%" viewBox="0 0 100 100">
              <defs>
                <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor={primaryColor} stopOpacity="0.2" />
                  <stop offset="50%" stopColor={primaryColor} stopOpacity="1" />
                  <stop offset="100%" stopColor={primaryColor} stopOpacity="0.2" />
                </linearGradient>
              </defs>

              {/* Base circle */}
              <circle 
                cx="50" 
                cy="50" 
                r="40" 
                fill="none" 
                stroke={`${primaryColor}20`} 
                strokeWidth="2" 
              />

              {/* Animated arc */}
              <motion.circle
                cx="50"
                cy="50"
                r="40"
                fill="none"
                stroke="url(#lineGradient)"
                strokeWidth="3"
                strokeLinecap="round"
                initial={{ strokeDasharray: "30 220" }}
                animate={{
                  strokeDashoffset: [0, -251], // Full circle circumference is ~251
                }}
                transition={{
                  repeat: Number.POSITIVE_INFINITY,
                  duration: 3,
                  ease: "linear",
                }}
              />
            </svg>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Central circle - solid for all states */}
      <motion.div
        className="rounded-full z-10"
        style={{
          width: activeState === "listening" ? `${size * 0.25 * (1 + userVoiceIntensity * 0.3)}px` : `${size * 0.25}px`, // 80px at size=320
          height: activeState === "listening" ? `${size * 0.25 * (1 + userVoiceIntensity * 0.3)}px` : `${size * 0.25}px`,
          backgroundColor: primaryColor
        }}
        animate={{
          scale: activeState === "listening" ? [1, 1 + userVoiceIntensity * 0.2, 1] : 1,
          transition: { duration: 0.2 },
        }}
      />
    </div>
  )
} 