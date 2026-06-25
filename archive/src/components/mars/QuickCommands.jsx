import React from 'react'
import { Navigation, Camera, Home, Activity, ScanSearch, VolumeX } from 'lucide-react'
import { QUICK_COMMANDS } from '@/components/mars/marsConfig'
const ICONS = { Patrol: Navigation, Photo: Camera, Return: Home, Status: Activity, 'Look Around': ScanSearch, 'Quiet Mode': VolumeX }
export default function QuickCommands({ onCommand, disabled }) {
  return <div className="flex gap-2 overflow-x-auto pb-2 px-4" style={{ scrollbarWidth: 'none' }}>{QUICK_COMMANDS.map(cmd => { const Icon = ICONS[cmd.label] || Navigation; return <button key={cmd.label} onClick={() => onCommand(cmd.prompt)} disabled={disabled} className="flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-white/[0.03] border border-white/5 hover:border-cyan-500/20 hover:bg-cyan-500/[0.04] transition-colors shrink-0 disabled:opacity-40"><Icon size={13} className="text-cyan-400/70" /><span className="text-xs font-medium text-white/60 whitespace-nowrap">{cmd.label}</span></button> })}</div>
}
