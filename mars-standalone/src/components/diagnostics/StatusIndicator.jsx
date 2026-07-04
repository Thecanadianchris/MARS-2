/**
 * ==========================================================
 * MARS SOFTWARE PROJECT
 * ----------------------------------------------------------
 * Component:
 * StatusIndicator
 *
 * Purpose:
 * Shared diagnostics status pill for MARS capability panels.
 *
 * Version:
 * v0.13.4
 *
 * Date Code:
 * 040726
 * ==========================================================
 */

import { DIAGNOSTIC_STATUS } from '@/services/diagnostics'

const STATUS_STYLES = {
  [DIAGNOSTIC_STATUS.ONLINE]: 'bg-cyan-500/10 text-cyan-300 border-cyan-500/20',
  [DIAGNOSTIC_STATUS.READY]: 'bg-green-500/10 text-green-300 border-green-500/20',
  [DIAGNOSTIC_STATUS.DEGRADED]: 'bg-amber-500/10 text-amber-300 border-amber-500/20',
  [DIAGNOSTIC_STATUS.WAITING]: 'bg-slate-500/10 text-slate-300 border-slate-500/20',
  [DIAGNOSTIC_STATUS.OFFLINE]: 'bg-slate-700/40 text-slate-400 border-slate-600/30',
  [DIAGNOSTIC_STATUS.ERROR]: 'bg-red-500/10 text-red-300 border-red-500/20',
  [DIAGNOSTIC_STATUS.UNKNOWN]: 'bg-white/5 text-white/40 border-white/10',
}

export default function StatusIndicator({ status = DIAGNOSTIC_STATUS.UNKNOWN, label = null }) {
  const safeStatus = status || DIAGNOSTIC_STATUS.UNKNOWN

  return (
    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-widest ${STATUS_STYLES[safeStatus] || STATUS_STYLES.unknown}`}>
      {label || safeStatus}
    </span>
  )
}
