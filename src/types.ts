export type ScryfallCard = {
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

export type SuggestionsState = {
  cards: ScryfallCard[]
  loading: boolean
}

export type DeckEntry = {
  card: ScryfallCard
  qty: number
}

export type DeckSection = {
  label: string
  entries: DeckEntry[]
}

export type Role = 'ramp' | 'draw' | 'removal' | 'protection' | 'wincon' | 'land' | 'value'
