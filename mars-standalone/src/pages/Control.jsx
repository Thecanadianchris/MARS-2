import React, { useState } from 'react'
import { MessageSquare, MessageCircle, Gauge, Battery, Bluetooth, Link2, Brain, Eye, Activity, UserRound, PersonStanding, BrainCircuit, BellRing, Mic, Database } from 'lucide-react'
import { Link } from 'react-router-dom'
import ModelSelector from '@/components/mars/ModelSelector'
import ChatPanel from '@/components/mars/ChatPanel'
import DashboardPanel from '@/components/mars/DashboardPanel'
import NotesPanel from '@/components/mars/NotesPanel'
import VisionPanel from '@/components/mars/VisionPanel'
import AIStatusPanel from '@/components/system/AIStatusPanel'
import VisionStatusPanel from '@/components/system/VisionStatusPanel'
import CameraPreviewPanel from '@/components/system/CameraPreviewPanel'
import DiagnosticsPanel from '@/components/diagnostics/DiagnosticsPanel'
import IdentityPanel from '@/components/identity/IdentityPanel'
import BehaviourPanel from '@/components/behaviour/BehaviourPanel'
import DecisionPanel from '@/components/decision/DecisionPanel'
import NotificationPanel from '@/components/notifications/NotificationPanel'
import VoicePanel from '@/components/voice/VoicePanel'
import ConversationPanel from '@/components/conversation/ConversationPanel'
import { MemoryIntelligencePanel } from '@/components/memory'
import { clearMemory, recallAll } from '@/components/mars/memory'

export default function Control() {
  const [tab, setTab] = useState('chat')
  const [mode, setMode] = useState('auto')
  const [pendingMessage, setPendingMessage] = useState(null)
  const [memoryVersion, setMemoryVersion] = useState(0)

  const handleQuickAction = (prompt) => {
    setTab('chat')
    setPendingMessage({ prompt, ts: Date.now() })
  }

  const handleClearMemory = () => {
    clearMemory()
    setMemoryVersion((value) => value + 1)
  }

  const memory = recallAll()

  return (
    <div className="min-h-screen bg-[#0a0e17] text-white flex flex-col max-w-lg mx-auto relative">
      <header className="flex items-center justify-between px-4 h-14 border-b border-white/5 bg-[#0a0e17]/90 backdrop-blur-xl sticky top-0 z-40">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center text-[10px] font-black">
            M
          </div>

          <div className="leading-none">
            <span className="font-heading font-bold text-sm tracking-[0.15em] text-white/90">
              MARS
            </span>
            <span className="text-[9px] font-mono text-cyan-500/60 ml-1">
              Mk1
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <ModelSelector mode={mode} onChange={setMode} />

          <div className="flex items-center gap-1 px-2 py-1.5 rounded-lg bg-white/[0.04] border border-white/5">
            <Bluetooth size={11} className="text-cyan-400" />
            <Battery size={13} className="text-green-400/80 ml-1" />
            <span className="text-[10px] font-mono text-white/40">87</span>
          </div>

          <Link
            to="/showcase"
            className="w-8 h-8 flex items-center justify-center text-white/30 hover:text-cyan-400"
          >
            <Link2 size={14} />
          </Link>
        </div>
      </header>

      <main className="flex-1 flex flex-col overflow-hidden pb-16">
        {tab === 'chat' && (
          <ChatPanel
            mode={mode}
            pendingMessage={pendingMessage}
            onConsumePending={() => setPendingMessage(null)}
          />
        )}

        {tab === 'dashboard' && (
          <div className="flex flex-col gap-4 p-4 overflow-y-auto">
            <AIStatusPanel />
            <VisionStatusPanel />
            <CameraPreviewPanel />
            <DashboardPanel onAction={handleQuickAction} />
          </div>
        )}

        {tab === 'notes' && (
          <NotesPanel
            key={memoryVersion}
            memory={memory}
            onClear={handleClearMemory}
          />
        )}

        {/* v0.16.1: kept mounted (CSS-hidden, not unmounted) rather than
            `{tab === 'vision' && <VisionPanel />}` so the camera stream
            and ContinuousVisionMonitor keep running when the user
            navigates to another tab — MARS should always be watching,
            not just while the Vision tab happens to be open. */}
        <div className={tab === 'vision' ? 'contents' : 'hidden'}>
          <VisionPanel />
        </div>

        {tab === 'identity' && <IdentityPanel />}

        {tab === 'behaviour' && <BehaviourPanel />}

        {tab === 'decision' && <DecisionPanel />}

        {tab === 'notification' && <NotificationPanel />}

        {tab === 'voice' && <VoicePanel />}

        {tab === 'conversation' && <ConversationPanel />}

        {tab === 'memory-i' && <MemoryIntelligencePanel />}

        {tab === 'diagnostics' && <DiagnosticsPanel />}
      </main>

      <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-lg border-t border-white/5 bg-[#0a0e17]/95 backdrop-blur-xl z-40">
        <div className="flex">
          <button
            onClick={() => setTab('chat')}
            className={`flex-1 flex flex-col items-center gap-1 py-3 ${
              tab === 'chat'
                ? 'text-cyan-400'
                : 'text-white/30 hover:text-white/50'
            }`}
          >
            <MessageSquare size={17} />
            <span className="text-[9px] font-mono tracking-wider">CHAT</span>
          </button>

          <button
            onClick={() => setTab('dashboard')}
            className={`flex-1 flex flex-col items-center gap-1 py-3 ${
              tab === 'dashboard'
                ? 'text-cyan-400'
                : 'text-white/30 hover:text-white/50'
            }`}
          >
            <Gauge size={17} />
            <span className="text-[9px] font-mono tracking-wider">CTRL</span>
          </button>

          <button
            onClick={() => setTab('vision')}
            className={`flex-1 flex flex-col items-center gap-1 py-3 ${
              tab === 'vision'
                ? 'text-cyan-400'
                : 'text-white/30 hover:text-white/50'
            }`}
          >
            <Eye size={17} />
            <span className="text-[9px] font-mono tracking-wider">VISION</span>
          </button>

          <button
            onClick={() => setTab('identity')}
            className={`flex-1 flex flex-col items-center gap-1 py-3 ${
              tab === 'identity'
                ? 'text-cyan-400'
                : 'text-white/30 hover:text-white/50'
            }`}
          >
            <UserRound size={17} />
            <span className="text-[9px] font-mono tracking-wider">ID</span>
          </button>

          <button
            onClick={() => setTab('behaviour')}
            className={`flex-1 flex flex-col items-center gap-1 py-3 ${
              tab === 'behaviour'
                ? 'text-cyan-400'
                : 'text-white/30 hover:text-white/50'
            }`}
          >
            <PersonStanding size={17} />
            <span className="text-[9px] font-mono tracking-wider">BEHAV</span>
          </button>

          <button
            onClick={() => setTab('decision')}
            className={`flex-1 flex flex-col items-center gap-1 py-3 ${
              tab === 'decision'
                ? 'text-cyan-400'
                : 'text-white/30 hover:text-white/50'
            }`}
          >
            <BrainCircuit size={17} />
            <span className="text-[9px] font-mono tracking-wider">DEC</span>
          </button>

          <button
            onClick={() => setTab('notification')}
            className={`flex-1 flex flex-col items-center gap-1 py-3 ${
              tab === 'notification'
                ? 'text-cyan-400'
                : 'text-white/30 hover:text-white/50'
            }`}
          >
            <BellRing size={17} />
            <span className="text-[9px] font-mono tracking-wider">NOTIF</span>
          </button>


          <button
            onClick={() => setTab('voice')}
            className={`flex-1 flex flex-col items-center gap-1 py-3 ${
              tab === 'voice'
                ? 'text-cyan-400'
                : 'text-white/30 hover:text-white/50'
            }`}
          >
            <Mic size={17} />
            <span className="text-[9px] font-mono tracking-wider">VOICE</span>
          </button>

          <button
            onClick={() => setTab('conversation')}
            className={`flex-1 flex flex-col items-center gap-1 py-3 ${
              tab === 'conversation'
                ? 'text-cyan-400'
                : 'text-white/30 hover:text-white/50'
            }`}
          >
            <MessageCircle size={17} />
            <span className="text-[9px] font-mono tracking-wider">CONV</span>
          </button>

          <button
            onClick={() => setTab('memory-i')}
            className={`flex-1 flex flex-col items-center gap-1 py-3 ${
              tab === 'memory-i'
                ? 'text-cyan-400'
                : 'text-white/30 hover:text-white/50'
            }`}
          >
            <Database size={17} />
            <span className="text-[9px] font-mono tracking-wider">MEM-I</span>
          </button>

          <button
            onClick={() => setTab('diagnostics')}
            className={`flex-1 flex flex-col items-center gap-1 py-3 ${
              tab === 'diagnostics'
                ? 'text-cyan-400'
                : 'text-white/30 hover:text-white/50'
            }`}
          >
            <Activity size={17} />
            <span className="text-[9px] font-mono tracking-wider">DIAG</span>
          </button>

          <button
            onClick={() => setTab('notes')}
            className={`flex-1 flex flex-col items-center gap-1 py-3 ${
              tab === 'notes'
                ? 'text-cyan-400'
                : 'text-white/30 hover:text-white/50'
            }`}
          >
            <Brain size={17} />
            <span className="text-[9px] font-mono tracking-wider">NOTES</span>
          </button>
        </div>
      </nav>
    </div>
  )
}
