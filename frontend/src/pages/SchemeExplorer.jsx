import { useState, useCallback } from 'react'
import { useAuth } from '../context/AuthContext'
import { matchSchemes, generateSchemeDraft } from '../api'
import ESevaDraft from '../components/ESevaDraft'
import { T } from '../translations'

const CATEGORIES = [
  { key: 'all', en: 'All Schemes', ta: 'அனைத்தும்' },
  { key: 'irrigation', en: 'Irrigation & Water', ta: 'நீர்ப்பாசனம்' },
  { key: 'machinery', en: 'Machinery Subsidies', ta: 'இயந்திர மானியம்' },
  { key: 'financial', en: 'Crop Insurance & Financial Aid', ta: 'பயிர் காப்பீடு' },
  { key: 'soil', en: 'Soil & Fertilizer Support', ta: 'மண் ஆரோக்கியம்' },
]

const DISTRICTS = [
  'Chennai', 'Coimbatore', 'Madurai', 'Thanjavur', 'Tiruchirappalli',
  'Salem', 'Erode', 'Tirunelveli', 'Kanchipuram', 'Vellore',
  'Cuddalore', 'Nagapattinam', 'Dindigul', 'Theni', 'Sivaganga',
]

const CROPS = [
  'Paddy', 'Sugarcane', 'Cotton', 'Groundnut', 'Banana',
  'Coconut', 'Turmeric', 'Maize', 'Millets', 'Vegetables',
]

const CATEGORY_MAP = {
  'PMKISAN': 'financial',
  'PMFBY': 'financial',
  'TN_MICRO_IRRIGATION': 'irrigation',
  'TN_CROP_INSURANCE': 'financial',
  'NHM': 'financial',
  'SMAM': 'machinery',
  'TN_SOIL_HEALTH': 'soil',
}

export default function SchemeExplorer({ lang }) {
  const t = T[lang]
  const { user } = useAuth()
  const [useProfile, setUseProfile] = useState(true)
  const [category, setCategory] = useState('all')
  const [district, setDistrict] = useState(user?.district || 'Thanjavur')
  const [soilType, setSoilType] = useState(user?.soil_type || 'alluvial')
  const [acreage, setAcreage] = useState(user?.acreage?.toString() || '4')
  const [cropType, setCropType] = useState(user?.primary_crop || 'Paddy')
  const [results, setResults] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [agentTrace, setAgentTrace] = useState('')
  const [draftModal, setDraftModal] = useState(null)
  const [draftLoading, setDraftLoading] = useState(null)

  const handleUseProfile = (checked) => {
    setUseProfile(checked)
    if (checked && user) {
      setDistrict(user.district || 'Thanjavur')
      setSoilType(user.soil_type || 'alluvial')
      setAcreage(user.acreage?.toString() || '4')
      setCropType(user.primary_crop || 'Paddy')
    }
  }

  const handleSearch = useCallback(async () => {
    setLoading(true)
    setError('')
    setResults(null)
    setAgentTrace('')
    try {
      const data = await matchSchemes({
        district,
        soil_type: soilType,
        acreage: parseFloat(acreage) || 1,
        crop_type: cropType.toLowerCase(),
        category_filter: category === 'all' ? null : category,
      })
      let schemes = data.matched_schemes || []
      if (category !== 'all') {
        schemes = schemes.filter((s) => CATEGORY_MAP[s.scheme_id] === category)
      }
      setResults(schemes)
      setAgentTrace(
        `[Agent]: Filtered ${data.total_matches || schemes.length} scheme rules against ` +
        `Soil: ${soilType.replace('_', ' ')} & District: ${district} & Crop: ${cropType} ` +
        `→ Matched ${schemes.length} eligible scheme${schemes.length !== 1 ? 's' : ''}`
      )
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [district, soilType, acreage, cropType, category])

  const handleGenerateDraft = useCallback(async (scheme) => {
    setDraftLoading(scheme.scheme_id)
    try {
      const data = await generateSchemeDraft({
        scheme_id: scheme.scheme_id,
        scheme_name: scheme.name,
        farmer_name: user?.full_name || 'Farmer',
        district: district,
        document_checklist: (scheme.documents_required || []).join(', '),
      })
      setDraftModal(data)
    } catch {
      setDraftModal({
        draft_type: 'e-Seva Application Draft',
        status: 'DRAFT — NOT YET SUBMITTED',
        applicant: { name: user?.full_name || 'Farmer', district },
        scheme: { name: scheme.name, id: scheme.scheme_id },
        document_checklist: (scheme.documents_required || []).map((d) => ({ document: d, status: 'PENDING' })),
        instructions: [
          '1. Collect all documents listed above',
          `2. Visit your nearest e-Seva centre in ${district}`,
          `3. Show this draft and request application for ${scheme.name}`,
          '4. The operator will verify and submit officially',
          '5. Keep the acknowledgment receipt',
        ],
        disclaimer: 'AI-generated draft for reference only. Official submission through authorized channels.',
      })
    } finally {
      setDraftLoading(null)
    }
  }, [user, district])

  const getMatchColor = (score) => {
    if (score === 'HIGH') return 'bg-paddy-light text-paddy'
    if (score === 'GENERAL') return 'bg-turmeric-light text-turmeric'
    return 'bg-stone text-ink-muted'
  }

  const getMatchLabel = (score) => {
    if (score === 'HIGH') return lang === 'ta' ? 'உயர் பொருத்தம்' : 'High Match'
    return lang === 'ta' ? 'பொதுவான' : 'General'
  }

  const getProvider = (schemeId) => {
    return schemeId?.startsWith('TN_') ? 'state' : 'central'
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Filter Bar */}
      <div className="bg-white border-b border-paddy-light/40 px-5 py-4 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-display font-bold text-paddy-dark text-base">{t.schemeHub}</h2>
          {user && (
            <label className="flex items-center gap-2 text-xs cursor-pointer">
              <input
                type="checkbox"
                checked={useProfile}
                onChange={(e) => handleUseProfile(e.target.checked)}
                className="rounded border-paddy-light accent-paddy"
              />
              <span className="font-medium text-paddy-dark">{t.useMyProfile}</span>
              {useProfile && (
                <span className="text-ink-muted">
                  ({user.full_name} — {user.district})
                </span>
              )}
            </label>
          )}
        </div>

        {/* Category chips */}
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.key}
              onClick={() => setCategory(cat.key)}
              className={`px-3 py-1.5 text-xs font-medium rounded-full border transition-colors ${
                category === cat.key
                  ? 'bg-paddy text-white border-paddy'
                  : 'bg-white text-ink-light border-paddy-light/50 hover:border-paddy/40'
              }`}
            >
              {lang === 'ta' ? cat.ta : cat.en}
            </button>
          ))}
        </div>

        {/* Filter inputs */}
        <div className="flex items-end gap-3">
          <div className="flex-1">
            <label className="block text-[10px] font-medium text-ink-muted mb-1">{t.district}</label>
            <select
              value={district}
              onChange={(e) => setDistrict(e.target.value)}
              disabled={useProfile && user}
              className="w-full px-2.5 py-1.5 text-xs border border-paddy-light/50 rounded-lg bg-white focus:outline-none focus:border-paddy/50 disabled:opacity-60"
            >
              {DISTRICTS.map((d) => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
          <div className="flex-1">
            <label className="block text-[10px] font-medium text-ink-muted mb-1">{t.primaryCrop}</label>
            <select
              value={cropType}
              onChange={(e) => setCropType(e.target.value)}
              disabled={useProfile && user}
              className="w-full px-2.5 py-1.5 text-xs border border-paddy-light/50 rounded-lg bg-white focus:outline-none focus:border-paddy/50 disabled:opacity-60"
            >
              {CROPS.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className="w-24">
            <label className="block text-[10px] font-medium text-ink-muted mb-1">{t.acreage}</label>
            <input
              type="number"
              step="0.5"
              min="0.5"
              value={acreage}
              onChange={(e) => setAcreage(e.target.value)}
              disabled={useProfile && user}
              className="w-full px-2.5 py-1.5 text-xs border border-paddy-light/50 rounded-lg bg-white focus:outline-none focus:border-paddy/50 disabled:opacity-60"
            />
          </div>
          <button
            onClick={handleSearch}
            disabled={loading}
            className="px-5 py-1.5 text-xs font-semibold bg-paddy text-white rounded-lg hover:bg-paddy-mid transition-colors disabled:opacity-50"
          >
            {loading ? '...' : t.findSchemes}
          </button>
        </div>
      </div>

      {/* Results */}
      <div className="flex-1 overflow-y-auto tracker-scroll px-5 py-4">
        {error && (
          <p className="text-sm text-laterite bg-laterite-light/50 rounded-lg px-4 py-3 mb-4">{error}</p>
        )}

        {!results && !loading && (
          <div className="flex items-center justify-center h-full text-center">
            <div className="max-w-xs space-y-3">
              <div className="mx-auto w-14 h-14 rounded-full bg-paddy-light/40 flex items-center justify-center">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-paddy/50">
                  <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <p className="text-sm text-ink-muted leading-relaxed">
                {lang === 'ta'
                  ? 'உங்கள் வடிகட்டிகளை அமைத்து "திட்டங்களைத் தேடு" என்பதைக் கிளிக் செய்யவும்'
                  : 'Set your filters above and click "Find Schemes" to discover eligible government schemes.'}
              </p>
            </div>
          </div>
        )}

        {loading && (
          <div className="flex items-center justify-center h-32">
            <div className="flex items-center gap-3 text-sm text-paddy">
              <div className="w-5 h-5 border-2 border-paddy border-t-transparent rounded-full animate-spin" />
              {lang === 'ta' ? 'திட்டங்களை தேடுகிறது...' : 'Searching schemes...'}
            </div>
          </div>
        )}

        {results && results.length === 0 && (
          <div className="text-center py-12">
            <p className="text-sm text-ink-muted">{t.noSchemesFound}</p>
          </div>
        )}

        {results && results.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {results.map((scheme) => (
              <div key={scheme.scheme_id} className="bg-white rounded-xl border border-paddy-light/40 overflow-hidden hover:shadow-md transition-shadow">
                {/* Card header */}
                <div className="px-4 py-3 border-b border-paddy-light/20 flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h3 className="font-display font-semibold text-sm text-paddy-dark leading-snug">
                      {scheme.name}
                    </h3>
                    <span className="text-[10px] font-mono text-ink-muted">{scheme.scheme_id}</span>
                  </div>
                  <div className="flex flex-col items-end gap-1 flex-shrink-0">
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                      getProvider(scheme.scheme_id) === 'state'
                        ? 'bg-turmeric/10 text-turmeric border border-turmeric/20'
                        : 'bg-paddy/10 text-paddy border border-paddy/20'
                    }`}>
                      {getProvider(scheme.scheme_id) === 'state' ? (t.stateScheme) : (t.centralScheme)}
                    </span>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${getMatchColor(scheme.soil_match)}`}>
                      {getMatchLabel(scheme.soil_match)}
                    </span>
                  </div>
                </div>

                {/* Card body */}
                <div className="px-4 py-3 space-y-2.5 text-xs">
                  <div>
                    <span className="font-medium text-ink-muted">{t.benefit}</span>
                    <p className="text-ink mt-0.5 leading-snug">{scheme.benefit}</p>
                  </div>

                  {scheme.soil_recommendation && scheme.soil_recommendation !== 'Applicable to all soil types.' && (
                    <div className="bg-paddy-pale/50 rounded-lg px-3 py-2">
                      <span className="font-medium text-paddy-dark">{t.soilType}:</span>{' '}
                      <span className="text-ink-light">{scheme.soil_recommendation}</span>
                    </div>
                  )}

                  <div>
                    <span className="font-medium text-ink-muted">{t.requiredDocs}</span>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {(scheme.documents_required || []).map((doc, i) => (
                        <span key={i} className="inline-flex items-center gap-1 text-[10px] text-ink-light bg-rice-paper rounded px-1.5 py-0.5 border border-paddy-light/30">
                          <svg width="10" height="10" viewBox="0 0 12 12" className="text-paddy/60 flex-shrink-0">
                            <polyline points="2.5 6 5 8.5 9.5 3.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                          {doc}
                        </span>
                      ))}
                    </div>
                  </div>

                  <button
                    onClick={() => handleGenerateDraft(scheme)}
                    disabled={draftLoading === scheme.scheme_id}
                    className="w-full mt-1 py-2 text-xs font-semibold bg-paddy-dark text-white rounded-lg hover:bg-paddy transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {draftLoading === scheme.scheme_id ? (
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                        <polyline points="14 2 14 8 20 8" />
                        <line x1="12" y1="18" x2="12" y2="12" />
                        <line x1="9" y1="15" x2="15" y2="15" />
                      </svg>
                    )}
                    {t.generateDraft}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Agent trace bar */}
      {agentTrace && (
        <div className="bg-paddy-dark/95 px-5 py-2 border-t border-paddy">
          <p className="text-[11px] text-paddy-light font-mono truncate">
            {agentTrace}
          </p>
        </div>
      )}

      {/* Draft modal */}
      {draftModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 backdrop-blur-sm p-4"
          onClick={(e) => e.target === e.currentTarget && setDraftModal(null)}
        >
          <div className="max-w-lg w-full max-h-[85vh] overflow-y-auto">
            <div className="mb-2 flex justify-end">
              <button
                onClick={() => setDraftModal(null)}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-white/90 text-ink-muted hover:text-ink transition-colors"
              >
                <svg width="16" height="16" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <line x1="4" y1="4" x2="14" y2="14" />
                  <line x1="14" y1="4" x2="4" y2="14" />
                </svg>
              </button>
            </div>
            <ESevaDraft draft={draftModal} lang={lang} />
          </div>
        </div>
      )}
    </div>
  )
}
