import type { ScryfallCard } from '../types'

type SynergyRule = {
  tag: string
  patterns: RegExp[]
  query: string
  weight?: number
}

const rules: SynergyRule[] = [
  { tag: 'enchantments', patterns: [/enchant/i, /aura/i], query: 'type:enchantment' },
  { tag: 'artifacts', patterns: [/artifact/i, /treasure/i], query: 'type:artifact' },
  { tag: 'counters', patterns: [/\+1\/\+1 counter/i, /proliferate/i], query: 'oracle:"+1/+1 counter" OR keyword:proliferate' },
  { tag: 'blink', patterns: [/exile.*return/i, /flicker/i, /blink/i], query: '(flicker OR blink)' },
  { tag: 'tokens', patterns: [/create .* token/i, /token/i], query: 'oracle:"create.*token"' },
  { tag: 'sacrifice', patterns: [/sacrifice/i, /dies/i], query: 'oracle:sacrifice' },
  { tag: 'draw', patterns: [/draw .* card/i], query: 'oracle:"draw a card"' },
  { tag: 'landfall', patterns: [/landfall/i, /land enters/i], query: 'keyword:landfall OR oracle:"land enters"' },
  { tag: 'treasure', patterns: [/treasure/i, /blood token/i, /food token/i, /clue token/i, /map token/i], query: 'oracle:(treasure OR blood OR food OR clue OR map)', weight: 1 },
  { tag: 'extra-land', patterns: [/additional land/i], query: 'oracle:"additional land"' },
  { tag: 'spellslinger', patterns: [/instant/i, /sorcery/i], query: '(type:instant OR type:sorcery)' },
  { tag: 'graveyard', patterns: [/graveyard/i], query: 'oracle:graveyard' },
  { tag: 'reanimation', patterns: [/return target .* from your graveyard/i], query: 'oracle:"return target creature card from your graveyard"' },
  { tag: 'equipment', patterns: [/equipment/i, /equip /i], query: 'type:equipment' },
  { tag: 'vehicles', patterns: [/vehicle/i], query: 'type:vehicle' },
  { tag: 'lifegain', patterns: [/gain life/i, /lifelink/i], query: '(oracle:"gain life" OR keyword:lifelink)' },
  { tag: 'storm', patterns: [/storm/i], query: 'keyword:storm' },
  { tag: 'investigate', patterns: [/investigate/i, /clue/i, /food/i, /map token/i], query: 'oracle:(investigate OR clue OR food OR map)', weight: 1 },
  { tag: 'ward', patterns: [/hexproof/i, /ward/i, /indestructible/i, /shield counter/i], query: 'oracle:(hexproof OR ward OR indestructible OR "shield counter")' },
  { tag: 'copy', patterns: [/copy (spell|permanent|creature)/i], query: 'oracle:"copy target"' },
  { tag: 'power-matters', patterns: [/power.*matters/i, /\+x\/\+x/i], query: 'oracle:power type:creature' },
  { tag: 'initiative-dungeon', patterns: [/initiative/i, /venture into the dungeon/i], query: 'oracle:(initiative OR dungeon)', weight: 1 },
  { tag: 'party', patterns: [/cleric/i, /rogue/i, /warrior/i, /wizard/i], query: 'oracle:(party OR cleric OR rogue OR warrior OR wizard)', weight: 0.5 },
  { tag: 'convoke', patterns: [/convoke/i], query: 'keyword:convoke' },
  { tag: 'discover-explore', patterns: [/discover/i, /explore/i], query: 'oracle:(discover OR explore)' },
  { tag: 'artifact-tokens', patterns: [/servos?/i, /thopters?/i, /construct/i], query: 'oracle:(servo OR thopter OR construct) type:artifact' },
  { tag: 'attack-triggers', patterns: [/attack/i, /attacks/i, /when .* attacks/i, /melee/i, /go+d/i], query: 'oracle:(attacks OR melee OR goad OR exalted OR extra combat)', weight: 2 },
  { tag: 'assassin-rogue', patterns: [/assassin/i, /rogue/i], query: 'type:creature (assassin OR rogue)', weight: 1.5 },
  { tag: 'token-attackers', patterns: [/token/i, /attacking token/i], query: 'oracle:(create.*attacking token OR create .* token tapped and attacking)', weight: 1.2 },
  { tag: 'double-strike', patterns: [/double strike/i], query: 'keyword:"double strike"', weight: 1 },
]

export function deriveSynergyQueries(commander: ScryfallCard, max = 3): string[] {
  const typeText = (commander.type_line ?? '').toLowerCase()
  const oracleText = (commander.oracle_text ?? '').toLowerCase()
  const combined = `${typeText} ${oracleText}`

  const scored: { query: string; score: number }[] = []

  rules.forEach((rule, idx) => {
    const hitsType = rule.patterns.filter((p) => p.test(typeText)).length
    const hitsOracle = rule.patterns.filter((p) => p.test(oracleText)).length
    const totalHits = rule.patterns.filter((p) => p.test(combined)).length
    if (!totalHits) return
    const base = rule.weight ?? 0
    const score = hitsType * 2 + hitsOracle + base + totalHits * 0.25 - idx * 0.001
    scored.push({ query: rule.query, score })
  })

  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, max)
    .map((s) => s.query)
}
