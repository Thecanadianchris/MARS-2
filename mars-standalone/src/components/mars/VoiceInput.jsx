import React, { useState, useRef, useEffect } from 'react'
import { Mic, MicOff } from 'lucide-react'

export default function VoiceInput({
  onTranscript,
  disabled,
  shouldListen,
  onListeningChange,
  onAutoListenConsumed
}) {
  const [listening, setListening] = useState(false)
  const [interim, setInterim] = useState('')
  const [error, setError] = useState('')

  const recognitionRef = useRef(null)
  const listeningRef = useRef(false)

  const SpeechRecognition =
    typeof window !== 'undefined'
      ? window.SpeechRecognition || window.webkitSpeechRecognition
      : null

  const isSupported = Boolean(SpeechRecognition)

  const setListeningState = (value) => {
    listeningRef.current = value
    setListening(value)
    onListeningChange?.(value)
  }

  const stop = () => {
    try {
      recognitionRef.current?.stop()
    } catch {
      // Ignore stop errors
    }

    setListeningState(false)
    setInterim('')
  }

  const start = () => {
    setError('')

    if (!isSupported) {
      setError('Speech recognition is not supported in this browser. Use Chrome or Edge.')
      onAutoListenConsumed?.()
      return
    }

    if (disabled || listeningRef.current) {
      onAutoListenConsumed?.()
      return
    }

    try {
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel()
      }

      const recognition = new SpeechRecognition()

      recognition.continuous = false
      recognition.interimResults = true
      recognition.lang = 'en-GB'

      recognition.onstart = () => {
        setListeningState(true)
      }

      recognition.onresult = (event) => {
        let finalText = ''
        let interimText = ''

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript

          if (event.results[i].isFinal) {
            finalText += transcript
          } else {
            interimText += transcript
          }
        }

        setInterim(interimText)

        if (finalText.trim()) {
          setInterim('')
          onTranscript(finalText.trim())
        }
      }

      recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error)

        if (event.error === 'not-allowed') {
          setError('Microphone permission was blocked. Allow microphone access in the browser.')
        } else if (event.error === 'no-speech') {
          setError('No speech detected. Try again.')
        } else if (event.error === 'audio-capture') {
          setError('No microphone was found. Check Windows sound input settings.')
        } else {
          setError(`Microphone error: ${event.error}`)
        }

        setListeningState(false)
        setInterim('')
      }

      recognition.onend = () => {
        setListeningState(false)
        setInterim('')
      }

      recognitionRef.current = recognition
      recognition.start()
    } catch (err) {
      console.error('Could not start speech recognition:', err)

      setError('Could not start microphone. Check browser permissions.')
      setListeningState(false)
      setInterim('')
    } finally {
      onAutoListenConsumed?.()
    }
  }

  useEffect(() => {
    if (shouldListen) {
      start()
    }
  }, [shouldListen])

  useEffect(() => {
    return () => {
      try {
        recognitionRef.current?.stop()
      } catch {
        // Ignore cleanup errors
      }
    }
  }, [])

  return (
    <div className="relative">
      <button
        onClick={listening ? stop : start}
        disabled={disabled && !listening}
        title={!isSupported ? 'Speech recognition not supported' : 'Voice input'}
        className={`w-11 h-11 rounded-full flex items-center justify-center transition-all duration-300 ${
          listening
            ? 'bg-red-500/20 border border-red-500/40'
            : 'bg-cyan-500/10 border border-cyan-500/20 hover:bg-cyan-500/20'
        } ${disabled && !listening ? 'opacity-40 cursor-not-allowed' : ''}`}
      >
        {isSupported ? (
          <Mic size={18} className={listening ? 'text-red-400' : 'text-cyan-400'} />
        ) : (
          <MicOff size={18} className="text-red-400" />
        )}
      </button>

      {interim && (
        <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 w-max max-w-[200px] px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs text-white/50">
          {interim}
        </div>
      )}

      {error && (
        <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 w-64 px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/30 text-xs text-red-300">
          {error}
        </div>
      )}
    </div>
  )
}