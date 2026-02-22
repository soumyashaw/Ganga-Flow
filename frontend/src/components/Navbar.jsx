import { useState, useEffect } from 'react'
import { Terminal as TerminalIcon, Wifi, WifiOff } from 'lucide-react'
import './Navbar.css'

export default function Navbar() {
  const [gangaConnected, setGangaConnected] = useState(false)
  const [llmConnected,   setLlmConnected]   = useState(false)

  useEffect(() => {
    const onTerminal = (e) => setGangaConnected(e.detail.connected)
    const onLlm      = (e) => setLlmConnected(e.detail.connected)
    window.addEventListener('gangaflow:terminal-status', onTerminal)
    window.addEventListener('gangaflow:llm-status',      onLlm)
    return () => {
      window.removeEventListener('gangaflow:terminal-status', onTerminal)
      window.removeEventListener('gangaflow:llm-status',      onLlm)
    }
  }, [])

  return (
    <header className="navbar">
      {/* Left: Logo + name */}
      <div className="navbar-left">
        <div className="navbar-logo">
          <TerminalIcon size={18} strokeWidth={2} className="navbar-logo-icon" />
        </div>
        <span className="navbar-title">
          Ganga<span className="navbar-title-accent">Flow</span>
        </span>
        <span className="navbar-badge">beta</span>
      </div>

      {/* Centre: Status indicators */}
      <div className="navbar-center">
        <StatusPill
          label="Ganga Shell"
          connected={gangaConnected}
        />
        <StatusPill
          label="GangaBot"
          connected={llmConnected}
        />
      </div>

      {/* Right: Info */}
      <div className="navbar-right">
        <span className="navbar-hint">LLM-assisted Ganga interface</span>
      </div>
    </header>
  )
}

function StatusPill({ label, connected }) {
  return (
    <div className={`status-pill ${connected ? 'connected' : 'disconnected'}`}>
      {connected
        ? <Wifi size={11} strokeWidth={2.5} />
        : <WifiOff size={11} strokeWidth={2.5} />
      }
      <span>{label}</span>
      <span className={`status-dot ${connected ? 'on' : 'off'}`} />
    </div>
  )
}
