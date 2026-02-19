import type { Role, ScryfallCard } from '../types'

type Props = {
  roleSummary: { target: Record<Role, number>; current: Record<Role, number> } | null
  swapSuggestions: { role: Role; needed: number; candidates: ScryfallCard[] }[]
  swapIn: (card: ScryfallCard) => void
  exportText: (format: 'txt' | 'csv' | 'moxfield' | 'json') => void
  deckLoading: boolean
  deckLength: number
}

export function SuggestionsPanel({
  roleSummary,
  swapSuggestions,
  swapIn,
  exportText,
  deckLoading,
  deckLength,
}: Props) {
  if (deckLoading || !roleSummary) return null

  return (
    <div className="glass rounded-2xl p-4 border border-white/10">
      <p className="text-sm font-semibold mb-2">Suggerimenti IA (delta ruoli)</p>
      <p className="text-xs text-slate-300 mb-3">
        Calcolati sul gap tra target per bracket e carte presenti (ramp/draw/removal/protection/wincon).
        Le proposte sotto mostrano i primi candidati economici per colmare ogni ruolo.
      </p>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
        {(['ramp', 'draw', 'removal', 'protection', 'wincon'] as Role[]).map((r) => {
          const cur = roleSummary.current[r] ?? 0
          const tgt = roleSummary.target[r] ?? 0
          const diff = tgt - cur
          const color =
            diff > 0
              ? 'text-amber-200 bg-amber-400/10 border-amber-400/30'
              : 'text-emerald-200 bg-emerald-400/10 border-emerald-400/30'
          return (
            <div key={r} className={`glass rounded-xl px-3 py-2 border ${color}`}>
              <div className="flex justify-between text-sm font-semibold capitalize">
                <span>{r}</span>
                <span>
                  {cur}/{tgt || 'â€”'}
                </span>
              </div>
              {diff > 0 ? <p className="text-xs opacity-80">Manca {diff} slot</p> : <p className="text-xs opacity-80">OK</p>}
            </div>
          )
        })}
      </div>
      {swapSuggestions.length > 0 && (
        <div className="mt-3 space-y-2">
          {swapSuggestions.map((sugg) => (
            <div key={sugg.role} className="glass rounded-xl p-3 border border-white/10">
              <p className="text-sm font-semibold mb-2">Mancano {sugg.needed} per {sugg.role}</p>
              <div className="flex flex-wrap gap-2">
                {sugg.candidates.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => swapIn(c)}
                    className="glass px-3 py-2 rounded-lg border border-emerald-300/40 hover:border-emerald-200 transition-colors text-left"
                    title={c.oracle_text ?? c.type_line}
                  >
                    <p className="text-sm font-semibold">{c.name}</p>
                    <p className="text-xs text-slate-300 line-clamp-2">{c.type_line}</p>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
      {deckLength > 0 && (
        <div className="flex flex-wrap gap-2 mt-3 text-sm">
          <button onClick={() => exportText('txt')} className="px-3 py-2 rounded-lg glass border border-white/20">
            Export TXT
          </button>
          <button onClick={() => exportText('csv')} className="px-3 py-2 rounded-lg glass border border-white/20">
            Export CSV
          </button>
          <button onClick={() => exportText('moxfield')} className="px-3 py-2 rounded-lg glass border border-white/20">
            Export Moxfield
          </button>
          <button onClick={() => exportText('json')} className="px-3 py-2 rounded-lg glass border border-white/20">
            Export JSON
          </button>
        </div>
      )}
    </div>
  )
}
