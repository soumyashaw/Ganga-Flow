import { useState, useRef, useEffect, useCallback } from 'react'
import {
  Terminal as TerminalIcon,
  Maximize2, Minimize2, XCircle, ChevronRight,
  Wifi, WifiOff, RotateCcw,
} from 'lucide-react'
import './Terminal.css'

const WS_URL = 'ws://localhost:8000/ws/terminal/'

// Strip any residual ANSI escape codes the backend might have missed
const ANSI_RE = /\x1B\[[0-?]*[ -/]*[@-~]|\x1B[()][AB012]|\x1B=|\r/g
const stripAnsi = (str) => str.replace(ANSI_RE, '')

// ── Connection states ─────────────────────────────────────────────────────────
const STATUS = {
  CONNECTING:   'connecting',
  CONNECTED:    'connected',
  DISCONNECTED: 'disconnected',
  ERROR:        'error',
}

export default function Terminal() {
  const [lines,     setLines]     = useState([])
  const [input,     setInput]     = useState('')
  const [history,   setHistory]   = useState([])
  const [histIdx,   setHistIdx]   = useState(-1)
  const [status,    setStatus]    = useState(STATUS.DISCONNECTED)
  const [maximised, setMaximised] = useState(false)

  const outputRef  = useRef(null)
  const inputRef   = useRef(null)
  const wsRef      = useRef(null)
  // Buffer for partial lines arriving between WS frames
  const lineBuffer = useRef('')

  // ── Auto-scroll ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight
    }
  }, [lines])

  // ── Helpers ──────────────────────────────────────────────────────────────────
  const appendLine = useCallback((type, text) => {
    setLines(prev => [...prev, { type, text, id: Date.now() + Math.random() }])
  }, [])

  const focusInput = () => inputRef.current?.focus()

  // ── WebSocket lifecycle ──────────────────────────────────────────────────────
  const connect = useCallback(() => {
    if (wsRef.current && wsRef.current.readyState < 2) return // already open/connecting

    setStatus(STATUS.CONNECTING)
    appendLine('info', '─── GangaFlow Terminal ──────────────────────────────')
    appendLine('info', `Connecting to shell at ${WS_URL} …`)

    const ws = new WebSocket(WS_URL)
    wsRef.current = ws

    ws.onopen = () => {
      setStatus(STATUS.CONNECTED)
      appendLine('success', 'Connected. Shell is ready.')
      appendLine('blank', '')
      inputRef.current?.focus()
    }

    ws.onmessage = (evt) => {
      // Combine with any leftover from previous frame, then split on newlines
      const raw   = stripAnsi(lineBuffer.current + evt.data)
      const parts = raw.split('\n')
      lineBuffer.current = parts.pop() // last segment may be incomplete

      parts.forEach(part => {
        if (part.trim()) appendLine('output', part)
      })
    }

    ws.onerror = () => {
      setStatus(STATUS.ERROR)
      appendLine('error', 'WebSocket error — is the Django server running?  (daphne ganga_backend.asgi:application)')
    }

    ws.onclose = (evt) => {
      setStatus(STATUS.DISCONNECTED)
      if (lineBuffer.current.trim()) {
        appendLine('output', stripAnsi(lineBuffer.current))
        lineBuffer.current = ''
      }
      appendLine('muted', `Shell disconnected (code ${evt.code}).`)
    }
  }, [appendLine])

  // Connect on mount, close on unmount
  useEffect(() => {
    connect()
    return () => { wsRef.current?.close() }
  }, [connect])

  // Broadcast WS status to Navbar
  useEffect(() => {
    window.dispatchEvent(new CustomEvent('gangaflow:terminal-status', {
      detail: { connected: status === STATUS.CONNECTED },
    }))
  }, [status])

  // ── Run-code events from Chat pane ───────────────────────────────────────────
  useEffect(() => {
    const handler = (evt) => {
      const ws = wsRef.current
      if (!ws || ws.readyState !== WebSocket.OPEN) {
        appendLine('error', 'Terminal not connected — cannot run code.')
        return
      }
      const lines = evt.detail.code.split('\n')
      lines.forEach(line => ws.send(line + '\r'))
      // Send a blank line to close any open Python block
      ws.send('\r')
    }
    window.addEventListener('gangaflow:run-code', handler)
    return () => window.removeEventListener('gangaflow:run-code', handler)
  }, [appendLine])

  // ── Input handling ───────────────────────────────────────────────────────────
  const handleSubmit = (e) => {
    e.preventDefault()
    const cmd = input.trim()
    if (!cmd) return

    if (status !== STATUS.CONNECTED || !wsRef.current) {
      appendLine('error', 'Not connected. Click reconnect (↺).')
      return
    }

    // Send raw command + carriage-return to the PTY
    wsRef.current.send(cmd + '\r')
    setHistory(prev => [cmd, ...prev])
    setHistIdx(-1)
    setInput('')
  }

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowUp') {
      e.preventDefault()
      const next = Math.min(histIdx + 1, history.length - 1)
      setHistIdx(next)
      setInput(history[next] ?? '')
    } else if (e.key === 'ArrowDown') {
      e.preventDefault()
      const next = Math.max(histIdx - 1, -1)
      setHistIdx(next)
      setInput(next === -1 ? '' : history[next])
    }
  }

  const handleClear = () => {
    setLines([])
    lineBuffer.current = ''
  }

  const handleReconnect = () => {
    wsRef.current?.close()
    setLines([])
    lineBuffer.current = ''
    setTimeout(connect, 200)
  }

  // ── Status badge meta ────────────────────────────────────────────────────────
  const statusMeta = {
    [STATUS.CONNECTING]:   { label: 'connecting…',  cls: 'status-connecting'   },
    [STATUS.CONNECTED]:    { label: 'connected',    cls: 'status-connected'    },
    [STATUS.DISCONNECTED]: { label: 'disconnected', cls: 'status-disconnected' },
    [STATUS.ERROR]:        { label: 'error',        cls: 'status-error'        },
  }
  const { label: statusLabel, cls: statusCls } = statusMeta[status]
  const isConnected = status === STATUS.CONNECTED

  return (
    <div className={`terminal-pane ${maximised ? 'maximised' : ''}`}>

      {/* ── Pane header ── */}
      <div className="pane-header">
        <div className="pane-header-left">
          <div className="traffic-lights">
            <span className="tl tl-red"    title="Close"    />
            <span className="tl tl-yellow" title="Minimise" />
            <span className="tl tl-green"  title="Maximise" />
          </div>
          <TerminalIcon size={13} className="pane-header-icon" />
          <span className="pane-header-title">Ganga Shell</span>
          <span className={`ws-status-badge ${statusCls}`}>
            {isConnected
              ? <Wifi    size={10} strokeWidth={2.5} />
              : <WifiOff size={10} strokeWidth={2.5} />
            }
            {statusLabel}
          </span>
        </div>
        <div className="pane-header-right">
          <button className="header-btn" onClick={handleReconnect} title="Reconnect shell">
            <RotateCcw size={13} />
          </button>
          <button className="header-btn" onClick={handleClear} title="Clear terminal">
            <XCircle size={13} />
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

      {/* ── Output area ── */}
      <div className="terminal-output" ref={outputRef} onClick={focusInput}>
        {lines.map(line => <TerminalLine key={line.id} line={line} />)}
      </div>

      {/* ── Input row ── */}
      <form className="terminal-input-row" onSubmit={handleSubmit}>
        <span className="terminal-prompt">
          <ChevronRight size={13} className="prompt-chevron" />
          <span className="prompt-label">ganga</span>
          <span className="prompt-separator"> &gt; </span>
        </span>
        <input
          ref={inputRef}
          className="terminal-input"
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={isConnected ? 'enter command…' : 'not connected'}
          autoComplete="off"
          spellCheck={false}
          autoFocus
        />
      </form>
    </div>
  )
}

// ── Individual line renderer ──────────────────────────────────────────────────
function TerminalLine({ line }) {
  const classMap = {
    info:    'line-info',
    muted:   'line-muted',
    blank:   'line-blank',
    output:  'line-output',
    error:   'line-error',
    warning: 'line-warning',
    success: 'line-success',
    command: 'line-command',
  }

  if (line.type === 'blank') return <div className="terminal-line line-blank" />

  return (
    <div className={`terminal-line ${classMap[line.type] ?? 'line-output'}`}>
      {line.text}
    </div>
  )
}
