import React, { useState, useRef, useEffect } from 'react'
import { Mic } from 'lucide-react'

export default function VoiceInput({ onTranscript, disabled, shouldListen, onListeningChange }) {
  const [listening, setListening] = useState(false)
  const [interim, setInterim] = useState('')
  const recognitionRef = useRef(null)
  const isSupported = typeof window !== 'undefined' && (window.SpeechRecognition || window.webkitSpeechRecognition)
  const stop = () => { recognitionRef.current?.stop(); setListening(false); setInterim(''); onListeningChange?.(false) }
  const start = () => {
    if (!isSupported || disabled) return
    if (window.speechSynthesis) window.speechSynthesis.cancel()
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition
    const recognition = new SR()
    recognition.continuous = false; recognition.interimResults = true; recognition.lang = 'en-GB'
    recognition.onresult = (event) => {
      let final = ''; let interimText = ''
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript
        if (event.results[i].isFinal) final += transcript; else interimText += transcript
      }
      if (interimText) setInterim(interimText)
      if (final.trim()) { onTranscript(final.trim()); setInterim('') }
    }
    recognition.onend = () => { setListening(false); setInterim(''); onListeningChange?.(false) }
    recognition.onerror = recognition.onend
    recognitionRef.current = recognition
    recognition.start(); setListening(true); onListeningChange?.(true)
  }
  useEffect(() => { if (shouldListen && !listening && !disabled && isSupported) start() }, [shouldListen])
  if (!isSupported) return null
  return <div className="relative"><button onClick={listening ? stop : start} disabled={disabled && !listening} className={`w-11 h-11 rounded-full flex items-center justify-center transition-all duration-300 ${listening ? 'bg-red-500/20 border border-red-500/40' : 'bg-cyan-500/10 border border-cyan-500/20 hover:bg-cyan-500/20'} ${disabled && !listening ? 'opacity-40 cursor-not-allowed' : ''}`}><Mic size={18} className={listening ? 'text-red-400' : 'text-cyan-400'} /></button>{interim && <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 w-max max-w-[200px] px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs text-white/50">{interim}</div>}</div>
}
