'use client'

import { ReactNode, useState } from 'react'
import { motion } from 'framer-motion'

interface HoloCardProps {
  children: ReactNode
  className?: string
}

export function HoloCard({ children, className = '' }: HoloCardProps) {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    setMousePosition({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    })
  }

  return (
    <motion.div
      className={`holo-card ${className}`}
      onMouseMove={handleMouseMove}
      style={{
        transform: `perspective(1000px) rotateY(${(mousePosition.x / 10)}deg) rotateX(${-(mousePosition.y / 10)}deg)`,
      }}
      whileHover={{ scale: 1.02 }}
    >
      {children}
    </motion.div>
  )
}
