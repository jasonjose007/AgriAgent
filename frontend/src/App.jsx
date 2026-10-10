import { useState, useCallback } from 'react'
import Header from './components/Header'
import ChatPanel from './components/ChatPanel'
import AgentTracker from './components/AgentTracker'
import ArchitectureModal from './components/ArchitectureModal'
import { sendChatMessage } from './api'
import { MOCK_RESPONSE } from './mockData'
import { T } from './translations'

const delay = (ms) => new Promise((r) => setTimeout(r, ms))

export default function App() {
  const [lang, setLang] = useState('en')
  const [showArch, setShowArch] = useState(false)
  const [messages, setMessages] = useState([])
  const [trackerSteps, setTrackerSteps] = useState([])
  const [schemeCards, setSchemeCards] = useState([])
  const [rawToolCalls, setRawToolCalls] = useState([])
  const [lastReply, setLastReply] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const t = T[lang]

  const animateSteps = useCallback(async (toolCalls) => {
    const steps = []

    steps.push({ id: 'think', type: 'thinking', label: t.thinking, status: 'active' })
    setTrackerSteps([...steps])
    await delay(900)
    steps[0].status = 'done'
    setTrackerSteps([...steps])

    for (let i = 0; i < toolCalls.length; i++) {
      const tc = toolCalls[i]
      const step = {
        id: `tool-${i}`,
        type: 'tool',
        toolName: tc.tool_name,
        args: tc.arguments,
        resultSummary: null,
        status: 'active',
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
    setMessages((prev) => [
      ...prev,
      {
        role: 'user',
        content: text,
        image: imageFile ? URL.createObjectURL(imageFile) : null,
        _blobUrl: imageFile ? true : false,
      },
    ])
    setIsLoading(true)
    setTrackerSteps([])
    setSchemeCards([])
    setRawToolCalls([])
    setLastReply('')

    let data
    try {
      data = await sendChatMessage(text, imageFile)
    } catch (err) {
      console.warn('API unavailable, falling back to mock data:', err.message)
      data = MOCK_RESPONSE
    }

    await animateSteps(data.tool_calls || [])

    setMessages((prev) => [...prev, { role: 'agent', content: data.reply }])
    setRawToolCalls(data.tool_calls || [])
    setLastReply(data.reply || '')

    const schemes = (data.tool_calls || [])
      .filter((tc) => tc.tool_name === 'match_agri_schemes')
      .flatMap((tc) => tc.result?.matched_schemes || [])
    setSchemeCards(schemes)

    setIsLoading(false)
  }, [animateSteps])

  return (
    <div className="h-screen flex flex-col bg-rice-paper font-body text-ink">
      <Header
        lang={lang}
        onLangChange={() => setLang((l) => (l === 'en' ? 'ta' : 'en'))}
        onShowArch={() => setShowArch(true)}
      />

      <main className="flex-1 flex overflow-hidden">
        <ChatPanel
          messages={messages}
          onSend={handleSend}
          isLoading={isLoading}
          lang={lang}
        />
        <AgentTracker
          steps={trackerSteps}
          schemeCards={schemeCards}
          toolCalls={rawToolCalls}
          agentReply={lastReply}
          lang={lang}
        />
      </main>

      {showArch && (
        <ArchitectureModal lang={lang} onClose={() => setShowArch(false)} />
      )}
    </div>
  )
}

function summarizeResult(toolCall) {
  const { tool_name, result } = toolCall
  if (tool_name === 'match_agri_schemes') {
    return `${result.total_matches} schemes matched`
  }
  if (tool_name === 'fetch_mandi_and_weather') {
    const p = result.market_price
    if (p?.modal_price) return `Rs ${p.modal_price}/${p.unit} at ${p.mandi}`
    return 'Market + weather data retrieved'
  }
  if (tool_name === 'diagnose_crop_disease') {
    return result.disease_name || 'Diagnosis complete'
  }
  return 'Data received'
}
