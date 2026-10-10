import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { T } from '../translations'

const DISTRICTS = [
  'Chennai', 'Coimbatore', 'Madurai', 'Thanjavur', 'Tiruchirappalli',
  'Salem', 'Erode', 'Tirunelveli', 'Kanchipuram', 'Vellore',
  'Cuddalore', 'Nagapattinam', 'Dindigul', 'Theni', 'Sivaganga',
]

const SOIL_TYPES = [
  { value: 'alluvial', label: 'Alluvial Soil', desc: 'Rich, fertile — paddy, wheat' },
  { value: 'red_soil', label: 'Red Soil', desc: 'Iron-rich — groundnut, millets' },
  { value: 'black_cotton', label: 'Black Cotton Soil', desc: 'High clay — cotton, sugarcane' },
  { value: 'clay_loam', label: 'Clay Loam', desc: 'Versatile — most crops' },
  { value: 'sandy', label: 'Sandy Soil', desc: 'Low water retention — needs irrigation' },
  { value: 'laterite', label: 'Laterite Soil', desc: 'Hilly areas — needs treatment' },
]

const CROPS = [
  'Paddy', 'Sugarcane', 'Cotton', 'Groundnut', 'Banana',
  'Coconut', 'Turmeric', 'Maize', 'Millets', 'Vegetables',
]

export default function Register({ lang: initialLang, onSwitch }) {
  const [lang, setLang] = useState(initialLang || 'en')
  const t = T[lang]
  const { register } = useAuth()
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    full_name: '', phone_number: '', password: '',
    district: 'Thanjavur', soil_type: 'alluvial', acreage: '',
    primary_crop: 'Paddy', preferred_language: 'English',
  })

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await register({ ...form, acreage: parseFloat(form.acreage) })
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-rice-paper flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-6 relative">
          <button
            onClick={() => setLang(l => l === 'en' ? 'ta' : 'en')}
            className="absolute right-0 top-0 px-3 py-1.5 text-xs font-medium bg-turmeric/10 text-turmeric border border-turmeric/20 rounded-md hover:bg-turmeric/20 transition-colors"
          >
            {lang === 'en' ? 'தமிழ்' : 'English'}
          </button>
          <div className="w-14 h-14 rounded-xl bg-paddy flex items-center justify-center text-white text-2xl font-display font-bold mx-auto mb-3">A</div>
          <h1 className="font-display font-bold text-2xl text-paddy-dark">{t.appName}</h1>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-paddy-light/40 p-6 space-y-3">
          <h2 className="font-display font-semibold text-lg text-paddy-dark">{t.registerTitle}</h2>

          {error && <p className="text-sm text-laterite bg-laterite-light/50 rounded-lg px-3 py-2">{error}</p>}

          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="block text-xs font-medium text-ink-light mb-1">{t.fullName}</label>
              <input value={form.full_name} onChange={set('full_name')} required
                className="w-full px-3 py-2 text-sm border border-paddy-light/50 rounded-lg focus:outline-none focus:border-paddy/50" />
            </div>

            <div>
              <label className="block text-xs font-medium text-ink-light mb-1">{t.phone}</label>
              <input type="tel" value={form.phone_number} onChange={set('phone_number')} required
                className="w-full px-3 py-2 text-sm border border-paddy-light/50 rounded-lg focus:outline-none focus:border-paddy/50"
                placeholder="9876543210" />
            </div>
            <div>
              <label className="block text-xs font-medium text-ink-light mb-1">{t.password}</label>
              <input type="password" value={form.password} onChange={set('password')} required
                className="w-full px-3 py-2 text-sm border border-paddy-light/50 rounded-lg focus:outline-none focus:border-paddy/50" />
            </div>

            <div>
              <label className="block text-xs font-medium text-ink-light mb-1">{t.district}</label>
              <select value={form.district} onChange={set('district')}
                className="w-full px-3 py-2 text-sm border border-paddy-light/50 rounded-lg bg-white focus:outline-none focus:border-paddy/50">
                {DISTRICTS.map((d) => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-ink-light mb-1">{t.acreage}</label>
              <input type="number" step="0.5" min="0.1" value={form.acreage} onChange={set('acreage')} required
                className="w-full px-3 py-2 text-sm border border-paddy-light/50 rounded-lg focus:outline-none focus:border-paddy/50"
                placeholder="4.0" />
            </div>

            <div className="col-span-2">
              <label className="block text-xs font-medium text-ink-light mb-1">{t.soilType}</label>
              <div className="grid grid-cols-3 gap-1.5">
                {SOIL_TYPES.map((s) => (
                  <button key={s.value} type="button" onClick={() => setForm((f) => ({ ...f, soil_type: s.value }))}
                    className={`text-left px-2.5 py-2 rounded-lg border text-xs transition-colors ${
                      form.soil_type === s.value
                        ? 'border-paddy bg-paddy-light/40 text-paddy-dark'
                        : 'border-paddy-light/40 text-ink-light hover:border-paddy/30'
                    }`}>
                    <span className="font-medium block">{s.label}</span>
                    <span className="text-[10px] text-ink-muted">{s.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-ink-light mb-1">{t.primaryCrop}</label>
              <select value={form.primary_crop} onChange={set('primary_crop')}
                className="w-full px-3 py-2 text-sm border border-paddy-light/50 rounded-lg bg-white focus:outline-none focus:border-paddy/50">
                {CROPS.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-ink-light mb-1">{t.language}</label>
              <select value={form.preferred_language} onChange={set('preferred_language')}
                className="w-full px-3 py-2 text-sm border border-paddy-light/50 rounded-lg bg-white focus:outline-none focus:border-paddy/50">
                <option value="English">English</option>
                <option value="Tamil">Tamil</option>
              </select>
            </div>
          </div>

          <button type="submit" disabled={loading}
            className="w-full py-2.5 text-sm font-medium bg-paddy text-white rounded-lg hover:bg-paddy-mid transition-colors disabled:opacity-50 mt-2">
            {loading ? '...' : t.registerBtn}
          </button>

          <p className="text-xs text-center text-ink-muted">
            {t.hasAccount}{' '}
            <button type="button" onClick={onSwitch} className="text-paddy font-medium hover:underline">{t.loginLink}</button>
          </p>
        </form>
      </div>
    </div>
  )
}
