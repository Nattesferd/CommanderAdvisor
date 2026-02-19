import type { ScryfallCard } from "../types"

type HeroProps = {
  commander: ScryfallCard | null
  loadingCommander: boolean
  colorFilter: string
  colorGroups: {
    label: string
    options: { value: string; label: string; symbols: string[] }[]
  }[]
  onColorChange: (value: string) => void
  onDraw: () => void
  commanderQuery: string
  onCommanderQueryChange: (value: string) => void
  commanderResults: ScryfallCard[]
  onChooseCommander: (card: ScryfallCard) => void
}

export function HeroSection({
  commander,
  loadingCommander,
  colorFilter,
  colorGroups,
  onColorChange,
  onDraw,
  commanderQuery,
  onCommanderQueryChange,
  commanderResults,
  onChooseCommander,
}: HeroProps) {
  return (
    <div className="relative grid lg:grid-cols-[1.05fr_0.95fr] gap-8 lg:gap-10 items-start">
      <div className="space-y-4">
        <p className="pill bg-sky-400/10 text-sky-100 border border-sky-300/30 inline-block">
          Preview prototipo
        </p>
        <h1 className="text-4xl md:text-5xl font-semibold leading-tight">
          Costruisci il tuo mazzo Commander con suggerimenti dinamici
        </h1>
        <p className="text-slate-200/80 max-w-2xl">
          Peschiamo un comandante casuale da Scryfall e proponiamo carte sinergiche basate
          sull'identità di colore usando il ranking EDH. L'IA potrà raffinarsi con dati da EDHREC
          e valutazioni di potenza per creare liste sempre più curate.
        </p>
        <div className="flex flex-wrap gap-3 items-center">
          <button
            onClick={onDraw}
            disabled={loadingCommander}
            className="px-5 py-3 rounded-2xl bg-gradient-to-r from-sky-400 via-indigo-500 to-emerald-400 font-semibold shadow-lg shadow-indigo-900/30 disabled:opacity-60"
          >
            {loadingCommander ? 'Sto pescando...' : 'Pesca un comandante'}
          </button>
          <a
            href={commander?.related_uris?.edhrec ?? 'https://edhrec.com'}
            target="_blank"
            rel="noreferrer"
            className="px-5 py-3 rounded-2xl glass font-semibold"
          >
            Apri scheda su EDHREC
          </a>
        </div>

        <div className="flex flex-wrap gap-3 items-center">
          <label className="text-sm text-slate-200 flex items-center gap-2">
            <span className="text-slate-300">Filtro colori (solo pesca casuale):</span>
            <select
              value={colorFilter}
              onChange={(e) => onColorChange(e.target.value)}
              className="glass rounded-xl px-3 py-2 text-sm border-white/20 bg-slate-900/70 focus:border-emerald-300/60 min-w-[200px]"
            >
              {colorGroups.map((group) => (
                <optgroup key={group.label} label={group.label}>
                  {group.options.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          </label>
        </div>

        <div className="space-y-2 pt-1">
          <p className="text-sm text-slate-200">
            Oppure scegli tu il comandante (solo creature leggendarie legali):
          </p>
          <div className="glass rounded-xl px-4 py-2.5 bg-slate-900/75 border border-white/12 shadow-inner focus-within:border-emerald-300/70 focus-within:shadow-emerald-500/10 transition-colors">
            <input
              value={commanderQuery}
              onChange={(e) => onCommanderQueryChange(e.target.value)}
              placeholder="Es. Atraxa, Alela, Korvold..."
              className="w-full bg-transparent outline-none text-slate-100 placeholder:text-slate-400 text-sm"
              style={{ caretColor: '#6ee7b7' }}
            />
          </div>
          {commanderResults.length > 0 && (
            <div className="grid sm:grid-cols-2 gap-2">
              {commanderResults.map((card) => (
                <button
                  key={card.id}
                  onClick={() => onChooseCommander(card)}
                  className="glass rounded-xl p-3 text-left border border-white/10 hover:border-emerald-300/50 transition-colors"
                >
                  <div className="flex gap-3">
                    <div className="h-14 w-10 rounded-md overflow-hidden bg-slate-900 border border-white/10">
                      {card.image_uris?.art_crop ? (
                        <img src={card.image_uris.art_crop} alt={card.name} className="h-full w-full object-cover" />
                      ) : (
                        <div className="h-full w-full grid place-items-center text-[10px] text-slate-400">img</div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold truncate">{card.name}</p>
                      <p className="text-xs text-slate-300 line-clamp-2">{card.type_line}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
