"use client"

import { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"

// ─── Premium Dark Skeleton (matches landing page exactly) ─────────────────────
function PremiumSkeleton({ onComplete }) {
  return (
    <motion.div
      key="premium-skeleton"
      initial={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.4, ease: "easeOut" } }}
      className="fixed inset-0 z-50"
      style={{ background: "var(--midnight-navy)" }}
    >
      {/* Top pinned progress bar - fixed at very top */}
      <div className="fixed top-0 left-0 w-full h-0.5 z-[9999] overflow-hidden" style={{ background: "rgba(232,130,106,0.15)" }}>
        <motion.div
          className="h-full"
          style={{ background: "var(--signal-gold)" }}
          animate={{ width: ["0%", "35%", "75%", "100%"] }}
          transition={{ duration: 2.2, ease: "easeInOut" }}
        />
      </div>

      {/* Hero placeholder - exact match to landing page hero */}
      <div className="flex flex-col items-center justify-center min-h-screen px-6 sm:px-8 md:px-12 pt-20">
        <div className="w-full max-w-[900px] text-center space-y-6 sm:space-y-8">
          {/* Eyebrow placeholder */}
          <div 
            className="h-3 sm:h-4 w-40 sm:w-48 mx-auto rounded-sm animate-pulse"
            style={{ background: "rgba(232,130,106,0.25)" }}
          />

          {/* Main title placeholder lines */}
          <div className="space-y-3 sm:space-y-4 max-w-[680px] mx-auto">
            <div 
              className="h-9 sm:h-12 md:h-14 w-full max-w-[620px] mx-auto rounded-sm animate-pulse"
              style={{ background: "rgba(148,163,184,0.12)" }}
            />
            <div 
              className="h-9 sm:h-12 md:h-14 w-4/5 max-w-[520px] mx-auto rounded-sm animate-pulse"
              style={{ background: "rgba(148,163,184,0.10)" }}
            />
          </div>

          {/* Subtitle placeholder */}
          <div className="space-y-2.5 pt-2 max-w-[620px] mx-auto">
            <div 
              className="h-4 sm:h-5 w-full rounded-sm animate-pulse"
              style={{ background: "rgba(148,163,184,0.08)" }}
            />
            <div 
              className="h-4 sm:h-5 w-5/6 mx-auto rounded-sm animate-pulse"
              style={{ background: "rgba(148,163,184,0.07)" }}
            />
          </div>

          {/* CTA button placeholder */}
          <div className="pt-6 sm:pt-8 flex justify-center">
            <div 
              className="h-12 sm:h-14 w-48 sm:w-56 rounded-sm animate-pulse"
              style={{ background: "rgba(232,130,106,0.35)" }}
            />
          </div>
        </div>
      </div>
    </motion.div>
  )
}

// ─── Main Preloader Export ───────────────────────────────────────────────────
export default function Preloader({ onComplete, t }) {
  const [mode, setMode] = useState(null)

  useEffect(() => {
    const hasVisited = localStorage.getItem("nexallure_visited")
    if (!hasVisited) {
      // First time: show premium skeleton with top progress bar
      const timer = setTimeout(() => {
        localStorage.setItem("nexallure_visited", "true")
        setMode("done")
        onComplete?.()
      }, 2400)
      return () => clearTimeout(timer)
    } else {
      // Returning: quick clean exit
      const timer = setTimeout(() => {
        setMode("done")
        onComplete?.()
      }, 420)
      return () => clearTimeout(timer)
    }
  }, [onComplete])

  if (mode === "done" || mode === null) return null

  return (
    <AnimatePresence mode="wait">
      <PremiumSkeleton key="premium-preloader" onComplete={onComplete} />
    </AnimatePresence>
  )
}
