import { T } from '../translations'

export default function SchemeCard({ scheme, lang }) {
  const t = T[lang]

  const handlePrint = () => {
    const el = document.getElementById(`scheme-${scheme.scheme_id}`)
    if (!el) return
    el.classList.add('print-target')
    window.print()
    el.classList.remove('print-target')
  }

  return (
    <div
      id={`scheme-${scheme.scheme_id}`}
      className="relative bg-white rounded-lg border border-paddy-light/50 overflow-hidden"
    >
      <div className="absolute top-3 right-3 -rotate-12 text-[40px] font-display font-bold text-paddy-light/30 select-none pointer-events-none leading-none">
        DRAFT
      </div>

      <div className="bg-paddy-dark px-4 py-2.5 flex items-center justify-between">
        <div>
          <h4 className="font-display font-semibold text-white text-sm">
            {scheme.name}
          </h4>
          <span className="text-[10px] text-paddy-light/80 font-mono">
            {scheme.scheme_id}
          </span>
        </div>
        <button
          onClick={handlePrint}
          className="text-xs text-paddy-light/90 hover:text-white border border-paddy-light/30 rounded px-2 py-1 transition-colors"
        >
          {t.printCard}
        </button>
      </div>

      <div className="px-4 py-3 space-y-3 text-sm relative z-10">
        <div>
          <span className="text-xs font-medium text-ink-muted">{t.status}</span>
          <p className="text-xs mt-0.5 font-medium text-turmeric bg-turmeric-pale rounded px-2 py-1 inline-block">
            {scheme.eligibility_status}
          </p>
        </div>

        <div>
          <span className="text-xs font-medium text-ink-muted">{t.benefit}</span>
          <p className="mt-0.5 text-ink leading-snug">{scheme.benefit}</p>
        </div>

        <div>
          <span className="text-xs font-medium text-ink-muted">{t.requiredDocs}</span>
          <ul className="mt-1 space-y-0.5">
            {scheme.documents_required?.map((doc, i) => (
              <li key={i} className="flex items-start gap-2 text-xs text-ink-light">
                <span className="mt-1 w-1 h-1 rounded-full bg-paddy/40 flex-shrink-0" />
                {doc}
              </li>
            ))}
          </ul>
        </div>

        {scheme.apply_url && (
          <div className="pt-1 border-t border-paddy-light/30">
            <span className="text-xs font-medium text-ink-muted">{t.applyAt}</span>
            <a
              href={scheme.apply_url}
              target="_blank"
              rel="noopener noreferrer"
              className="block text-xs text-paddy hover:underline underline-offset-2 mt-0.5 break-all"
            >
              {scheme.apply_url}
            </a>
          </div>
        )}
      </div>
    </div>
  )
}
