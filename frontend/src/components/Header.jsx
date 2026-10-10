import { T } from '../translations'

export default function Header({ lang, onLangChange, onShowArch }) {
  const t = T[lang]

  return (
    <header className="flex items-center justify-between px-5 py-3 border-b border-paddy-light/60 bg-white/70 backdrop-blur-sm">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-paddy flex items-center justify-center text-white text-lg font-display font-bold">
          A
        </div>
        <div>
          <h1 className="font-display font-bold text-paddy-dark text-lg leading-tight">
            {t.appName}
          </h1>
          <p className="text-xs text-ink-muted leading-tight">{t.tagline}</p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={onShowArch}
          className="px-3 py-1.5 text-sm font-medium border border-paddy/30 text-paddy-dark rounded-md hover:bg-paddy-light/50 transition-colors"
        >
          {t.architecture}
        </button>
        <button
          onClick={onLangChange}
          className="px-3 py-1.5 text-sm font-medium bg-turmeric/10 text-turmeric border border-turmeric/20 rounded-md hover:bg-turmeric/20 transition-colors"
        >
          {t.langToggle}
        </button>
      </div>
    </header>
  )
}
