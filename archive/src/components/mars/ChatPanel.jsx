import React, { useState, useEffect, useRef, useCallback } from "react";
import { Send, Loader2, VolumeX, Trash2, MessageSquare, X, Radio } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { selectModel, buildPrompt } from "@/components/mars/marsConfig";
import MessageBubble from "@/components/mars/MessageBubble";
import VoiceInput from "@/components/mars/VoiceInput";
import QuickCommands from "@/components/mars/QuickCommands";
import EyesDisplay from "@/components/mars/EyesDisplay";

export default function ChatPanel({ mode, pendingMessage, onConsumePending, onStateChange }) {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [input, setInput] = useState("");
  const [speaking, setSpeaking] = useState(false);
  const [listening, setListening] = useState(false);
  const [voices, setVoices] = useState([]);
  const [autoListen, setAutoListen] = useState(false);
  const [shouldListen, setShouldListen] = useState(false);
  const [error, setError] = useState(null);
  const [showLog, setShowLog] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    loadMessages();
  }, []);

  useEffect(() => {
    const loadVoices = () => setVoices(window.speechSynthesis?.getVoices() || []);
    loadVoices();
    if (window.speechSynthesis) {
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }
    return () => {
      if (window.speechSynthesis) window.speechSynthesis.onvoiceschanged = null;
    };
  }, []);

  useEffect(() => {
    if (showLog) scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading, showLog]);

  const loadMessages = async () => {
    try {
      const data = await base44.entities.MarsMessage.list('-created_date', 50);
      setMessages(data.reverse());
    } catch (e) {
      // First run — no messages yet
    }
  };

  const speak = useCallback((text) => {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    const tarsVoice = voices.find(v => /Google UK English Male|Daniel|Arthur|Google US English/i.test(v.name));
    if (tarsVoice) utterance.voice = tarsVoice;
    utterance.rate = 0.92;
    utterance.pitch = 0.7;
    utterance.onstart = () => setSpeaking(true);
    utterance.onend = () => {
      setSpeaking(false);
      if (autoListen) {
        setShouldListen(true);
        setTimeout(() => setShouldListen(false), 100);
      }
    };
    utterance.onerror = () => setSpeaking(false);
    window.speechSynthesis.speak(utterance);
  }, [autoListen, voices]);

  const stopSpeaking = () => {
    if (window.speechSynthesis) window.speechSynthesis.cancel();
    setSpeaking(false);
  };

  const sendMessage = useCallback(async (text) => {
    if (!text?.trim() || loading) return;

    stopSpeaking();
    setError(null);
    const userMsg = { role: 'user', content: text.trim() };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      await base44.entities.MarsMessage.create(userMsg);

      const { model, useWeb, label } = selectModel(text, mode);
      const prompt = buildPrompt(messages, text);

      const result = await base44.integrations.Core.InvokeLLM({
        prompt,
        model,
        add_context_from_internet: useWeb,
      });

      const response = typeof result === 'string'
        ? result
        : (result?.response || result?.text || result?.output || JSON.stringify(result));

      const assistantMsg = { role: 'assistant', content: response, model_used: label };
      setMessages(prev => [...prev, assistantMsg]);

      try {
        await base44.entities.MarsMessage.create(assistantMsg);
      } catch {
        // DB save failed — still show the message
      }

      speak(response);
    } catch (e) {
      setError("Connection issue — I couldn't process that. Try again.");
    } finally {
      setLoading(false);
    }
  }, [loading, messages, mode, speak]);

  // Handle pending messages from dashboard quick actions
  useEffect(() => {
    if (pendingMessage?.prompt) {
      sendMessage(pendingMessage.prompt);
      onConsumePending?.();
    }
  }, [pendingMessage]);

  const handleVoiceTranscript = (text) => {
    sendMessage(text);
  };

  const handleListeningChange = (isListening) => {
    setListening(isListening);
    if (isListening) stopSpeaking();
  };

  useEffect(() => {
    const robotState = loading ? 'thinking' : speaking ? 'speaking' : listening ? 'listening' : 'idle';
    onStateChange?.(robotState);
  }, [loading, speaking, listening, onStateChange]);

  const clearHistory = async () => {
    stopSpeaking();
    try {
      await base44.entities.MarsMessage.deleteMany({});
      setMessages([]);
    } catch {
      // ignore
    }
  };

  return (
    <div className="flex flex-col h-full relative">
      {/* Eyes — main view (always visible behind log) */}
      <div className={`flex-1 flex items-center justify-center transition-all duration-300 ${showLog ? 'h-32 shrink-0' : ''}`}>
        <div className={showLog ? 'scale-50 opacity-30' : 'scale-100'}>
          <EyesDisplay state={loading ? 'thinking' : speaking ? 'speaking' : listening ? 'listening' : 'idle'} />
        </div>
      </div>

      {/* Conversation log — toggleable overlay */}
      {showLog && (
        <div className="flex-1 flex flex-col overflow-hidden border-t border-white/5">
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
            {messages.length === 0 && !loading && (
              <div className="flex items-center justify-center h-full text-center">
                <p className="text-sm text-white/20">No messages yet. Start talking to MARS.</p>
              </div>
            )}
            {messages.map((msg, i) => (
              <MessageBubble key={msg.id || i} message={msg} />
            ))}
            {loading && (
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center shrink-0">
                  <div className="w-3 h-3 rounded-full bg-white/80 animate-pulse" />
                </div>
                <div className="px-4 py-3 rounded-2xl rounded-tl-sm bg-cyan-500/[0.08] border border-cyan-500/10">
                  <div className="flex gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-cyan-400/50 animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-1.5 h-1.5 rounded-full bg-cyan-400/50 animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-1.5 h-1.5 rounded-full bg-cyan-400/50 animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}
            {error && (
              <div className="flex justify-center">
                <span className="text-xs text-red-400/70 px-4 py-2 rounded-lg bg-red-500/5 border border-red-500/10">
                  {error}
                </span>
              </div>
            )}
            <div ref={scrollRef} />
          </div>
        </div>
      )}

      {/* Quick Commands */}
      <div className="border-t border-white/5">
        <QuickCommands onCommand={sendMessage} disabled={loading} />
      </div>

      {/* Input bar */}
      <div className="border-t border-white/5 p-4 space-y-3">
        {speaking && (
          <button
            onClick={stopSpeaking}
            className="w-full flex items-center justify-center gap-2 py-2 rounded-lg bg-red-500/10 border border-red-500/20 text-xs text-red-400 hover:bg-red-500/15 transition-colors"
          >
            <VolumeX size={13} />
            <span>Stop speaking</span>
          </button>
        )}

        <div className="flex items-center gap-2.5">
          <VoiceInput
            onTranscript={handleVoiceTranscript}
            disabled={loading}
            shouldListen={shouldListen}
            onListeningChange={handleListeningChange}
          />
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && sendMessage(input)}
            placeholder="Type or tap mic to speak..."
            disabled={loading}
            className="flex-1 px-4 py-2.5 rounded-full bg-white/[0.04] border border-white/5 text-sm text-white/90 placeholder:text-white/20 focus:outline-none focus:border-cyan-500/20 transition-colors"
          />
          <button
            onClick={() => sendMessage(input)}
            disabled={loading || !input.trim()}
            className="w-11 h-11 rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed hover:shadow-lg hover:shadow-cyan-500/20 transition-all"
          >
            {loading ? <Loader2 size={16} className="text-white animate-spin" /> : <Send size={16} className="text-white" />}
          </button>
        </div>

        <div className="flex items-center justify-between px-1">
          <button
            onClick={() => setAutoListen(!autoListen)}
            className={`flex items-center gap-1.5 text-[11px] font-mono transition-colors ${
              autoListen ? 'text-cyan-400' : 'text-white/25 hover:text-white/40'
            }`}
          >
            <Radio size={11} className={autoListen ? 'animate-pulse' : ''} />
            <span>Auto-listen {autoListen ? 'ON' : 'OFF'}</span>
          </button>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowLog(!showLog)}
              className={`flex items-center gap-1.5 text-[11px] font-mono transition-colors ${
                showLog ? 'text-cyan-400' : 'text-white/25 hover:text-white/40'
              }`}
            >
              {showLog ? <X size={11} /> : <MessageSquare size={11} />}
              <span>{showLog ? 'Hide Log' : 'Show Log'}</span>
            </button>
            {showLog && (
              <button
                onClick={clearHistory}
                className="flex items-center gap-1.5 text-[11px] font-mono text-white/25 hover:text-red-400/60 transition-colors"
              >
                <Trash2 size={11} />
                <span>Clear</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}