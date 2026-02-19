import ManaIcons from './ManaIcons'
import type { DeckSection, ScryfallCard } from '../types'

type Props = {
  commander: ScryfallCard | null
  deckSections: DeckSection[]
  deck: ScryfallCard[]
  deckLoading: boolean
  previewCard: ScryfallCard | null
  setPreviewCard: (card: ScryfallCard | null) => void
  cheapestPriceLabel: (card: ScryfallCard) => string
  isGameChanger: (card: ScryfallCard) => boolean
}

export function DeckView({
  commander,
  deckSections,
  deck,
  deckLoading,
  previewCard,
  setPreviewCard,
  cheapestPriceLabel,
  isGameChanger,
}: Props) {
  if (deckLoading) {
    return <div className="glass rounded-2xl p-4 text-slate-200">Sto componendo la lista...</div>
  }

  if (!deck.length) {
    return (
      <div className="glass rounded-2xl p-4 text-slate-300">
        Genera un mazzo dopo aver pescato un comandante.
      </div>
    )
  }

  return (
    <div className="grid lg:grid-cols-[1.3fr_0.7fr] gap-4">
      <div className="space-y-3">
        <div
          className="glass rounded-2xl p-3 border border-white/10 cursor-pointer"
          onMouseEnter={() => commander && setPreviewCard(commander)}
          onFocus={() => commander && setPreviewCard(commander)}
        >
          <p className="text-xs uppercase tracking-wide text-slate-300 mb-1">Comandante</p>
          <div className="flex items-center justify-between gap-2">
            <div>
              <p className="font-semibold">{commander?.name ?? 'Comandante'}</p>
              <p className="text-sm text-slate-400">Guida del mazzo</p>
            </div>
            <ManaIcons cost={commander?.mana_cost} />
          </div>
        </div>
        {deckSections.map((section) => (
          <div key={section.label} className="glass rounded-2xl p-3 border border-white/10">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-semibold">{section.label}</p>
              <span className="pill glass">{section.entries.reduce((s, e) => s + e.qty, 0)}</span>
            </div>
            <div className="grid sm:grid-cols-2 gap-2">
              {section.entries.map((entry, idx) => (
                <button
                  key={`${section.label}-${entry.card.id}-${idx}`}
                  onMouseEnter={() => setPreviewCard(entry.card)}
                  onFocus={() => setPreviewCard(entry.card)}
                  onMouseLeave={() => setPreviewCard(null)}
                  onBlur={() => setPreviewCard(null)}
                  className="text-left w-full glass rounded-xl p-3 border border-white/10 hover:border-emerald-300/50 transition-colors"
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-semibold leading-tight">
                      {entry.card.name}
                      {isGameChanger(entry.card) && (
                        <span className="ml-2 text-[10px] uppercase tracking-wide bg-amber-500/20 text-amber-100 px-2 py-0.5 rounded-full border border-amber-300/40">
                          Game Changer
                        </span>
                      )}
                      {entry.qty > 1 && <span className="ml-2 text-xs text-slate-300">x{entry.qty}</span>}
                    </p>
                    <ManaIcons cost={entry.card.mana_cost} />
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs text-slate-300 line-clamp-2">{entry.card.type_line}</p>
                    {cheapestPriceLabel(entry.card) && (
                      <span className="text-xs text-emerald-200/80">
                        {cheapestPriceLabel(entry.card)}
                      </span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="glass rounded-2xl p-4 border border-white/10 sticky top-6 h-fit">
        <p className="text-xs uppercase tracking-wide text-slate-300 mb-2">Anteprima carta</p>
        {previewCard ? (
          <div className="space-y-3">
            <div className="rounded-xl overflow-hidden border border-white/10 bg-slate-900">
              {previewCard.image_uris?.large ||
              previewCard.image_uris?.normal ||
              previewCard.image_uris?.art_crop ? (
                <img
                  src={
                    previewCard.image_uris.large ??
                    previewCard.image_uris.normal ??
                    previewCard.image_uris.art_crop
                  }
                  alt={previewCard.name}
                  className="w-full object-cover"
                />
              ) : (
                <div className="h-64 grid place-items-center text-slate-500">Nessuna immagine</div>
              )}
            </div>
            <div>
              <p className="font-semibold text-lg">{previewCard.name}</p>
              <p className="text-sm text-slate-300">{previewCard.type_line}</p>
              {previewCard.oracle_text && (
                <p className="text-sm text-slate-200/80 mt-2 whitespace-pre-line">
                  {previewCard.oracle_text}
                </p>
              )}
            </div>
          </div>
        ) : (
          <p className="text-sm text-slate-300">
            Passa il mouse sulle carte per vedere l&apos;anteprima grande.
          </p>
        )}
      </div>
    </div>
  )
}
