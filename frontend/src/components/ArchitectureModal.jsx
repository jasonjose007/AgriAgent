import { T } from '../translations'

export default function ArchitectureModal({ lang, onClose }) {
  const t = T[lang]

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full mx-4 max-h-[85vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-paddy-light/30">
          <h2 className="font-display font-bold text-paddy-dark text-lg">
            {t.architecture}
          </h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-paddy-light/30 text-ink-muted transition-colors"
          >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="4" y1="4" x2="14" y2="14" />
              <line x1="14" y1="4" x2="4" y2="14" />
            </svg>
          </button>
        </div>

        <div className="px-6 py-6 space-y-6">
          <p className="text-sm text-ink-light leading-relaxed max-w-xl">
            AgriAgent is a semi-autonomous AI agent that uses Gemini's function-calling
            capability to reason over farmer inputs and take data-backed actions. It
            never makes irreversible decisions — only drafts applications and advisory handoffs.
          </p>

          {/* Main pipeline */}
          <div className="flex items-stretch gap-3 overflow-x-auto pb-2">
            <FlowNode
              title="Farmer Input"
              desc="Text query, crop photo, or voice"
              color="turmeric"
              icon={
                <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2M12 3a4 4 0 100 8 4 4 0 000-8z" />
              }
            />
            <Arrow />
            <FlowNode
              title="Gemini LLM"
              desc="Reads tools, reasons over intent, decides which to call"
              color="paddy"
              icon={
                <path d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              }
            />
            <Arrow />
            <FlowNode
              title="Tool Execution"
              desc="Our backend runs the selected tool and returns data"
              color="paddy"
              icon={
                <path d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              }
            />
            <Arrow />
            <FlowNode
              title="Advisory Response"
              desc="Draft schemes, market advice, diagnosis — never final decisions"
              color="turmeric"
              icon={
                <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              }
            />
          </div>

          {/* Tools detail */}
          <div>
            <h3 className="font-display font-semibold text-sm text-paddy-dark mb-3">
              Available tools (selected autonomously by the agent)
            </h3>
            <div className="grid grid-cols-3 gap-3">
              <ToolCard
                name="match_agri_schemes"
                label="Scheme Matcher"
                desc="Searches PM-KISAN, PMFBY, TN Micro Irrigation, SMAM, NHM databases. Drafts eligibility checklist with required documents."
                params="crop_type, acreage, region"
              />
              <ToolCard
                name="fetch_mandi_and_weather"
                label="Market + Weather"
                desc="Fetches mandi prices from Tamil Nadu APMCs, compares against MSP, retrieves IMD weather and crop advisories."
                params="district, commodity"
              />
              <ToolCard
                name="diagnose_crop_disease"
                label="Vision Diagnostic"
                desc="Sends crop leaf photo to Gemini Vision. Returns disease identification, treatment plan, and urgency level."
                params="image (multimodal)"
              />
            </div>
          </div>

          {/* Key point for judges */}
          <div className="bg-paddy-pale rounded-lg px-4 py-3 border border-paddy/10">
            <p className="text-sm text-paddy-dark leading-relaxed">
              <span className="font-semibold">Why this is an agent, not a chatbot:</span>{' '}
              The model inspects tool declarations, reasons about which tools to call
              based on the user's intent, executes them in sequence, and synthesizes the
              results into actionable advice. The tool_calls log in every API response
              proves autonomous tool selection — no hardcoded if/else routing.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

function FlowNode({ title, desc, color, icon }) {
  const border = color === 'turmeric' ? 'border-turmeric/30' : 'border-paddy/30'
  const bg = color === 'turmeric' ? 'bg-turmeric-pale' : 'bg-paddy-pale/60'
  const iconColor = color === 'turmeric' ? 'text-turmeric' : 'text-paddy'

  return (
    <div className={`flex-1 min-w-[130px] ${bg} rounded-lg border ${border} px-3 py-3 text-center`}>
      <div className={`mx-auto w-8 h-8 mb-2 ${iconColor}`}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-full h-full">
          {icon}
        </svg>
      </div>
      <p className="font-display font-semibold text-xs text-ink">{title}</p>
      <p className="text-[10px] text-ink-muted mt-1 leading-snug">{desc}</p>
    </div>
  )
}

function Arrow() {
  return (
    <div className="flex items-center flex-shrink-0 text-paddy/40">
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="5" y1="12" x2="19" y2="12" />
        <polyline points="12 5 19 12 12 19" />
      </svg>
    </div>
  )
}

function ToolCard({ name, label, desc, params }) {
  return (
    <div className="bg-white rounded-lg border border-paddy-light/50 px-3 py-3">
      <p className="font-display font-semibold text-xs text-paddy-dark">{label}</p>
      <p className="font-mono text-[10px] text-ink-muted mt-0.5">{name}</p>
      <p className="text-[11px] text-ink-light mt-1.5 leading-snug">{desc}</p>
      <p className="text-[10px] text-ink-muted mt-1.5 font-mono">({params})</p>
    </div>
  )
}
