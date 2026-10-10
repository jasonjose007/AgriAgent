import { useAuth } from '../context/AuthContext'
import { T } from '../translations'

export default function Header({ lang, onLangChange, onShowArch }) {
  const t = T[lang]
  const { user, logout } = useAuth()

  return (
    <header className="flex items-center justify-between px-5 py-3 border-b border-paddy-light/60 bg-white/70 backdrop-blur-sm">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-paddy flex items-center justify-center text-white text-lg font-display font-bold">A</div>
        <div>
          <h1 className="font-display font-bold text-paddy-dark text-lg leading-tight">{t.appName}</h1>
          <p className="text-xs text-ink-muted leading-tight">{t.tagline}</p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {user && (
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-paddy-pale rounded-lg border border-paddy-light/40 text-xs text-paddy-dark">
            <span className="font-semibold">{user.full_name}</span>
            <span className="text-ink-muted">|</span>
            <span>{user.district}</span>
            <span className="text-ink-muted">|</span>
            <span className="capitalize">{user.soil_type?.replace('_', ' ')}</span>
          </div>
        )}
        <button onClick={onShowArch}
          className="px-3 py-1.5 text-sm font-medium border border-paddy/30 text-paddy-dark rounded-md hover:bg-paddy-light/50 transition-colors">
          {t.architecture}
        </button>
        <button onClick={onLangChange}
          className="px-3 py-1.5 text-sm font-medium bg-turmeric/10 text-turmeric border border-turmeric/20 rounded-md hover:bg-turmeric/20 transition-colors">
          {t.langToggle}
        </button>
        {user && (
          <button onClick={logout}
            className="px-3 py-1.5 text-sm font-medium text-ink-muted border border-ink-muted/20 rounded-md hover:bg-laterite/10 hover:text-laterite hover:border-laterite/30 transition-colors">
            {t.logout}
          </button>
        )}
      </div>
    </header>
  )
}
