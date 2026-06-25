import React, { useEffect, useRef, useState } from 'react'
import { Send, Trash2 } from 'lucide-react'
import EyesDisplay from '@/components/mars/EyesDisplay'
import MessageBubble from '@/components/mars/MessageBubble'
import QuickCommands from '@/components/mars/QuickCommands'
import VoiceInput from '@/components/mars/VoiceInput'
import { createLocalMarsReply } from '@/components/mars/marsConfig'

const STORAGE_KEY = 'mars_messages_v1'

export default function ChatPanel({ mode, pendingMessage, onConsumePending }) {
  const [messages, setMessages] = useState(() => {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [] } catch { return [] }
  })
  const [input, setInput] = useState('')
  const [state, setState] = useState('idle')
  const [busy, setBusy] = useState(false)
  const endRef = useRef(null)
  useEffect(() => { localStorage.setItem(STORAGE_KEY, JSON.stringify(messages)) }, [messages])
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])
  useEffect(() => { if (pendingMessage?.prompt) { sendMessage(pendingMessage.prompt); onConsumePending?.() } }, [pendingMessage?.ts])

  const speak = (text) => {
    if (!('speechSynthesis' in window)) return
    setState('speaking')
    const utter = new SpeechSynthesisUtterance(text)
    utter.lang = 'en-GB'; utter.rate = 0.95
    utter.onend = () => setState('idle')
    window.speechSynthesis.cancel(); window.speechSynthesis.speak(utter)
  }

  const sendMessage = async (text = input) => {
    const content = text.trim(); if (!content || busy) return
    setInput(''); setBusy(true); setState('thinking')
    const userMsg = { id: Date.now(), role: 'user', content }
    setMessages(prev => [...prev, userMsg])
    await new Promise(r => setTimeout(r, 350))
    const reply = createLocalMarsReply(content)
    const marsMsg = { id: Date.now() + 1, role: 'assistant', content: reply, model_used: mode }
    setMessages(prev => [...prev, marsMsg])
    setBusy(false); speak(reply)
  }

  return <div className="flex-1 flex flex-col overflow-hidden"><div className="h-56 border-b border-white/5"><EyesDisplay state={state} /></div><QuickCommands onCommand={sendMessage} disabled={busy} /><div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">{messages.length === 0 && <div className="text-center text-white/30 text-sm mt-8">MARS is online. Base44 has been removed. Say hello or use a quick command.</div>}{messages.map(m => <MessageBubble key={m.id} message={m} />)}<div ref={endRef} /></div><div className="border-t border-white/5 p-3 flex items-center gap-2"><VoiceInput onTranscript={sendMessage} disabled={busy} onListeningChange={v => setState(v ? 'listening' : 'idle')} /><input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') sendMessage() }} placeholder="Message MARS..." className="flex-1 bg-white/[0.04] border border-white/5 rounded-full px-4 py-3 text-sm outline-none focus:border-cyan-500/25" /><button onClick={() => sendMessage()} disabled={busy || !input.trim()} className="w-11 h-11 rounded-full bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center disabled:opacity-40"><Send size={17} className="text-cyan-400" /></button><button onClick={() => setMessages([])} className="w-10 h-10 rounded-full bg-white/[0.03] flex items-center justify-center"><Trash2 size={15} className="text-white/30" /></button></div></div>
}
