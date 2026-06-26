import React from 'react'

export default function MemoryPanel({ memory = {}, onClear }) {
  const entries = Object.entries(memory)

  return (
    <div className="flex-1 overflow-y-auto p-6">

      <h2 className="text-2xl font-bold text-cyan-400 mb-6">
        MARS Memory
      </h2>

      {entries.length === 0 ? (
        <div className="text-white/40">
          No memories stored yet.
        </div>
      ) : (
        <div className="space-y-3">

          {entries.map(([key, value]) => (

            <div
              key={key}
              className="rounded-xl border border-cyan-500/20 bg-cyan-500/5 p-4"
            >

              <div className="text-cyan-300 font-semibold">
                {key}
              </div>

              <div className="text-white mt-1">
                {String(value)}
              </div>

            </div>

          ))}

        </div>
      )}

      <button
        onClick={onClear}
        className="mt-8 px-5 py-3 rounded-xl bg-red-500/20 border border-red-500/30 hover:bg-red-500/30"
      >
        Clear Memory
      </button>

    </div>
  )
}