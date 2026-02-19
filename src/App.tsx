import { useEffect, useMemo, useState } from 'react'

type ScryfallCard = {
  id: string
  name: string
  type_line: string
  oracle_text?: string
  mana_cost?: string
  prices?: {
    usd?: string
    usd_foil?: string
    eur?: string
  }
  color_identity: string[]
  image_uris?: {
    small?: string
    normal?: string
    art_crop?: string
    large?: string
  }
  related_uris?: {
    edhrec?: string
  }
}

const colorStyling: Record<string, string> = {
  W: 'bg-amber-200/15 text-amber-100 border border-amber-300/40',
  U: 'bg-sky-200/15 text-sky-100 border border-sky-300/40',
  B: 'bg-slate-200/15 text-slate-100 border border-slate-300/40',
  R: 'bg-rose-200/20 text-rose-100 border border-rose-300/40',
  G: 'bg-emerald-200/15 text-emerald-100 border border-emerald-300/40',
  C: 'bg-white/10 text-white border border-white/20',
}

type SuggestionsState = {
  cards: ScryfallCard[]
  loading: boolean
}

type DeckSection = {
  label: string
  entries: DeckEntry[]
}

type DeckEntry = {
  card: ScryfallCard
  qty: number
}

const initialSuggestions: SuggestionsState = { cards: [], loading: false }
const basicCache = new Map<string, ScryfallCard>()

const archetypes = [
  { value: 'auto', label: "Lascia decidere all'IA (EDHREC rank)" },
  { value: 'blink', label: 'Blink / Flicker' },
  { value: 'landfall', label: 'Landfall / Ramp' },
  { value: 'counters', label: '+1/+1 Counters / Proliferate' },
  { value: 'spells', label: 'Spellslinger / Prowess' },
  { value: 'tokens', label: 'Token / Go-wide' },
  { value: 'artifacts', label: 'Artefatti / Treasures' },
  { value: 'aristocrats', label: 'Aristocrats / Sacrificio' },
  { value: 'voltron', label: 'Voltron / Auras & Equip' },
  { value: 'control', label: 'Control / Stax soft' },
  { value: 'reanimator', label: 'Reanimator / Graveyard' },
  { value: 'lifegain', label: 'Lifegain / Soul Sisters' },
  { value: 'wheels', label: 'Wheels / Draw-seven' },
  { value: 'mill', label: 'Mill / Self-mill' },
  { value: 'infect', label: 'Infect / Toxic' },
  { value: 'storm', label: 'Storm / Spells combo' },
  { value: 'group-hug', label: 'Group Hug / Politics' },
  { value: 'chaos', label: 'Chaos / RNG' },
]

const brackets = [
  { value: '1', label: 'Bracket 1 – Exhibition (ultra casual)' },
  { value: '2', label: 'Bracket 2 – Core (precon/9+ turn)' },
  { value: '3', label: 'Bracket 3 – Upgraded' },
  { value: '4', label: 'Bracket 4 – Optimized' },
  { value: '5', label: 'Bracket 5 – cEDH' },
]

const priceRanges = [
  { value: '0-50', label: 'Budget: 0 - 50$' },
  { value: '50-150', label: 'Budget: 50 - 150$' },
  { value: '150-300', label: 'Budget: 150 - 300$' },
  { value: 'nobudget', label: 'Nessun budget' },
]

const colorGroups = [
  {
    label: 'Qualsiasi',
    options: [{ value: 'any', label: 'Qualsiasi identità', symbols: [] }],
  },
  {
    label: 'Mono colore',
    options: [
      { value: 'w', label: 'Mono Bianco', symbols: ['W'] },
      { value: 'u', label: 'Mono Blu', symbols: ['U'] },
      { value: 'b', label: 'Mono Nero', symbols: ['B'] },
      { value: 'r', label: 'Mono Rosso', symbols: ['R'] },
      { value: 'g', label: 'Mono Verde', symbols: ['G'] },
    ],
  },
  {
    label: 'Bicolore (Guild)',
    options: [
      { value: 'wu', label: 'Azorius (WU)', symbols: ['W', 'U'] },
      { value: 'ub', label: 'Dimir (UB)', symbols: ['U', 'B'] },
      { value: 'br', label: 'Rakdos (BR)', symbols: ['B', 'R'] },
      { value: 'rg', label: 'Gruul (RG)', symbols: ['R', 'G'] },
      { value: 'gw', label: 'Selesnya (GW)', symbols: ['G', 'W'] },
      { value: 'wb', label: 'Orzhov (WB)', symbols: ['W', 'B'] },
      { value: 'ur', label: 'Izzet (UR)', symbols: ['U', 'R'] },
      { value: 'bg', label: 'Golgari (BG)', symbols: ['B', 'G'] },
      { value: 'rw', label: 'Boros (RW)', symbols: ['R', 'W'] },
      { value: 'gu', label: 'Simic (GU)', symbols: ['G', 'U'] },
    ],
  },
  {
    label: 'Tricolore (Shard / Wedge)',
    options: [
      { value: 'wub', label: 'Esper (WUB)', symbols: ['W', 'U', 'B'] },
      { value: 'ubr', label: 'Grixis (UBR)', symbols: ['U', 'B', 'R'] },
      { value: 'brg', label: 'Jund (BRG)', symbols: ['B', 'R', 'G'] },
      { value: 'rgw', label: 'Naya (RGW)', symbols: ['R', 'G', 'W'] },
      { value: 'gwu', label: 'Bant (GWU)', symbols: ['G', 'W', 'U'] },
      { value: 'wbg', label: 'Abzan (WBG)', symbols: ['W', 'B', 'G'] },
      { value: 'urw', label: 'Jeskai (URW)', symbols: ['U', 'R', 'W'] },
      { value: 'bgu', label: 'Sultai (BGU)', symbols: ['B', 'G', 'U'] },
      { value: 'rwb', label: 'Mardu (RWB)', symbols: ['R', 'W', 'B'] },
      { value: 'gwr', label: 'Temur (GWR)', symbols: ['G', 'W', 'R'] },
    ],
  },
  {
    label: 'Quadracolore (Sans)',
    options: [
      { value: 'ubrg', label: 'Non-White – Yore-Tiller (UBRG)', symbols: ['U', 'B', 'R', 'G'] },
      { value: 'brgw', label: 'Non-Blue – Dune-Brood (BRGW)', symbols: ['B', 'R', 'G', 'W'] },
      { value: 'rgwu', label: 'Non-Black – Ink-Treader (RGWU)', symbols: ['R', 'G', 'W', 'U'] },
      { value: 'gwub', label: 'Non-Red – Witch-Maw (GWUB)', symbols: ['G', 'W', 'U', 'B'] },
      { value: 'wubr', label: 'Non-Green – Glint-Eye (WUBR)', symbols: ['W', 'U', 'B', 'R'] },
    ],
  },
  {
    label: 'Cinque / Incolore',
    options: [
      { value: 'wubrg', label: 'Cinque colori', symbols: ['W', 'U', 'B', 'R', 'G'] },
      { value: 'c', label: 'Incolore', symbols: ['C'] },
    ],
  },
]

type Role = 'ramp' | 'draw' | 'removal' | 'protection' | 'wincon' | 'land' | 'value'

function App() {
  const [commander, setCommander] = useState<ScryfallCard | null>(null)
  const [suggestions, setSuggestions] = useState<SuggestionsState>(initialSuggestions)
  const [loadingCommander, setLoadingCommander] = useState(false)
  const [deckLoading, setDeckLoading] = useState(false)
  const [deck, setDeck] = useState<ScryfallCard[]>([])
  const [deckSections, setDeckSections] = useState<DeckSection[]>([])
  const [previewCard, setPreviewCard] = useState<ScryfallCard | null>(null)
  const [archetype, setArchetype] = useState<string>('auto')
  const [bracket, setBracket] = useState<string>('2')
  const [priceRange, setPriceRange] = useState<string>('0-50')
  const [commanderQuery, setCommanderQuery] = useState<string>('')
  const [commanderResults, setCommanderResults] = useState<ScryfallCard[]>([])
  const [colorFilter, setColorFilter] = useState<string>('any')
  const [error, setError] = useState<string | null>(null)
  const [roleSummary, setRoleSummary] = useState<{
    target: Record<Role, number>
    current: Record<Role, number>
  } | null>(null)
  const [swapSuggestions, setSwapSuggestions] = useState<
    { role: Role; needed: number; candidates: ScryfallCard[] }[]
  >([])

  const colorIdentityLabel = useMemo(() => {
    if (!commander) return 'Colore: -'
    if (!commander.color_identity.length) return 'Incolore'
    return commander.color_identity.join(' • ')
  }, [commander])

  useEffect(() => {
    if (commander) setPreviewCard(commander)
  }, [commander])

  useEffect(() => {
    const id = setTimeout(() => {
      searchCommander()
    }, 400)
    return () => clearTimeout(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [commanderQuery])

  useEffect(() => {
    drawCommander()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function drawCommander() {
    setError(null)
    setLoadingCommander(true)
    setSuggestions(initialSuggestions)
    setDeck([])
    setDeckSections([])
    setRoleSummary(null)

    try {
      const colorClause =
        colorFilter === 'any'
          ? ''
          : colorFilter === 'c'
            ? ' id:c'
            : ` id:${colorFilter.replace(/,/g, '')}`
      const query = `is:commander legal:commander game:paper type:legendary -type:scheme -type:plane -type:vanguard${colorClause}`
      const res = await fetch(
        `https://api.scryfall.com/cards/random?q=${encodeURIComponent(query)}`,
      )
      if (!res.ok) {
        throw new Error('Scryfall non ha risposto come previsto')
      }
      const data: ScryfallCard = await res.json()
      setCommander(data)
      setPreviewCard(data)
      fetchSuggestions(data.color_identity, data.id)
    } catch (err) {
      console.error(err)
      setError('Non sono riuscito a pescare un comandante. Riprova.')
    } finally {
      setLoadingCommander(false)
    }
  }

  async function searchCommander() {
    if (commanderQuery.trim().length < 2) {
      setCommanderResults([])
      return
    }
    setError(null)
    try {
      const query = `is:commander legal:commander game:paper type:legendary ${commanderQuery}`
      const res = await fetch(
        `https://api.scryfall.com/cards/search?order=edhrec&unique=cards&q=${encodeURIComponent(query)}`,
      )
      if (!res.ok) throw new Error('Ricerca fallita')
      const data = await res.json()
      setCommanderResults((data.data ?? []).slice(0, 8))
    } catch (err) {
      console.error(err)
      setError('Non riesco a cercare quel comandante.')
    }
  }

  function chooseCommander(card: ScryfallCard) {
    setCommander(card)
    setPreviewCard(card)
    setDeck([])
    setDeckSections([])
    fetchSuggestions(card.color_identity, card.id)
  }

  async function fetchSuggestions(colors: string[], commanderId?: string) {
    setSuggestions({ cards: [], loading: true })

    try {
      const colorParam = (colors.length ? colors.join('') : 'C').toLowerCase()
      const query = [
        'legal:commander',
        'game:paper',
        `id:${colorParam}`,
        '-type:land',
        '-type:scheme',
        '-type:plane',
        '-type:vanguard',
        'order:edhrec',
      ].join(' ')

      const res = await fetch(
        `https://api.scryfall.com/cards/search?order=edhrec&unique=cards&q=${encodeURIComponent(query)}`,
      )
      if (!res.ok) {
        throw new Error('Suggerimenti non disponibili')
      }
      const data = await res.json()
      const filtered: ScryfallCard[] = (data.data ?? []).filter(
        (card: ScryfallCard) => card.id !== commanderId,
      )

      setSuggestions({
        cards: filtered.slice(0, 8),
        loading: false,
      })
    } catch (err) {
      console.error(err)
      setSuggestions({ cards: [], loading: false })
      setError('API Scryfall momentaneamente non disponibile.')
    }
  }

  async function fetchPool(query: string, cap = 400): Promise<ScryfallCard[]> {
    const collected: ScryfallCard[] = []
    let url = `https://api.scryfall.com/cards/search?order=edhrec&unique=cards&q=${encodeURIComponent(query)}`
    try {
      while (url && collected.length < cap) {
        // eslint-disable-next-line no-await-in-loop
        const res = await fetch(url)
        if (!res.ok) break
        // eslint-disable-next-line no-await-in-loop
        const data = await res.json()
        collected.push(...(data.data ?? []))
        url = data.has_more ? data.next_page : null
      }
    } catch (err) {
      console.error('pool fetch error', err)
    }
    return collected
  }

function archetypeQuery(value: string) {
  switch (value) {
    case 'blink':
      return '(oracle:"blink" OR oracle:"flicker" OR oracle:"exile and return")'
    case 'landfall':
        return 'keyword:landfall'
      case 'counters':
        return '(keyword:proliferate OR keyword:"+1/+1 counter" OR oracle:"+1/+1 counters")'
      case 'spells':
        return '(type:instant OR type:sorcery) oracle:"draw"'
      case 'tokens':
        return '(token OR oracle:"create a token")'
    case 'artifacts':
      return 'type:artifact'
    case 'aristocrats':
      return '(oracle:"sacrifice" OR oracle:"dies" OR "whenever a creature dies")'
    case 'voltron':
      return '(aura OR equipment) type:creature'
    case 'control':
      return '(counterspell OR stax OR tax OR tap all creatures)'
    case 'reanimator':
      return '(reanimate OR return target creature card from your graveyard)'
    case 'lifegain':
      return 'oracle:"gain life"'
    case 'wheels':
      return '(oracle:\"each player discards\" OR oracle:\"draw seven\")'
    case 'mill':
      return '(mill OR oracle:"put the top")'
    case 'infect':
      return 'keyword:infect'
    case 'storm':
      return 'keyword:storm'
    case 'group-hug':
      return '(each player may OR each player draws)'
    case 'chaos':
      return 'random'
    default:
      return ''
  }
}

function isType(card: ScryfallCard, keyword: string) {
  return card.type_line.toLowerCase().includes(keyword)
}

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

function priceCapValue(range: string) {
  switch (range) {
    case '0-50':
      return 2.5
    case '50-150':
      return 5
    case '150-300':
      return 8
    default:
      return Infinity
  }
}

function totalBudget(range: string) {
  switch (range) {
    case '0-50':
      return 50
    case '50-150':
      return 150
    case '150-300':
      return 300
    default:
      return Infinity
  }
}

function isBasicLandCard(card: ScryfallCard) {
  const line = card.type_line.toLowerCase()
  return line.includes('basic land')
}

function cardPrice(card: ScryfallCard): number | null {
  const raw = [card.prices?.usd, card.prices?.usd_foil, card.prices?.eur]
    .map((p) => (p ? parseFloat(p) : NaN))
    .filter((n) => !Number.isNaN(n) && n > 0)
  if (raw.length) return Math.min(...raw)
  if (isBasicLandCard(card)) return 0
  return null
}

function cheapestPriceLabel(card: ScryfallCard) {
  const value = cardPrice(card)
  if (value === null) return ''
  return value >= 1 ? `$${value.toFixed(2)}` : `$${value.toFixed(3)}`
}

const gameChangerNames = new Set(
  [
    'mana crypt',
    'mana vault',
    'jeweled lotus',
    'dockside extortionist',
    'fierce guardianship',
    'force of will',
    'timetwister',
    'time warp',
    'expropriate',
    'cyclonic rift',
    'urza\'s saga',
    'gai\'s cradle',
  ].map((n) => n.toLowerCase()),
)

function isGameChanger(card: ScryfallCard) {
  const name = card.name.toLowerCase()
  if (gameChangerNames.has(name)) return true
  const text = (card.oracle_text ?? '').toLowerCase()
  return (
    text.includes('extra turn') ||
    text.includes('win the game') ||
    text.includes('infinite') ||
    text.includes('tutor') ||
    text.includes('add three') ||
    text.includes('add four')
  )
}

  function priceLabel(range: string) {
    const found = priceRanges.find((p) => p.value === range)
    return found ? found.label : range
  }

  function exportText(format: 'txt' | 'csv' | 'moxfield' | 'json') {
    if (!commander) return
    const lines: string[] = []
    if (format === 'moxfield') {
      lines.push(`1 ${commander.name} *CMDR*`)
    } else {
      lines.push(`# Commander Advisor list for ${commander.name}`)
      lines.push(`# Archetype: ${archetype}, Bracket: ${bracket}, Budget: ${priceRange}`)
      lines.push(`1 ${commander.name} (Commander)`)
    }
    deckSections.forEach((section) => {
      section.entries.forEach((entry) => {
        const line = `${entry.qty} ${entry.card.name}`
        lines.push(line)
      })
    })
    if (format === 'json') {
      const payload = {
        commander: commander.name,
        mainboard: deckSections.flatMap((s) =>
          s.entries.map((e) => ({ name: e.card.name, count: e.qty })),
        ),
      }
      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'commander-advisor.json'
      a.click()
      URL.revokeObjectURL(url)
      return
    }

    const blob =
      format === 'csv'
        ? new Blob([lines.map((l) => `"${l.replace(/"/g, '""')}"`).join('\n')], {
            type: 'text/csv',
          })
        : new Blob([lines.join('\n')], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download =
      format === 'csv'
        ? 'commander-advisor.csv'
        : format === 'moxfield'
          ? 'commander-advisor-moxfield.txt'
          : 'commander-advisor.txt'
    a.click()
    URL.revokeObjectURL(url)
  }

  function swapIn(card: ScryfallCard) {
    setDeck((prev) => {
      if (!prev.length) return prev
      const exists = prev.find((c) => c.name === card.name)
      if (exists) return prev
      const replaced = [...prev]
      replaced.pop()
      replaced.push(card)
      setDeckSections(groupDeck(replaced))
      return replaced
    })
  }

function landColorScore(card: ScryfallCard, commanderColors: string[]) {
  if (!isType(card, 'land')) return 0
  const landColors = card.color_identity ?? []
  const shared = landColors.filter((c) => commanderColors.includes(c)).length
  const hasAll = commanderColors.length && shared === commanderColors.length ? 2 : 0
  const triomeBoost = card.type_line.toLowerCase().includes('triome') ? 2 : 0
  const dualBoost = shared >= 2 ? 1 : 0
  return shared + hasAll + triomeBoost + dualBoost
}

function isForbidden(card: ScryfallCard, bracket: string) {
  if (['4', '5'].includes(bracket)) return false
  const text = `${card.type_line} ${card.oracle_text ?? ''}`.toLowerCase()
  const noTurns = text.includes('extra turn')
  const noTutors = text.includes('search your library') || text.includes('tutor')
  const noMld = text.includes('destroy all lands') || text.includes('sacrifice all lands')
  const fastMana =
    text.includes('add three mana') ||
    text.includes('add {c}{c}{c}') ||
    text.includes('mana vault') ||
    text.includes('mana crypt') ||
    text.includes('jeweled lotus')
  return noTurns || noTutors || noMld || fastMana
}

function classifyRole(card: ScryfallCard): Role {
  if (isType(card, 'land')) return 'land'
  const text = `${card.type_line} ${card.oracle_text ?? ''}`.toLowerCase()
  if (text.includes('add {') || text.includes('search your library for a land') || text.includes('mana pool'))
    return 'ramp'
  if (text.includes('draw a card') || text.includes('draw two cards') || text.includes('each player draws'))
    return 'draw'
  if (
    text.includes('destroy target') ||
    text.includes('exile target') ||
    text.includes('counter target') ||
    text.includes('fight target') ||
    text.includes('sacrifice target')
  )
    return 'removal'
  if (text.includes('hexproof') || text.includes('indestructible') || text.includes('phase out') || text.includes('counter target spell'))
    return 'protection'
  return 'value'
}

function ManaIcons({ cost }: { cost?: string }) {
  const symbols = parseManaCost(cost)
  if (!symbols.length) return null
  return (
    <div className="flex flex-wrap gap-1">
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

  function groupDeck(list: ScryfallCard[]): DeckSection[] {
    const sections: { label: string; match: (c: ScryfallCard) => boolean }[] = [
      { label: 'Creature', match: (c) => isType(c, 'creature') },
      { label: 'Artifacts', match: (c) => isType(c, 'artifact') && !isType(c, 'creature') },
      { label: 'Enchantments', match: (c) => isType(c, 'enchantment') },
      { label: 'Instant', match: (c) => isType(c, 'instant') },
      { label: 'Sorcery', match: (c) => isType(c, 'sorcery') },
      { label: 'Planeswalker', match: (c) => isType(c, 'planeswalker') },
      { label: 'Lands', match: (c) => isType(c, 'land') },
    ]

  return sections
    .map((section) => {
      const grouped = new Map<string, DeckEntry>()
      list.forEach((card) => {
        if (!section.match(card)) return
        const existing = grouped.get(card.name)
        if (existing) {
          existing.qty += 1
        } else {
          grouped.set(card.name, { card, qty: 1 })
        }
      })
      return { label: section.label, entries: Array.from(grouped.values()) }
    })
    .filter((s) => s.entries.length > 0)
}

  async function generateDeck() {
    if (!commander) {
      setError('Prima pesca un comandante, poi genera il mazzo.')
      return
    }
    setDeckLoading(true)
    setError(null)
    setDeck([])
    setDeckSections([])

    try {
      const priceCap = priceCapValue(priceRange)
      const budgetTotal = totalBudget(priceRange)

      const targetsByBracket: Record<string, { lands: number; creatures: number; instants: number; sorceries: number; enchantments: number; artifacts: number; planeswalkers: number }> = {
        '1': { lands: 38, creatures: 28, instants: 6, sorceries: 6, enchantments: 8, artifacts: 8, planeswalkers: 1 },
        '2': { lands: 37, creatures: 27, instants: 7, sorceries: 7, enchantments: 8, artifacts: 8, planeswalkers: 2 },
        '3': { lands: 36, creatures: 26, instants: 8, sorceries: 8, enchantments: 8, artifacts: 9, planeswalkers: 2 },
        '4': { lands: 35, creatures: 24, instants: 9, sorceries: 9, enchantments: 7, artifacts: 9, planeswalkers: 3 },
        '5': { lands: 33, creatures: 22, instants: 10, sorceries: 10, enchantments: 6, artifacts: 10, planeswalkers: 3 },
      }

      const targets = targetsByBracket[bracket] ?? targetsByBracket['3']
      const roleTargets: Record<Role, number> =
        bracket === '5'
          ? { ramp: 12, draw: 12, removal: 12, protection: 10, wincon: 8, land: targets.lands, value: 99 }
          : bracket === '4'
            ? { ramp: 11, draw: 11, removal: 11, protection: 9, wincon: 8, land: targets.lands, value: 99 }
            : bracket === '3'
              ? { ramp: 10, draw: 10, removal: 10, protection: 8, wincon: 6, land: targets.lands, value: 99 }
              : bracket === '2'
                ? { ramp: 9, draw: 9, removal: 9, protection: 7, wincon: 5, land: targets.lands, value: 99 }
                : { ramp: 8, draw: 8, removal: 8, protection: 6, wincon: 4, land: targets.lands, value: 99 }

      const colorParam = (commander.color_identity.length
        ? commander.color_identity
        : ['C']
      ).join('').toLowerCase()

      const queryParts = [
        'legal:commander',
        'game:paper',
        `id:${colorParam}`,
        '-type:scheme',
        '-type:plane',
        '-type:vanguard',
        '-type:conspiracy',
      ]

      const archetypePart = archetypeQuery(archetype)
      if (archetypePart) queryParts.push(archetypePart)

      const query = queryParts.join(' ')
      const pool = (await fetchPool(query, 600)).filter((card) => card.id !== commander.id)

      const uniqueByName = new Map<string, ScryfallCard>()
      for (const card of pool) {
        if (!uniqueByName.has(card.name)) uniqueByName.set(card.name, card)
      }

      const source = Array.from(uniqueByName.values())
        .filter((card) => cardPrice(card) !== null)
        .sort((a, b) => (cardPrice(a) ?? Infinity) - (cardPrice(b) ?? Infinity))

      const used = new Set<string>()
      const decklist: ScryfallCard[] = []
      let landCount = 0
      let totalCost = 0
      let remainingBudget = budgetTotal
      const gameChangerCap = { 1: 0, 2: 1, 3: 3, 4: 6, 5: 99 }[bracket] ?? 3
      let gameChangerCount = 0
      const roleCount: Record<Role, number> = {
        ramp: 0,
        draw: 0,
        removal: 0,
        protection: 0,
        wincon: 0,
        land: 0,
        value: 0,
      }

      const withinBudget = (card: ScryfallCard) => {
        const price = cardPrice(card)
        if (price === null) return false
        if (isFinite(priceCap) && price > priceCap) return false
        if (!isFinite(remainingBudget)) return true
        return price <= remainingBudget + 1e-6
      }

      const pick = (predicate: (c: ScryfallCard) => boolean, needed: number, roleHint?: Role) => {
        for (const card of source) {
          if (decklist.length >= 99) break
          if (used.has(card.name)) continue
          if (isGameChanger(card) && gameChangerCount >= gameChangerCap) continue
          if (isForbidden(card, bracket)) continue
          if (!predicate(card)) continue
          if (!withinBudget(card)) continue
          used.add(card.name)
          decklist.push(card)
          const price = cardPrice(card) ?? 0
          if (isFinite(remainingBudget)) remainingBudget = Math.max(0, remainingBudget - price)
          totalCost += price
          if (isGameChanger(card)) gameChangerCount += 1
          if (isType(card, 'land')) landCount += 1
          const r = roleHint ?? classifyRole(card)
          roleCount[r] += 1
          if (--needed <= 0) break
        }
      }

      pick((c) => isType(c, 'creature'), targets.creatures, 'value')
      pick((c) => isType(c, 'artifact') && !isType(c, 'creature'), targets.artifacts, 'value')
      pick((c) => isType(c, 'enchantment'), targets.enchantments, 'value')
      pick((c) => isType(c, 'instant'), targets.instants, 'value')
      pick((c) => isType(c, 'sorcery'), targets.sorceries, 'value')
      pick((c) => isType(c, 'planeswalker'), targets.planeswalkers, 'value')

      // Lands: keep some nonbasics first
      const landTarget = targets.lands
      const colors = commander.color_identity.length ? commander.color_identity : ['C']
      const basicsPerColor = Math.max(4, Math.min(8, Math.floor(landTarget / Math.max(colors.length, 1))))
      const plannedBasics = colors.length ? basicsPerColor * colors.length : 10

      const nonbasicLands = source
        .filter((c) => isType(c, 'land') && !isType(c, 'basic'))
        .sort((a, b) => landColorScore(b, colors) - landColorScore(a, colors))

      for (const land of nonbasicLands) {
        if (decklist.length >= 99 || landCount >= landTarget - plannedBasics) break
        if (used.has(land.name)) continue
        if (!withinBudget(land)) continue
        const price = cardPrice(land)
        if (price === null) continue
        used.add(land.name)
        decklist.push(land)
        landCount += 1
        if (isFinite(remainingBudget)) remainingBudget = Math.max(0, remainingBudget - price)
        totalCost += price
      }

      // Fetch basic lands as needed
      const basicNames =
        colors.length > 0
          ? colors.map((c) => {
              if (c === 'W') return 'Plains'
              if (c === 'U') return 'Island'
              if (c === 'B') return 'Swamp'
              if (c === 'R') return 'Mountain'
              if (c === 'G') return 'Forest'
              return 'Wastes'
            })
          : ['Wastes']

      const remainingSlots = 99 - decklist.length
      const currentLands = decklist.filter((c) => isType(c, 'land')).length
      const basicsNeeded = Math.max(
        0,
        Math.min(plannedBasics, landTarget - currentLands, remainingSlots),
      )
      const basicsToAdd: ScryfallCard[] = []

      for (let i = 0; i < basicsNeeded; i++) {
        const name = basicNames[i % basicNames.length]
        if (!basicCache.has(name)) {
          // eslint-disable-next-line no-await-in-loop
          const resBasic = await fetch(
            `https://api.scryfall.com/cards/named?format=json&exact=${encodeURIComponent(name)}`,
          )
          if (resBasic.ok) {
            // eslint-disable-next-line no-await-in-loop
            const card: ScryfallCard = await resBasic.json()
            basicCache.set(name, card)
          }
        }
        const basic = basicCache.get(name)
        if (basic) basicsToAdd.push({ ...basic, id: `${basic.id}-${i}` })
      }

      basicsToAdd.slice(0, basicsNeeded).forEach((c) => {
        decklist.push(c)
        landCount += 1
        roleCount.land += 1
        const price = cardPrice(c) ?? 0
        if (isFinite(remainingBudget)) remainingBudget = Math.max(0, remainingBudget - price)
        totalCost += price
      })

      // Fill any leftover slots with best remaining cards respecting budget
      pick(
        (card) => !isType(card, 'land') || landCount < landTarget,
        99 - decklist.length,
      )

      // If still short (budget too tight), relax price constraints and fill with color-matching pool
      if (decklist.length < 99) {
        const fallbackCards = source.filter(
          (card) =>
            !used.has(card.name) &&
            !isForbidden(card, bracket) &&
            (card.color_identity.length === 0 ||
              card.color_identity.every((c) => colors.includes(c))),
        )
        for (const card of fallbackCards) {
          if (decklist.length >= 99) break
          if (!withinBudget(card)) continue
          if (isGameChanger(card) && gameChangerCount >= gameChangerCap) continue
          const price = cardPrice(card)
          if (price === null) continue
          used.add(card.name)
          decklist.push(card)
          if (isFinite(remainingBudget)) remainingBudget = Math.max(0, remainingBudget - price)
          totalCost += price
          if (isGameChanger(card)) gameChangerCount += 1
          const role = classifyRole(card)
          roleCount[role] = (roleCount[role] ?? 0) + 1
        }
      }

      // ensure role quotas if possible
      const needRole = (role: Role) => Math.max(0, (roleTargets[role] ?? 0) - roleCount[role])
      const missingRoles: Role[] = ['ramp', 'draw', 'removal', 'protection']
      for (const role of missingRoles) {
        const need = needRole(role)
        if (need <= 0) continue
        pick(
          (c) => classifyRole(c) === role && !isType(c, 'land'),
          need,
          role,
        )
      }

      const suggestions: { role: Role; needed: number; candidates: ScryfallCard[] }[] = []
      for (const role of missingRoles) {
        const need = needRole(role)
        if (need <= 0) continue
        const candidates = source
          .filter(
            (c) =>
              !used.has(c.name) &&
              classifyRole(c) === role &&
              (c.color_identity.length === 0 || c.color_identity.every((clr) => colors.includes(clr))),
          )
          .slice(0, 5)
        if (candidates.length) suggestions.push({ role, needed: need, candidates })
      }
      setSwapSuggestions(suggestions)

      const finalList = decklist.slice(0, 99)
      setRoleSummary({ target: roleTargets, current: roleCount })
      setDeck(finalList)
      setDeckSections(groupDeck(finalList))
      setPreviewCard(commander)
    } catch (err) {
      console.error(err)
      setError('Non sono riuscito a costruire il mazzo. Riprova tra poco.')
    } finally {
      setDeckLoading(false)
    }
  }

  function buildPrompt() {
    if (!commander) return 'Pesca prima un comandante.'
    const base = `Sei un deckbuilder esperto di Commander. Genera una lista di 100 carte (1 comandante + 99 non-commander) per ${commander.name}.`
    const colorInfo =
      commander.color_identity.length > 0
        ? `Rispetta l'identita' di colore ${commander.color_identity.join(', ')}.`
        : "Il comandante e' incolore."
    const theme =
      archetype === 'auto'
        ? "Scegli tu il piano di gioco piu' sinergico basandoti sulle carte piu' sinergiche note per il comandante (fonti EDHREC/Scryfall)."
        : `Strategia richiesta: ${archetypes.find((a) => a.value === archetype)?.label}.`

    const bracketLine = `Bracket di potenza: ${brackets.find((b) => b.value === bracket)?.label ?? bracket}.`
    const cap = priceCapValue(priceRange)
    const priceLine = `Vincolo di budget: ${priceLabel(priceRange)}. ${
      isFinite(cap) ? `Tieni il costo medio per carta sotto ${cap}$.` : 'Nessun tetto di prezzo.'
    } Budget totale indicativo: ${totalBudget(priceRange)}$.`
    const structure =
      "Bilancia la curva: 34-38 terre, 8-12 ramp, 8-12 removal, 8-10 protezioni/interaction, resto value e wincons. Evita carte bandite. No duplicati non permessi."

    return [
      base,
      colorInfo,
      theme,
      bracketLine,
      priceLine,
      structure,
      'Restituisci solo elenco carte in testo semplice.',
    ].join('\n')
  }

  return (
    <div className="min-h-screen text-slate-50">
      <header className="max-w-6xl mx-auto px-4 py-10">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 rounded-2xl bg-gradient-to-tr from-sky-400 via-indigo-500 to-emerald-400 grid place-items-center shadow-lg shadow-sky-900/30">
              <span className="font-black text-xl tracking-tight">CA</span>
            </div>
            <div>
              <p className="text-sm uppercase tracking-[0.18em] text-sky-200/80">Commander Advisor</p>
              <p className="font-semibold text-xl">Draft guidato dall&apos;IA</p>
            </div>
          </div>
          <div className="flex gap-2">
            <a
              className="px-3 py-2 rounded-xl glass text-sm"
              href="https://scryfall.com/"
              target="_blank"
              rel="noreferrer"
            >
              Scryfall API
            </a>
            <a
              className="px-3 py-2 rounded-xl glass text-sm"
              href="https://edhrec.com/"
              target="_blank"
              rel="noreferrer"
            >
              EDHREC
            </a>
          </div>
        </div>

        <div className="mt-10 glass rounded-3xl p-8 lg:p-10 relative overflow-hidden">
          <div className="absolute inset-0 pointer-events-none bg-gradient-to-r from-indigo-500/10 via-transparent to-emerald-400/10" />
          <div className="relative grid lg:grid-cols-[1.1fr_0.9fr] gap-10 items-center">
            <div className="space-y-6">
              <p className="pill bg-sky-400/10 text-sky-100 border border-sky-300/30 inline-block">
                Preview prototipo
              </p>
              <h1 className="text-4xl md:text-5xl font-semibold leading-tight">
                Costruisci il tuo mazzo Commander con suggerimenti dinamici
              </h1>
              <p className="text-slate-200/80 max-w-2xl">
                Peschiamo un comandante casuale da Scryfall e proponiamo carte
                sinergiche basate sull&apos;identità di colore usando il ranking EDH.
                L&apos;IA potrà raffinarsi con dati da EDHREC e valutazioni di
                potenza per creare liste sempre più curate.
              </p>
              <div className="flex flex-wrap gap-3 items-center">
                <button
                  onClick={drawCommander}
                  disabled={loadingCommander}
                  className="px-5 py-3 rounded-2xl bg-gradient-to-r from-sky-400 via-indigo-500 to-emerald-400 font-semibold shadow-lg shadow-indigo-900/30 disabled:opacity-60"
                >
                  {loadingCommander ? 'Sto pescando...' : 'Pesca un comandante'}
                </button>
                <label className="text-sm text-slate-200 flex items-center gap-2">
                  <span className="text-slate-300">Filtro colori (solo pesca casuale):</span>
                  <select
                    value={colorFilter}
                    onChange={(e) => setColorFilter(e.target.value)}
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
                {commander?.related_uris?.edhrec && (
                  <a
                    href={commander.related_uris.edhrec}
                    target="_blank"
                    rel="noreferrer"
                    className="px-5 py-3 rounded-2xl glass font-semibold"
                  >
                    Apri scheda su EDHREC
                  </a>
                )}
              </div>

              <div className="glass rounded-2xl p-5 border border-white/10 space-y-3">
                <p className="text-sm text-slate-200">
                  Oppure scegli tu il comandante (solo creature leggendarie legali):
                </p>
                <input
                  value={commanderQuery}
                  onChange={(e) => setCommanderQuery(e.target.value)}
                  placeholder="Es. Atraxa, Alela, Korvold..."
                  className="w-full glass rounded-xl px-3 py-2 bg-slate-900/70 border border-white/15 focus:border-emerald-300/60"
                />
                {commanderResults.length > 0 && (
                  <div className="grid sm:grid-cols-2 gap-2">
                    {commanderResults.map((card) => (
                      <button
                        key={card.id}
                        onClick={() => chooseCommander(card)}
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

              <div className="glass rounded-2xl p-5 border border-white/10 space-y-4">
                <div className="grid md:grid-cols-3 gap-3">
                  <div>
                    <p className="text-sm text-slate-300">Archetipo / tema</p>
                    <select
                      value={archetype}
                      onChange={(e) => setArchetype(e.target.value)}
                      className="w-full glass rounded-xl px-3 py-2 text-sm border-white/20 bg-slate-900/60 focus:border-emerald-300/60"
                    >
                      {archetypes.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <p className="text-sm text-slate-300">Bracket (potenza)</p>
                    <select
                      value={bracket}
                      onChange={(e) => setBracket(e.target.value)}
                      className="w-full glass rounded-xl px-3 py-2 text-sm border-white/20 bg-slate-900/60 focus:border-emerald-300/60"
                    >
                      {brackets.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <p className="text-sm text-slate-300">Prezzo</p>
                    <select
                      value={priceRange}
                      onChange={(e) => setPriceRange(e.target.value)}
                      className="w-full glass rounded-xl px-3 py-2 text-sm border-white/20 bg-slate-900/60 focus:border-emerald-300/60"
                    >
                      {priceRanges.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="flex flex-wrap gap-3 items-center">
                  <button
                    onClick={generateDeck}
                    disabled={deckLoading || !commander}
                    className="px-4 py-2 rounded-xl bg-emerald-500 text-slate-950 font-semibold shadow-lg shadow-emerald-900/30 disabled:opacity-60"
                  >
                    {deckLoading ? 'Genero lista...' : 'Genera mazzo da 100 carte'}
                  </button>
                  <p className="text-sm text-slate-300">
                    99 carte + comandante · bilanciato per tipo · cap prezzo medio per carta
                  </p>
                </div>
              </div>
            </div>

            <div className="glass rounded-3xl p-6 border border-white/10">
              {commander ? (
                <div className="space-y-4">
                  <div className="relative rounded-2xl overflow-hidden border border-white/10 shadow-xl shadow-indigo-900/40">
                    {commander.image_uris?.art_crop || commander.image_uris?.normal ? (
                      <img
                        src={commander.image_uris.art_crop ?? commander.image_uris.normal}
                        alt={commander.name}
                        className="w-full h-72 object-cover"
                      />
                    ) : (
                      <div className="h-72 grid place-items-center bg-slate-900 text-slate-400">
                        Immagine non disponibile
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 to-transparent" />
                    <div className="absolute bottom-0 left-0 right-0 p-4 flex justify-between items-center">
                      <div>
                        <p className="text-xs uppercase tracking-wide text-slate-200/80">
                          Comandante estratto
                        </p>
                        <p className="font-semibold text-lg">{commander.name}</p>
                        <div className="mt-1">
                          <ManaIcons cost={commander.mana_cost} />
                        </div>
                      </div>
                      <div className="flex gap-2">
                        {(commander.color_identity.length
                          ? commander.color_identity
                          : ['C']
                        ).map((symbol) => (
                          <span
                            key={symbol}
                            className={`pill ${colorStyling[symbol] ?? colorStyling.C}`}
                          >
                            {symbol}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2 text-sm text-slate-200/80">
                    <p className="font-semibold text-slate-50">{commander.type_line}</p>
                    {commander.oracle_text && (
                      <p className="whitespace-pre-line leading-relaxed">
                        {commander.oracle_text}
                      </p>
                    )}
                    <p className="text-slate-300">{colorIdentityLabel}</p>
                  </div>
                </div>
              ) : (
                <div className="h-72 grid place-items-center text-slate-400">
                  {loadingCommander ? 'Carico il comandante...' : 'Premi per pescare un comandante'}
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 pb-16 space-y-10">
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="pill bg-indigo-400/10 text-indigo-100 border border-indigo-300/30">
                Suggerimenti dal colore
              </p>
              <h2 className="text-2xl font-semibold mt-3">
                Carte consigliate (ordine EDHREC)
              </h2>
              <p className="text-slate-200/80">
                Lista dinamica basata sull&apos;identità di colore del comandante
                corrente. Potenzieremo il modello IA con sinergie specifiche EDHREC.
              </p>
            </div>
            <div className="text-sm text-slate-300">
              {suggestions.loading
                ? 'Ricerca in corso...'
                : `${suggestions.cards.length} carte mostrate`}
            </div>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {suggestions.loading && (
              <div className="md:col-span-2 lg:col-span-4 glass rounded-2xl p-6 text-slate-300">
                Caricamento suggerimenti da Scryfall...
              </div>
            )}

            {!suggestions.loading && !suggestions.cards.length && (
              <div className="md:col-span-2 lg:col-span-4 glass rounded-2xl p-6 text-slate-300">
                Nessun suggerimento disponibile. Prova a pescare un altro comandante.
              </div>
            )}

            {suggestions.cards.map((card) => (
              <article
                key={card.id}
                className="glass rounded-2xl p-4 flex flex-col gap-3 hover:-translate-y-1 transition-transform"
                onMouseEnter={() => setPreviewCard(card)}
                onFocus={() => setPreviewCard(card)}
                onMouseLeave={() => setPreviewCard(null)}
                onBlur={() => setPreviewCard(null)}
              >
                <div className="rounded-xl overflow-hidden border border-white/10 h-40 bg-slate-900">
                  {card.image_uris?.art_crop || card.image_uris?.normal ? (
                    <img
                      src={card.image_uris.art_crop ?? card.image_uris.normal}
                      alt={card.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full grid place-items-center text-slate-500 text-sm">
                      Nessuna immagine
                    </div>
                  )}
                </div>
                <div className="space-y-1">
                  <p className="font-semibold text-lg leading-tight">{card.name}</p>
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm text-slate-300 leading-snug">{card.type_line}</p>
                    <ManaIcons cost={card.mana_cost} />
                  </div>
                  {card.oracle_text && (
                    <p className="text-sm text-slate-400 max-h-20 overflow-hidden">
                      {card.oracle_text}
                    </p>
                  )}
                </div>
                <div className="flex flex-wrap gap-2 mt-auto">
                  {(card.color_identity.length ? card.color_identity : ['C']).map((symbol) => (
                    <span
                      key={`${card.id}-${symbol}`}
                      className={`pill ${colorStyling[symbol] ?? colorStyling.C}`}
                    >
                      {symbol}
                    </span>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="pill bg-emerald-400/10 text-emerald-100 border border-emerald-300/30">
                Decklist generata
              </p>
              <h2 className="text-2xl font-semibold mt-3">100 carte sinergiche</h2>
              <p className="text-slate-200/80">
                Primo prototipo: prende 99 carte compatibili ordinate per EDHREC; in
                futuro il motore IA potrà sostituire/rioridnare le carte per
                sinergia profonda, curve e budget.
              </p>
            </div>
            <div className="text-sm text-slate-300">
              {deckLoading
                ? 'Calcolo in corso...'
                : deck.length
                  ? `${deck.length + 1}/100 (incluso comandante)`
                  : 'Nessuna decklist generata'}
            </div>
          </div>

          {deckLoading && (
            <div className="glass rounded-2xl p-4 text-slate-200">Sto componendo la lista...</div>
          )}

          {!deckLoading && roleSummary && (
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
                    diff > 0 ? 'text-amber-200 bg-amber-400/10 border-amber-400/30' : 'text-emerald-200 bg-emerald-400/10 border-emerald-400/30'
                  return (
                    <div key={r} className={`glass rounded-xl px-3 py-2 border ${color}`}>
                      <div className="flex justify-between text-sm font-semibold capitalize">
                        <span>{r}</span>
                        <span>
                          {cur}/{tgt || '—'}
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
                      <p className="text-sm font-semibold mb-2">
                        Mancano {sugg.needed} per {sugg.role}
                      </p>
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
              <div className="flex flex-wrap gap-2 mt-3 text-sm">
                <button
                  onClick={() => exportText('txt')}
                  className="px-3 py-2 rounded-lg glass border border-white/20"
                >
                  Export TXT
                </button>
                <button
                  onClick={() => exportText('csv')}
                  className="px-3 py-2 rounded-lg glass border border-white/20"
                >
                  Export CSV
                </button>
                <button
                  onClick={() => exportText('moxfield')}
                  className="px-3 py-2 rounded-lg glass border border-white/20"
                >
                  Export Moxfield
                </button>
                <button
                  onClick={() => exportText('json')}
                  className="px-3 py-2 rounded-lg glass border border-white/20"
                >
                  Export JSON
                </button>
              </div>
            </div>
          )}

          {!deckLoading && deck.length === 0 && (
            <div className="glass rounded-2xl p-4 text-slate-300">
              Genera un mazzo dopo aver pescato un comandante.
            </div>
          )}

          {!deckLoading && deck.length > 0 && (
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
          )}
        </section>

        <section className="glass rounded-3xl p-6 border border-white/10">
          <h3 className="text-xl font-semibold mb-2">Prossimi step (IA)</h3>
          <p className="text-slate-200/80">
            Integrare eventuali dataset EDHREC o Moxfield server-side per affinare le sinergie,
            aggiungere un motore LLM opzionale (solo via backend) e nuove metriche di bilanciamento
            (curve di mana, count di staple per bracket, power score). Questa sezione è lasciata in
            fondo perché il prototipo attuale è 100% frontend.
          </p>

          <div className="mt-4 glass rounded-2xl p-4 border border-white/10">
            <p className="text-sm text-slate-300 mb-2">Prompt generato (bozza documentativa):</p>
            <pre className="whitespace-pre-wrap text-slate-100 text-sm bg-slate-900/60 rounded-xl p-3 border border-white/5">
{buildPrompt()}
</pre>
            <p className="text-xs text-slate-400 mt-2">
              Nota: il prompt è conservato solo a titolo di riferimento; nessuna chiamata a LLM avviene dal browser.
            </p>
          </div>
        </section>

        {error && (
          <div className="glass rounded-2xl p-4 text-rose-200 border border-rose-400/40">
            {error}
          </div>
        )}
      </main>
    </div>
  )
}

export default App


