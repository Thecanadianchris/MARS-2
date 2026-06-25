import React from 'react'
import { motion } from 'framer-motion'
const STATES = {
  idle: { label: 'STANDBY', color: '#22d3ee', scale: 0.35, opacity: 0.25, duration: 4, glow: 0.08 },
  listening: { label: 'LISTENING', color: '#22d3ee', scale: 0.6, opacity: 0.5, duration: 1, glow: 0.2 },
  thinking: { label: 'PROCESSING', color: '#a78bfa', scale: 0.3, opacity: 0.45, duration: 0.5, glow: 0.15 },
  speaking: { label: 'SPEAKING', color: '#22d3ee', scale: 0.55, opacity: 0.65, duration: 0.35, glow: 0.25 },
}
export default function EyesDisplay({ state = 'idle' }) {
  const config = STATES[state] || STATES.idle
  return <div className="flex flex-col items-center justify-center h-full w-full select-none"><div className="relative flex gap-8 sm:gap-12"><motion.div className="absolute inset-0 blur-3xl rounded-full" style={{ backgroundColor: config.color }} animate={{ opacity: [config.glow, config.glow * 1.5, config.glow] }} transition={{ duration: config.duration, repeat: Infinity, ease: 'easeInOut' }} />{[0, 1].map(i => <motion.div key={i} className="relative rounded-full" style={{ width: 64, height: 64, backgroundColor: config.color, boxShadow: `0 0 25px ${config.color}, 0 0 50px ${config.color}55, 0 0 80px ${config.color}22` }} animate={{ scale: [config.scale, config.scale * 1.12, config.scale], opacity: [config.opacity, config.opacity * 1.5, config.opacity], x: state === 'listening' ? [0, 3, -3, 0] : 0 }} transition={{ duration: config.duration, repeat: Infinity, ease: 'easeInOut', delay: i * 0.15 }} />)}</div><motion.span key={state} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} className="mt-10 text-[10px] font-mono tracking-[0.4em] text-white/20 uppercase">{config.label}</motion.span></div>
}
