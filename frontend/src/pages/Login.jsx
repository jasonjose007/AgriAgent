import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { T } from '../translations'

export default function Login({ lang: initialLang, onSwitch }) {
  const [lang, setLang] = useState(initialLang || 'en')
  const t = T[lang]
  const { login } = useAuth()
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(phone, password)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-rice-paper flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8 relative">
          <button
            onClick={() => setLang(l => l === 'en' ? 'ta' : 'en')}
            className="absolute right-0 top-0 px-3 py-1.5 text-xs font-medium bg-turmeric/10 text-turmeric border border-turmeric/20 rounded-md hover:bg-turmeric/20 transition-colors"
          >
            {lang === 'en' ? 'தமிழ்' : 'English'}
          </button>
          <div className="w-14 h-14 rounded-xl bg-paddy flex items-center justify-center text-white text-2xl font-display font-bold mx-auto mb-3">
            A
          </div>
          <h1 className="font-display font-bold text-2xl text-paddy-dark">{t.appName}</h1>
          <p className="text-sm text-ink-muted mt-1">{t.tagline}</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-paddy-light/40 p-6 space-y-4">
          <h2 className="font-display font-semibold text-lg text-paddy-dark">{t.loginTitle}</h2>

          {error && (
            <p className="text-sm text-laterite bg-laterite-light/50 rounded-lg px-3 py-2">{error}</p>
          )}

          <div>
            <label className="block text-xs font-medium text-ink-light mb-1">{t.phone}</label>
            <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-paddy-light/50 rounded-lg focus:outline-none focus:border-paddy/50 focus:ring-1 focus:ring-paddy/20"
              placeholder="9876543210" required />
          </div>

          <div>
            <label className="block text-xs font-medium text-ink-light mb-1">{t.password}</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-paddy-light/50 rounded-lg focus:outline-none focus:border-paddy/50 focus:ring-1 focus:ring-paddy/20"
              placeholder="****" required />
          </div>

          <button type="submit" disabled={loading}
            className="w-full py-2.5 text-sm font-medium bg-paddy text-white rounded-lg hover:bg-paddy-mid transition-colors disabled:opacity-50">
            {loading ? '...' : t.loginBtn}
          </button>

          <p className="text-xs text-center text-ink-muted">
            {t.noAccount}{' '}
            <button type="button" onClick={onSwitch} className="text-paddy font-medium hover:underline">
              {t.registerLink}
            </button>
          </p>
        </form>
      </div>
    </div>
  )
}
