import Navbar from './components/Navbar'
import Terminal from './components/Terminal'
import Chat from './components/Chat'
import './App.css'

function App() {
  return (
    <div className="app-shell">
      <Navbar />
      <div className="main-layout">
        <Terminal />
        <div className="pane-divider" />
        <Chat />
      </div>
    </div>
  )
}

export default App
