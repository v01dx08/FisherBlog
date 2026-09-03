"use client"
import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"

export function RippleWrapper({ children, className }) {
  const [ripples, setRipples] = React.useState([])

  const addRipple = (e) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    const size = Math.max(rect.width, rect.height)
    
    const newRipple = {
      x,
      y,
      size,
      id: Date.now(),
    }
    setRipples((prev) => [...prev, newRipple])
  }

  const removeRipple = (id) => {
    setRipples((prev) => prev.filter((r) => r.id !== id))
  }

  return (
    <div
      className={`relative overflow-hidden ${className || ""}`}
      onClick={addRipple}
    >
      {children}
      <AnimatePresence>
        {ripples.map((ripple) => (
          <motion.span
            key={ripple.id}
            initial={{ scale: 0, opacity: 0.5 }}
            animate={{ scale: 2.5, opacity: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            onAnimationComplete={() => removeRipple(ripple.id)}
            style={{
              position: "absolute",
              left: ripple.x - ripple.size / 2,
              top: ripple.y - ripple.size / 2,
              width: ripple.size,
              height: ripple.size,
              backgroundColor: "rgba(14, 165, 233, 0.4)", // Ocean blue ripple
              borderRadius: "50%",
              pointerEvents: "none",
            }}
          />
        ))}
      </AnimatePresence>
    </div>
  )
}
