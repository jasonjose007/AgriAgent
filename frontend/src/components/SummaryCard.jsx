import { T } from '../translations'

export default function SummaryCard({ toolCalls, lang }) {
  const t = T[lang]
  if (!toolCalls || toolCalls.length === 0) return null

  const sections = []

  for (const tc of toolCalls) {
    if (tc.tool_name === 'diagnose_crop_disease') {
      sections.push(buildDiagnosisSummary(tc.result))
    }
    if (tc.tool_name === 'match_agri_schemes') {
      sections.push(buildSchemeSummary(tc.result))
    }
    if (tc.tool_name === 'fetch_mandi_and_weather') {
      sections.push(buildMarketSummary(tc.result))
    }
  }

  if (sections.length === 0) return null

  return (
    <div className="bg-white rounded-lg border-2 border-turmeric/30 overflow-hidden">
      <div className="bg-turmeric-pale px-4 py-2.5 border-b border-turmeric/20">
        <h3 className="font-display font-semibold text-sm text-turmeric-DEFAULT flex items-center gap-2">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0">
            <circle cx="12" cy="12" r="10" />
            <path d="M12 16v-4M12 8h.01" />
          </svg>
          {t.summaryTitle}
        </h3>
      </div>
      <div className="px-4 py-3 space-y-4">
        {sections.map((section, i) => (
          <div key={i}>
            {i > 0 && <hr className="border-turmeric/10 mb-4" />}
            <div className="flex items-start gap-2.5">
              <span className="mt-0.5 text-lg flex-shrink-0">{section.icon}</span>
              <div className="space-y-1.5 min-w-0">
                <p className="font-display font-semibold text-sm text-paddy-dark">
                  {section.headline}
                </p>
                <p className="text-sm text-ink leading-relaxed">
                  {section.body}
                </p>
                {section.action && (
                  <p className="text-sm font-medium text-paddy bg-paddy-light/40 rounded-md px-3 py-2 mt-2">
                    {section.action}
                  </p>
                )}
                {section.warning && (
                  <p className="text-sm font-medium text-laterite bg-laterite-light/60 rounded-md px-3 py-2 mt-2">
                    {section.warning}
                  </p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}


function buildDiagnosisSummary(result) {
  if (!result || result.parse_error) {
    return {
      icon: '🔬',
      headline: 'Crop Analysis Complete',
      body: result?.raw_response || 'The image was analyzed but we could not parse a structured diagnosis. Please consult your agriculture officer.',
      action: null,
      warning: null,
    }
  }

  const disease = result.disease_name || 'Unknown condition'
  const crop = result.crop_identified || 'your crop'
  const confidence = result.confidence || ''
  const urgency = result.urgency || ''
  const symptoms = result.symptoms_observed || []

  const isHealthy = disease.toLowerCase().includes('healthy')

  if (isHealthy) {
    return {
      icon: '✅',
      headline: `${crop} looks healthy`,
      body: `No disease detected in the leaf image. Your ${crop.toLowerCase()} appears to be in good condition. Continue your current care practices.`,
      action: 'Keep monitoring your crop regularly. Upload another photo if you notice any changes.',
      warning: null,
    }
  }

  const symptomText = symptoms.length > 0
    ? `Visible signs: ${symptoms.slice(0, 3).join(', ').toLowerCase()}.`
    : ''

  const treatmentText = (result.treatment || []).length > 0
    ? result.treatment.slice(0, 2).join('. ') + '.'
    : 'Consult your local KVK or agriculture officer for treatment.'

  return {
    icon: '🍂',
    headline: `${disease} detected in ${crop}`,
    body: `${symptomText} ${confidence ? `Detection confidence: ${confidence}.` : ''} ${treatmentText}`,
    action: (result.preventive_measures || []).length > 0
      ? `Prevention: ${result.preventive_measures.slice(0, 2).join('. ')}.`
      : null,
    warning: urgency && urgency.toLowerCase().includes('immediate')
      ? `Urgency: ${urgency}. Act quickly to prevent spread to other plants.`
      : null,
  }
}


function buildSchemeSummary(result) {
  const count = result?.total_matches || 0
  const schemes = result?.matched_schemes || []
  const crop = result?.farmer_profile?.crop || 'your crop'
  const acreage = result?.farmer_profile?.acreage_acres || ''
  const region = result?.farmer_profile?.region || ''

  if (count === 0) {
    return {
      icon: '📋',
      headline: 'No matching schemes found',
      body: `We could not find government schemes matching ${crop} in ${region}. This may be because the crop or region is not covered in our current database. Visit your district agriculture office for more options.`,
      action: null,
      warning: null,
    }
  }

  const topScheme = schemes[0]
  const totalBenefitText = schemes
    .slice(0, 2)
    .map((s) => s.name.replace(/\(.*\)/, '').trim())
    .join(', ')

  const docSet = new Set()
  schemes.forEach((s) => (s.documents_required || []).forEach((d) => docSet.add(d)))
  const commonDocs = [...docSet].slice(0, 3)

  return {
    icon: '📋',
    headline: `${count} government scheme${count > 1 ? 's' : ''} found for ${crop} farming${region ? ` in ${region}` : ''}`,
    body: `You may be eligible for ${totalBenefitText}${count > 2 ? `, and ${count - 2} more` : ''}. The top benefit is: ${topScheme.benefit}.`,
    action: `Take these documents to your nearest e-Seva centre or CSC: ${commonDocs.join(', ')}. See the draft cards below for full details.`,
    warning: null,
  }
}


function buildMarketSummary(result) {
  const district = result?.district || 'your district'
  const commodity = result?.commodity || 'your crop'
  const price = result?.market_price
  const weather = result?.weather

  const parts = []

  if (price && price.modal_price) {
    const priceText = `${commodity} is selling at Rs ${price.modal_price} ${price.unit} at ${price.mandi}.`
    const mspText = price.msp_comparison || ''

    parts.push(priceText)
    if (mspText) parts.push(mspText)
  } else if (price?.error) {
    parts.push(`Price data for ${commodity} in ${district} is not available right now.`)
  }

  if (weather && !weather.error) {
    const wx = `Weather in ${district}: ${weather.condition}, ${weather.temperature_c}°C.`
    parts.push(wx)
    if (weather.advisory) parts.push(weather.advisory)
  }

  const isBelowMsp = price?.msp_comparison?.toLowerCase().includes('below')

  return {
    icon: '📊',
    headline: `Market and weather update for ${commodity} in ${district}`,
    body: parts.join(' '),
    action: weather?.forecast_3day ? `3-day forecast: ${weather.forecast_3day}` : null,
    warning: isBelowMsp
      ? 'Market price is below MSP. You may get a better rate by selling through government procurement centres.'
      : null,
  }
}
