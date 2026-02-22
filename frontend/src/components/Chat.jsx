import { useState, useRef, useEffect } from 'react'
import { Bot, User, Copy, Check, Terminal, Send, Trash2, Maximize2, Minimize2 } from 'lucide-react'
import './Chat.css'

// ── Boot message shown on load ────────────────────────────────────────────────
const INITIAL_MESSAGES = [
  {
    id: 1,
    role: 'assistant',
    text: "Hello! I'm **GangaBot**, your AI assistant for Ganga — CERN's job management framework.\n\nAsk me anything about Ganga or describe the job you want to run, and I'll generate the commands for you.",
    timestamp: new Date(),
  },
]

export default function Chat() {
  const [messages,   setMessages]   = useState(INITIAL_MESSAGES)
  const [input,      setInput]      = useState('')
  const [maximised,  setMaximised]  = useState(false)

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

  const handleSubmit = (e) => {
    e?.preventDefault()
    const text = input.trim()
    if (!text) return

    const userMsg = {
      id: Date.now(),
      role: 'user',
      text,
      timestamp: new Date(),
    }

    const pendingMsg = {
      id: Date.now() + 1,
      role: 'assistant',
      text: '…',
      pending: true,
      timestamp: new Date(),
    }

    setMessages(prev => [...prev, userMsg, pendingMsg])
    setInput('')
  }

  const handleKeyDown = (e) => {
    // Submit on Enter (without Shift)
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  const handleClear = () => {
    setMessages([])
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
        </div>
        <div className="pane-header-right">
          <button className="header-btn" onClick={handleClear} title="Clear chat">
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
            placeholder="Ask GangaBot… (Shift+Enter for new line)"
            rows={1}
            spellCheck={false}
          />
          <button
            type="submit"
            className={`send-btn ${input.trim() ? 'active' : ''}`}
            disabled={!input.trim()}
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

  // Render simple bold (**text**) and code blocks (```...```) in bot messages
  const renderText = (text) => {
    if (message.pending) {
      return (
        <span className="typing-indicator">
          <span /><span /><span />
        </span>
      )
    }
    const parts = text.split(/(```[\s\S]*?```|\*\*[^*]+\*\*)/g)
    return parts.map((part, i) => {
      if (part.startsWith('```') && part.endsWith('```')) {
        const code = part.slice(3, -3).replace(/^\n/, '')
        return (
          <div key={i} className="msg-code-block">
            <div className="msg-code-header">
              <Terminal size={11} />
              <span>ganga</span>
              <button
                className="code-copy-btn"
                onClick={() => navigator.clipboard.writeText(code)}
                title="Copy code"
              >
                <Copy size={11} />
              </button>
            </div>
            <pre><code>{code}</code></pre>
          </div>
        )
      }
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={i}>{part.slice(2, -2)}</strong>
      }
      return <span key={i}>{part}</span>
    })
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
          <div className="msg-body">{renderText(message.text)}</div>
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
