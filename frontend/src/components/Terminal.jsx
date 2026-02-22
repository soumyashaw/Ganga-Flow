import { useState, useRef, useEffect } from 'react'
import { Terminal as TerminalIcon, Maximize2, Minimize2, XCircle, ChevronRight } from 'lucide-react'
import './Terminal.css'

// ── Placeholder history shown on load ────────────────────────────────────────
const BOOT_LINES = [
  { type: 'info',    text: '─── GangaFlow Terminal ──────────────────────────────' },
  { type: 'info',    text: 'Ganga shell session will appear here once connected.'  },
  { type: 'muted',   text: 'Type commands below or let GangaBot write them for you.' },
  { type: 'info',    text: '─────────────────────────────────────────────────────' },
  { type: 'blank',   text: ''                                                       },
  { type: 'prompt',  text: 'ganga > '/* prompt line — rendered specially */        },
]

export default function Terminal() {
  const [lines, setLines] = useState(BOOT_LINES)
  const [input, setInput] = useState('')
  const [history, setHistory] = useState([])
  const [histIdx, setHistIdx] = useState(-1)
  const [maximised, setMaximised] = useState(false)

  const outputRef = useRef(null)
  const inputRef  = useRef(null)

  // Auto-scroll to bottom whenever lines change
  useEffect(() => {
    if (outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight
    }
  }, [lines])

  // Re-focus input when clicking anywhere in the terminal body
  const focusInput = () => inputRef.current?.focus()

  const handleSubmit = (e) => {
    e.preventDefault()
    const cmd = input.trim()
    if (!cmd) return

    // Echo the command into the output
    setLines(prev => [
      ...prev,
      { type: 'command', text: cmd },
      { type: 'muted',   text: '(Not connected — command queued)' },
      { type: 'blank',   text: '' },
    ])
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
    setLines([{ type: 'muted', text: 'Terminal cleared.' }, { type: 'blank', text: '' }])
  }

  return (
    <div className={`terminal-pane ${maximised ? 'maximised' : ''}`}>
      {/* ── Pane header ── */}
      <div className="pane-header">
        <div className="pane-header-left">
          {/* macOS-style traffic-light dots */}
          <div className="traffic-lights">
            <span className="tl tl-red"   title="Close"    />
            <span className="tl tl-yellow" title="Minimise" />
            <span className="tl tl-green"  title="Maximise" />
          </div>
          <TerminalIcon size={13} className="pane-header-icon" />
          <span className="pane-header-title">Ganga Shell</span>
        </div>
        <div className="pane-header-right">
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
        {lines.map((line, i) => (
          <TerminalLine key={i} line={line} />
        ))}
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
          placeholder="enter ganga command…"
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
    prompt:  'line-prompt',
    command: 'line-command',
    output:  'line-output',
    error:   'line-error',
    warning: 'line-warning',
    success: 'line-success',
  }

  if (line.type === 'blank') return <div className="terminal-line" />

  if (line.type === 'command') {
    return (
      <div className="terminal-line line-command">
        <span className="inline-prompt">ganga &gt;&nbsp;</span>
        {line.text}
      </div>
    )
  }

  return (
    <div className={`terminal-line ${classMap[line.type] ?? 'line-output'}`}>
      {line.text}
    </div>
  )
}
