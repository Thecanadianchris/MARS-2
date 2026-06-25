import React from 'react'
import { Bot, User } from 'lucide-react'
export default function MessageBubble({ message }) {
  const isUser = message.role === 'user'
  return <div className={`flex gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${isUser ? 'bg-white/5' : 'bg-gradient-to-br from-cyan-400 to-blue-600'}`}>{isUser ? <User size={15} className="text-white/50" /> : <Bot size={15} className="text-white" />}</div>
    <div className={`max-w-[78%] ${isUser ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
      <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${isUser ? 'bg-white/[0.06] text-white/90 rounded-tr-sm' : 'bg-cyan-500/[0.08] border border-cyan-500/10 text-white/90 rounded-tl-sm'}`}>{message.content}</div>
      {!isUser && message.model_used && <span className="text-[10px] font-mono text-cyan-500/40 px-1">via {message.model_used}</span>}
    </div>
  </div>
}
