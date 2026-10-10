import { T } from '../translations'

export default function ESevaDraft({ draft, lang }) {
  const t = T[lang]
  if (!draft) return null

  const handlePrint = () => window.print()

  return (
    <div className="print-target bg-white rounded-lg border-2 border-paddy/30 overflow-hidden">
      <div className="bg-paddy-dark px-4 py-3 flex items-center justify-between">
        <div>
          <h4 className="font-display font-bold text-white text-sm">{t.esevaDraft}</h4>
          <span className="text-[10px] text-paddy-light/80">{draft.scheme?.id}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono text-turmeric-light bg-turmeric/20 px-2 py-0.5 rounded">
            {draft.status}
          </span>
          <button onClick={handlePrint}
            className="text-xs text-paddy-light/90 hover:text-white border border-paddy-light/30 rounded px-2 py-1">
            {t.printCard}
          </button>
        </div>
      </div>

      <div className="px-4 py-4 space-y-4 text-sm">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <span className="text-xs font-medium text-ink-muted">Applicant Name</span>
            <p className="font-medium text-ink mt-0.5">{draft.applicant?.name}</p>
          </div>
          <div>
            <span className="text-xs font-medium text-ink-muted">District</span>
            <p className="font-medium text-ink mt-0.5">{draft.applicant?.district}</p>
          </div>
        </div>

        <div>
          <span className="text-xs font-medium text-ink-muted">Scheme</span>
          <p className="font-medium text-paddy-dark mt-0.5">{draft.scheme?.name}</p>
        </div>

        <div>
          <span className="text-xs font-medium text-ink-muted">{t.docChecklist}</span>
          <div className="mt-1.5 space-y-1">
            {(draft.document_checklist || []).map((doc, i) => (
              <label key={i} className="flex items-center gap-2 text-xs text-ink-light">
                <input type="checkbox" className="rounded border-paddy-light accent-paddy" />
                {doc.document}
                <span className={`ml-auto text-[10px] font-medium px-1.5 py-0.5 rounded ${
                  doc.status === 'PENDING' ? 'bg-turmeric-light text-turmeric' : 'bg-paddy-light text-paddy'
                }`}>
                  {doc.status}
                </span>
              </label>
            ))}
          </div>
        </div>

        <div>
          <span className="text-xs font-medium text-ink-muted">{t.nextSteps}</span>
          <ol className="mt-1.5 space-y-1">
            {(draft.instructions || []).map((step, i) => (
              <li key={i} className="text-xs text-ink-light leading-snug">{step}</li>
            ))}
          </ol>
        </div>

        <p className="text-[10px] text-ink-muted italic border-t border-paddy-light/30 pt-2">
          {draft.disclaimer}
        </p>
      </div>
    </div>
  )
}
