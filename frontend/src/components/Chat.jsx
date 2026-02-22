import { useState, useRef, useEffect } from 'react'
import ReactMarkdown from 'react-markdown'
import { Bot, User, Copy, Check, Terminal, Send, Trash2, Maximize2, Minimize2, AlertCircle, Play } from 'lucide-react'
import './Chat.css'

const API_URL = 'http://localhost:8000/api/chat/'

// ── Boot message ──────────────────────────────────────────────────────────────
const bootMessage = () => ({
  id: 1,
  role: 'assistant',
  text: "Hello! I'm **GangaBot**, your AI assistant for Ganga — CERN's job management framework.\n\nAsk me anything about Ganga or describe the job you want to run, and I'll generate the commands for you.",
  timestamp: new Date(),
})

export default function Chat() {
  const [messages,  setMessages]  = useState([bootMessage()])
  const [input,     setInput]     = useState('')
  const [loading,   setLoading]   = useState(false)
  const [error,     setError]     = useState(null)
  const [sessionId, setSessionId] = useState(() => localStorage.getItem('gangaflow_session_id'))
  const [maximised, setMaximised] = useState(false)

  const messagesEndRef = useRef(null)
  const textareaRef    = useRef(null)

  // Scroll to bottom on new message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Auto-grow textarea
  useEffect(() => {
    const ta = textareaRef.current
    if (!ta) return
    ta.style.height = 'auto'
    ta.style.height = Math.min(ta.scrollHeight, 160) + 'px'
  }, [input])

  // Load history from DB on mount if a session already exists
  useEffect(() => {
    if (!sessionId) return
    fetch(`http://localhost:8000/api/chat/${sessionId}/history/`)
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (!data || !data.messages.length) return
        const loaded = data.messages.map((m, i) => ({
          id: i + 10,
          role: m.role,
          text: m.content,
          timestamp: new Date(m.timestamp),
        }))
        setMessages([bootMessage(), ...loaded])
      })
      .catch(() => {})   // silently ignore if server not up yet
  }, [])   // eslint-disable-line react-hooks/exhaustive-deps

  // ── Send message to backend ──────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e?.preventDefault()
    const text = input.trim()
    if (!text || loading) return

    setError(null)

    // Optimistically add user message + pending bot bubble
    const userMsg = { id: Date.now(),     role: 'user',      text, timestamp: new Date() }
    const pending = { id: Date.now() + 1, role: 'assistant', text: '…', pending: true, timestamp: new Date() }
    setMessages(prev => [...prev, userMsg, pending])
    setInput('')
    setLoading(true)

    try {
      const res = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, session_id: sessionId }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || `Server error ${res.status}`)
      }

      // Persist session ID in localStorage for page refreshes
      if (data.session_id && data.session_id !== sessionId) {
        setSessionId(data.session_id)
        localStorage.setItem('gangaflow_session_id', data.session_id)
      }

      // Replace the pending bubble with the real reply
      setMessages(prev => prev.map(m =>
        m.pending ? { ...m, text: data.reply, pending: false } : m
      ))
      window.dispatchEvent(new CustomEvent('gangaflow:llm-status', { detail: { connected: true } }))
    } catch (err) {
      setError(err.message)
      // Remove the pending bubble on error
      setMessages(prev => prev.filter(m => !m.pending))
      window.dispatchEvent(new CustomEvent('gangaflow:llm-status', { detail: { connected: false } }))
    } finally {
      setLoading(false)
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  // Clear chat and start a brand-new session
  const handleClear = () => {
    setMessages([bootMessage()])
    setSessionId(null)
    setError(null)
    localStorage.removeItem('gangaflow_session_id')
  }

  return (
    <div className={`chat-pane ${maximised ? 'maximised' : ''}`}>
      {/* ── Pane header ── */}
      <div className="pane-header chat-header">
        <div className="pane-header-left">
          <div className="bot-avatar-small">
            <Bot size={13} strokeWidth={2} />
          </div>
          <span className="pane-header-title">GangaBot</span>
          <span className="chat-model-badge">GPT-OSS-120b</span>
          {sessionId && (
            <span className="session-badge" title={`Session: ${sessionId}`}>
              session active
            </span>
          )}
        </div>
        <div className="pane-header-right">
          <button className="header-btn" onClick={handleClear} title="New session">
            <Trash2 size={13} />
          </button>
          <button
            className="header-btn"
            onClick={() => setMaximised(v => !v)}
            title={maximised ? 'Restore' : 'Maximise'}
          >
            {maximised ? <Minimize2 size={13} /> : <Maximize2 size={13} />}
          </button>
        </div>
      </div>

      {/* ── Message list ── */}
      <div className="chat-messages">
        {messages.map(msg => (
          <ChatMessage key={msg.id} message={msg} />
        ))}
        {error && (
          <div className="chat-error">
            <AlertCircle size={13} />
            <span>{error}</span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* ── Input area ── */}
      <div className="chat-input-area">
        <form className="chat-input-form" onSubmit={handleSubmit}>
          <textarea
            ref={textareaRef}
            className="chat-input"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={loading ? 'GangaBot is thinking…' : 'Ask GangaBot… (Shift+Enter for new line)'}
            rows={1}
            spellCheck={false}
            disabled={loading}
          />
          <button
            type="submit"
            className={`send-btn ${input.trim() && !loading ? 'active' : ''}`}
            disabled={!input.trim() || loading}
            title="Send (Enter)"
          >
            <Send size={15} strokeWidth={2.5} />
          </button>
        </form>
        <p className="chat-hint">
          GangaBot can write and execute Ganga code directly in the terminal.
        </p>
      </div>
    </div>
  )
}

// ── Fenced code block with Copy + Run buttons ───────────────────────────────
function CodeBlock({ code }) {
  const [copied, setCopied] = useState(false)
  const [ran,    setRan]    = useState(false)

  const handleCopy = () => {
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    })
  }

  const handleRun = () => {
    window.dispatchEvent(new CustomEvent('gangaflow:run-code', { detail: { code } }))
    setRan(true)
    setTimeout(() => setRan(false), 1500)
  }

  return (
    <div className="msg-code-block">
      <div className="msg-code-header">
        <Terminal size={11} />
        <span>ganga</span>
        <div className="code-block-actions">
          <button
            className={`code-action-btn code-run-btn${ran ? ' code-ran' : ''}`}
            onClick={handleRun}
            title="Run in terminal"
          >
            {ran ? <Check size={11} /> : <Play size={11} />}
            <span>{ran ? 'Sent!' : 'Run'}</span>
          </button>
          <button
            className={`code-action-btn code-copy-btn${copied ? ' code-copied' : ''}`}
            onClick={handleCopy}
            title="Copy code"
          >
            {copied ? <Check size={11} /> : <Copy size={11} />}
          </button>
        </div>
      </div>
      <pre><code>{code}</code></pre>
    </div>
  )
}

// ── Individual message bubble ──────────────────────────────────────────────────
function ChatMessage({ message }) {
  const [copied, setCopied] = useState(false)
  const isUser = message.role === 'user'
  const isBot  = message.role === 'assistant'

  const handleCopy = () => {
    navigator.clipboard.writeText(message.text).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    })
  }

  // Custom renderers passed to ReactMarkdown
  const components = {
    code({ node, inline, className, children, ...props }) {
      const code = String(children).replace(/\n$/, '')
      if (inline) {
        return <code className="msg-inline-code" {...props}>{code}</code>
      }
      return <CodeBlock code={code} />
    },
  }

  return (
    <div className={`chat-message ${isUser ? 'user' : 'bot'}`}>
      {/* Avatar */}
      {isBot && (
        <div className="msg-avatar bot-avatar">
          <Bot size={14} strokeWidth={2} />
        </div>
      )}

      {/* Bubble */}
      <div className="msg-bubble-wrap">
        <div className={`msg-bubble ${isUser ? 'bubble-user' : 'bubble-bot'}`}>
          <div className="msg-body">
            {message.pending ? (
              <span className="typing-indicator">
                <span /><span /><span />
              </span>
            ) : (
              <ReactMarkdown components={components}>
                {message.text}
              </ReactMarkdown>
            )}
          </div>
        </div>

        {/* Meta row */}
        <div className={`msg-meta ${isUser ? 'meta-right' : 'meta-left'}`}>
          <span className="msg-time">
            {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
          {isBot && !message.pending && (
            <button className="msg-copy-btn" onClick={handleCopy} title="Copy message">
              {copied ? <Check size={11} /> : <Copy size={11} />}
            </button>
          )}
        </div>
      </div>

      {/* User avatar on the right */}
      {isUser && (
        <div className="msg-avatar user-avatar">
          <User size={14} strokeWidth={2} />
        </div>
      )}
    </div>
  )
}
