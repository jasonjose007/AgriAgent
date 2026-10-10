import { T } from '../translations'
import SummaryCard from './SummaryCard'
import SchemeCard from './SchemeCard'

const TOOL_LABELS = {
  match_agri_schemes: 'Scheme Matcher',
  fetch_mandi_and_weather: 'Market + Weather',
  diagnose_crop_disease: 'Vision Diagnostic',
}

const TOOL_DESCRIPTIONS = {
  match_agri_schemes: 'Matching farmer profile against government agriculture schemes database',
  fetch_mandi_and_weather: 'Fetching live mandi prices and IMD weather data',
  diagnose_crop_disease: 'Analyzing crop leaf image with Gemini Vision',
}

export default function AgentTracker({ steps, schemeCards, toolCalls, lang }) {
  const t = T[lang]
  const isIdle = steps.length === 0
  const allDone = steps.length > 0 && steps.every((s) => s.status === 'done')

  return (
    <div className="w-[45%] flex flex-col bg-paddy-pale/30">
      <div className="px-4 py-2.5 border-b border-paddy-light/30">
        <h2 className="font-display font-semibold text-paddy-dark text-sm">
          {t.trackerTitle}
        </h2>
      </div>

      <div className="flex-1 overflow-y-auto tracker-scroll px-4 py-4">
        {isIdle ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center max-w-xs space-y-3">
              <div className="mx-auto w-12 h-12 rounded-full bg-paddy-light/50 flex items-center justify-center">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-paddy/60">
                  <path d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <p className="text-xs text-ink-muted leading-relaxed">
                {t.idleTracker}
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-5">
            {allDone && toolCalls && toolCalls.length > 0 && (
              <SummaryCard toolCalls={toolCalls} lang={lang} />
            )}

            <div className="tracker-timeline space-y-4">
              {steps.map((step) => (
                <div key={step.id} className="relative step-enter">
                  <StepDot status={step.status} />
                  {step.type === 'tool' ? (
                    <ToolStep step={step} lang={lang} />
                  ) : (
                    <StatusStep step={step} />
                  )}
                </div>
              ))}
            </div>

            {schemeCards.length > 0 && (
              <div className="space-y-3 mt-6">
                <h3 className="font-display font-semibold text-sm text-paddy-dark">
                  {t.schemeDraft}
                </h3>
                <p className="text-xs text-ink-muted">{t.draftSubtitle}</p>
                {schemeCards.map((scheme, i) => (
                  <SchemeCard key={scheme.scheme_id || i} scheme={scheme} lang={lang} />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

function StepDot({ status }) {
  const colors =
    status === 'done'
      ? 'bg-paddy border-paddy'
      : 'bg-turmeric border-turmeric'

  return (
    <div className="absolute -left-[1.3125rem] top-1">
      <div
        className={`w-[14px] h-[14px] rounded-full border-2 ${colors} ${
          status === 'active' ? 'dot-pulse' : ''
        }`}
      >
        {status === 'done' && (
          <svg viewBox="0 0 12 12" className="w-full h-full text-white p-[1px]">
            <polyline
              points="2.5 6 5 8.5 9.5 3.5"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}
      </div>
    </div>
  )
}

function StatusStep({ step }) {
  return (
    <div className="py-1">
      <p className="text-sm font-medium text-ink">
        {step.label}
      </p>
    </div>
  )
}

function ToolStep({ step }) {
  const label = TOOL_LABELS[step.toolName] || step.toolName
  const desc = TOOL_DESCRIPTIONS[step.toolName] || ''

  return (
    <div className="bg-white rounded-lg border border-paddy-light/50 px-3 py-2.5 space-y-1.5">
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-paddy-dark">{label}</span>
        <span
          className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${
            step.status === 'done'
              ? 'bg-paddy-light text-paddy'
              : 'bg-turmeric-light text-turmeric'
          }`}
        >
          {step.status === 'done' ? 'Complete' : 'Running...'}
        </span>
      </div>

      {desc && (
        <p className="text-xs text-ink-muted">{desc}</p>
      )}

      <div className="text-xs bg-paddy-pale/60 rounded px-2 py-1.5 font-mono text-ink-light">
        <span className="text-ink-muted select-none">args: </span>
        {Object.entries(step.args || {}).map(([k, v], i) => (
          <span key={k}>
            {i > 0 && <span className="text-ink-muted">, </span>}
            <span className="text-paddy-dark">{k}</span>
            <span className="text-ink-muted">=</span>
            <span className="text-turmeric">{JSON.stringify(v)}</span>
          </span>
        ))}
      </div>

      {step.resultSummary && (
        <p className="text-xs font-medium text-paddy flex items-center gap-1">
          <svg width="12" height="12" viewBox="0 0 12 12" className="flex-shrink-0">
            <circle cx="6" cy="6" r="5" fill="none" stroke="currentColor" strokeWidth="1.5" />
            <polyline points="3.5 6 5.5 8 8.5 4" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          {step.resultSummary}
        </p>
      )}
    </div>
  )
}
