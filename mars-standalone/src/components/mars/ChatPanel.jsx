import React, { useEffect, useRef, useState } from 'react'
import { Send, Trash2 } from 'lucide-react'
import EyesDisplay from '@/components/mars/EyesDisplay'
import MessageBubble from '@/components/mars/MessageBubble'
import QuickCommands from '@/components/mars/QuickCommands'
import VoiceInput from '@/components/mars/VoiceInput'
import { createLocalMarsReply } from '@/components/mars/marsConfig'
import { clearMemory, recall, recallAll, remember } from '@/components/mars/memory'

const STORAGE_KEY = 'mars_messages_v1'

function formatMemoryList(memory) {
  const entries = Object.entries(memory)

  if (entries.length === 0) {
    return 'I do not have anything stored in memory yet, Christian.'
  }

  const list = entries
    .map(([key, value]) => `${key}: ${value}`)
    .join('\n')

  return `Here is what I remember, Christian.\n\n${list}`
}

function extractMemory(content) {
  const cleaned = content.trim()

  const patterns = [
    /^remember my (.+?) is (.+)$/i,
    /^remember that my (.+?) is (.+)$/i,
    /^remember (.+?) is (.+)$/i,
    /^my (.+?) is (.+)$/i
  ]

  for (const pattern of patterns) {
    const match = cleaned.match(pattern)

    if (match) {
      return {
        key: match[1].trim().toLowerCase(),
        value: match[2].trim()
      }
    }
  }

  return null
}

function extractRecallKey(content) {
  const cleaned = content.trim()

  const patterns = [
    /^what is my (.+)\??$/i,
    /^what's my (.+)\??$/i,
    /^do you remember my (.+)\??$/i,
    /^tell me my (.+)\??$/i
  ]

  for (const pattern of patterns) {
    const match = cleaned.match(pattern)

    if (match) {
      return match[1].trim().toLowerCase().replace(/\?$/, '')
    }
  }

  return null
}

function createMemoryAwareReply(content) {
  const lower = content.toLowerCase()

  if (
    lower.includes('clear memory') ||
    lower.includes('forget everything') ||
    lower.includes('delete memory')
  ) {
    clearMemory()
    return 'Memory cleared, Christian.'
  }

  if (
    lower.includes('what do you remember') ||
    lower.includes('show memory') ||
    lower.includes('list memory')
  ) {
    return formatMemoryList(recallAll())
  }

  const memoryToStore = extractMemory(content)

  if (memoryToStore) {
    remember(memoryToStore.key, memoryToStore.value)
    return `Understood, Christian. I will remember that your ${memoryToStore.key} is ${memoryToStore.value}.`
  }

  const recallKey = extractRecallKey(content)

  if (recallKey) {
    const value = recall(recallKey)

    if (value) {
      return `Your ${recallKey} is ${value}, Christian.`
    }

    return `I do not have your ${recallKey} stored yet, Christian.`
  }

  return createLocalMarsReply(content)
}

export default function ChatPanel({ mode, pendingMessage, onConsumePending }) {
  const [messages, setMessages] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY)) || []
    } catch {
      return []
    }
  })

  const [input, setInput] = useState('')
  const [state, setState] = useState('idle')
  const [busy, setBusy] = useState(false)
  const [shouldListen, setShouldListen] = useState(false)

  const endRef = useRef(null)

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(messages))
  }, [messages])

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    if (pendingMessage?.prompt) {
      sendMessage(pendingMessage.prompt)
      onConsumePending?.()
    }
  }, [pendingMessage?.ts])

  const speak = (text) => {
    if (!('speechSynthesis' in window)) {
      setState('idle')
      return
    }

    setState('speaking')

    const utter = new SpeechSynthesisUtterance(text)
    utter.lang = 'en-GB'
    utter.rate = 0.95
    utter.pitch = 0.9

    utter.onend = () => {
      setState('idle')

      setTimeout(() => {
        setShouldListen(true)
      }, 500)
    }

    utter.onerror = () => {
      setState('idle')
    }

    window.speechSynthesis.cancel()
    window.speechSynthesis.speak(utter)
  }

  const sendMessage = async (text = input) => {
    const content = text.trim()

    if (!content || busy) return

    setShouldListen(false)
    setInput('')
    setBusy(true)
    setState('thinking')

    const userMsg = {
      id: Date.now(),
      role: 'user',
      content
    }

    setMessages((prev) => [...prev, userMsg])

    await new Promise((resolve) => setTimeout(resolve, 350))

    const reply = createMemoryAwareReply(content)

    const marsMsg = {
      id: Date.now() + 1,
      role: 'assistant',
      content: reply,
      model_used: mode
    }

    setMessages((prev) => [...prev, marsMsg])

    setBusy(false)
    speak(reply)
  }

  const clearMessages = () => {
    setMessages([])
    localStorage.removeItem(STORAGE_KEY)
    setState('idle')
    setShouldListen(false)
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="h-56 border-b border-white/5">
        <EyesDisplay state={state} />
      </div>

      <QuickCommands onCommand={sendMessage} disabled={busy} />

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-center text-white/30 text-sm mt-8">
            MARS is online. Memory systems are active. Say hello or ask me to remember something.
          </div>
        )}

        {messages.map((message) => (
          <MessageBubble key={message.id} message={message} />
        ))}

        <div ref={endRef} />
      </div>

      <div className="border-t border-white/5 p-3 flex items-center gap-2">
        <VoiceInput
          onTranscript={(text) => {
            setShouldListen(false)
            sendMessage(text)
          }}
          disabled={busy}
          shouldListen={shouldListen}
          onAutoListenConsumed={() => setShouldListen(false)}
          onListeningChange={(isListening) => {
            if (isListening) {
              setState('listening')
            } else if (!busy && state !== 'speaking') {
              setState('idle')
            }
          }}
        />

        <input
          value={input}
          onChange={(event) => setInput(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') sendMessage()
          }}
          placeholder="Message MARS..."
          className="flex-1 bg-white/[0.04] border border-white/5 rounded-full px-4 py-3 text-sm outline-none focus:border-cyan-500/25"
        />

        <button
          onClick={() => sendMessage()}
          disabled={busy || !input.trim()}
          className="w-11 h-11 rounded-full bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center disabled:opacity-40"
        >
          <Send size={17} className="text-cyan-400" />
        </button>

        <button
          onClick={clearMessages}
          className="w-10 h-10 rounded-full bg-white/[0.03] flex items-center justify-center"
        >
          <Trash2 size={15} className="text-white/30" />
        </button>
      </div>
    </div>
  )
}