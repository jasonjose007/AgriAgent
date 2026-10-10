import { useState, useCallback } from 'react'
import { AuthProvider, useAuth } from './context/AuthContext'
import Header from './components/Header'
import ChatPanel from './components/ChatPanel'
import AgentTracker from './components/AgentTracker'
import ArchitectureModal from './components/ArchitectureModal'
import SchemeExplorer from './pages/SchemeExplorer'
import Login from './pages/Login'
import Register from './pages/Register'
import { sendChatMessage } from './api'
import { MOCK_RESPONSE } from './mockData'
import { T } from './translations'

const delay = (ms) => new Promise((r) => setTimeout(r, ms))

function Dashboard() {
  const { user } = useAuth()
  const [lang, setLang] = useState(user?.preferred_language === 'Tamil' ? 'ta' : 'en')
  const [view, setView] = useState('chat')
  const [showArch, setShowArch] = useState(false)
  const [messages, setMessages] = useState([])
  const [trackerSteps, setTrackerSteps] = useState([])
  const [schemeCards, setSchemeCards] = useState([])
  const [rawToolCalls, setRawToolCalls] = useState([])
  const [lastReply, setLastReply] = useState('')
  const [esevaDrafts, setEsevaDrafts] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const t = T[lang]

  const animateSteps = useCallback(async (toolCalls, profile) => {
    const steps = []

    if (profile) {
      steps.push({
        id: 'profile', type: 'profile', status: 'done',
        label: `Profile loaded: ${profile.full_name} | ${profile.district} | ${profile.soil_type}`,
      })
      setTrackerSteps([...steps])
      await delay(400)
    }

    steps.push({ id: 'think', type: 'thinking', label: t.thinking, status: 'active' })
    setTrackerSteps([...steps])
    await delay(900)
    steps[steps.length - 1].status = 'done'
    setTrackerSteps([...steps])

    for (let i = 0; i < toolCalls.length; i++) {
      const tc = toolCalls[i]
      const step = {
        id: `tool-${i}`, type: 'tool', toolName: tc.tool_name,
        args: tc.arguments, resultSummary: null, status: 'active',
      }
      steps.push(step)
      setTrackerSteps([...steps])
      await delay(700)

      step.resultSummary = summarizeResult(tc)
      step.status = 'done'
      setTrackerSteps([...steps])
      await delay(350)
    }

    steps.push({ id: 'synth', type: 'synthesizing', label: t.synthesizing, status: 'active' })
    setTrackerSteps([...steps])
    await delay(500)
    steps[steps.length - 1].status = 'done'
    setTrackerSteps([...steps])
  }, [t])

  const handleSend = useCallback(async (text, imageFile) => {
    setMessages((prev) => [...prev, {
      role: 'user', content: text,
      image: imageFile ? URL.createObjectURL(imageFile) : null,
    }])
    setIsLoading(true)
    setTrackerSteps([])
    setSchemeCards([])
    setRawToolCalls([])
    setLastReply('')
    setEsevaDrafts([])

    let data
    try {
      data = await sendChatMessage(text, imageFile)
    } catch (err) {
      console.warn('API fallback:', err.message)
      data = MOCK_RESPONSE
    }

    const profileForTracker = data.farmer_profile || (user ? {
      full_name: user.full_name, district: user.district, soil_type: user.soil_type,
    } : null)

    await animateSteps(data.tool_calls || [], profileForTracker)

    setMessages((prev) => [...prev, { role: 'agent', content: data.reply }])
    setRawToolCalls(data.tool_calls || [])
    setLastReply(data.reply || '')

    const schemes = (data.tool_calls || [])
      .filter((tc) => tc.tool_name === 'match_agri_schemes')
      .flatMap((tc) => tc.result?.matched_schemes || [])
    setSchemeCards(schemes)

    const drafts = (data.tool_calls || [])
      .filter((tc) => tc.tool_name === 'generate_official_draft')
      .map((tc) => tc.result)
    setEsevaDrafts(drafts)

    setIsLoading(false)
  }, [animateSteps, user])

  return (
    <div className="h-screen flex flex-col bg-rice-paper font-body text-ink">
      <Header
        lang={lang}
        onLangChange={() => setLang((l) => (l === 'en' ? 'ta' : 'en'))}
        onShowArch={() => setShowArch(true)}
      />

      {/* Tab bar */}
      <div className="flex border-b border-paddy-light/40 bg-white/50 px-5">
        <button
          onClick={() => setView('chat')}
          className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
            view === 'chat'
              ? 'border-paddy text-paddy-dark'
              : 'border-transparent text-ink-muted hover:text-ink-light'
          }`}
        >
          {t.chatTab}
        </button>
        <button
          onClick={() => setView('schemes')}
          className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
            view === 'schemes'
              ? 'border-paddy text-paddy-dark'
              : 'border-transparent text-ink-muted hover:text-ink-light'
          }`}
        >
          {t.schemesTab}
        </button>
      </div>

      {view === 'chat' ? (
        <main className="flex-1 flex overflow-hidden">
          <ChatPanel messages={messages} onSend={handleSend} isLoading={isLoading} lang={lang} />
          <AgentTracker
            steps={trackerSteps} schemeCards={schemeCards} toolCalls={rawToolCalls}
            agentReply={lastReply} esevaDrafts={esevaDrafts} lang={lang}
          />
        </main>
      ) : (
        <SchemeExplorer lang={lang} />
      )}

      {showArch && <ArchitectureModal lang={lang} onClose={() => setShowArch(false)} />}
    </div>
  )
}

function AppInner() {
  const { user, loading } = useAuth()
  const [page, setPage] = useState('login')
  const [lang, setLang] = useState('en')

  if (loading) {
    return (
      <div className="min-h-screen bg-rice-paper flex items-center justify-center font-body">
        <div className="text-center">
          <div className="w-12 h-12 rounded-xl bg-paddy flex items-center justify-center text-white text-xl font-display font-bold mx-auto mb-3 animate-pulse">A</div>
          <p className="text-sm text-ink-muted">Loading...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return page === 'login'
      ? <Login lang={lang} onSwitch={() => setPage('register')} />
      : <Register lang={lang} onSwitch={() => setPage('login')} />
  }

  return <Dashboard />
}

export default function App() {
  return (
    <AuthProvider>
      <AppInner />
    </AuthProvider>
  )
}

function summarizeResult(toolCall) {
  const { tool_name, result } = toolCall
  if (tool_name === 'match_agri_schemes') return `${result.total_matches} schemes matched`
  if (tool_name === 'fetch_mandi_and_weather') {
    const p = result.market_price
    return p?.modal_price ? `Rs ${p.modal_price}/${p.unit} at ${p.mandi}` : 'Market data retrieved'
  }
  if (tool_name === 'diagnose_crop_disease') return result.disease_name || 'Diagnosis complete'
  if (tool_name === 'generate_official_draft') return `Draft ready: ${result.scheme?.name || 'scheme'}`
  return 'Data received'
}
