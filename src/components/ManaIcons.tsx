import type { ScryfallCard } from '../types'

const manaSymbolMap: Record<string, string> = {
  W: 'W',
  U: 'U',
  B: 'B',
  R: 'R',
  G: 'G',
  C: 'C',
  X: 'X',
  0: '0',
  1: '1',
  2: '2',
  3: '3',
  4: '4',
  5: '5',
  6: '6',
  7: '7',
  8: '8',
  9: '9',
  10: '10',
  11: '11',
  12: '12',
  13: '13',
  14: '14',
  15: '15',
  16: '16',
  17: '17',
  18: '18',
  19: '19',
  20: '20',
  S: 'S',
  P: 'P',
  '∞': 'INFINITY',
  // hybrid and phyrexian common pairs
  'W/U': 'WU',
  'U/B': 'UB',
  'B/R': 'BR',
  'R/G': 'RG',
  'G/W': 'GW',
  'W/B': 'WB',
  'U/R': 'UR',
  'B/G': 'BG',
  'R/W': 'RW',
  'G/U': 'GU',
  '2/W': '2W',
  '2/U': '2U',
  '2/B': '2B',
  '2/R': '2R',
  '2/G': '2G',
  'W/P': 'WP',
  'U/P': 'UP',
  'B/P': 'BP',
  'R/P': 'RP',
  'G/P': 'GP',
}

function parseManaCost(mana?: string) {
  if (!mana) return []
  const matches = mana.match(/\{([^}]+)\}/g) ?? []
  return matches.map((m) => m.replace('{', '').replace('}', ''))
}

type Props = { cost?: ScryfallCard['mana_cost'] }

export default function ManaIcons({ cost }: Props) {
  if (!cost) return null
  const symbols = parseManaCost(cost)
  return (
    <div className="flex gap-1">
      {symbols.map((sym, idx) => {
        const mapped = manaSymbolMap[sym] ?? sym
        return (
          <img
            key={`${sym}-${idx}`}
            src={`https://svgs.scryfall.io/card-symbols/${encodeURIComponent(mapped)}.svg`}
            alt={sym}
            className="h-4 w-4"
            loading="lazy"
          />
        )
      })}
    </div>
  )
}
