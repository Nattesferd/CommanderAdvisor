// Serverless endpoint (Vercel/Netlify-compatible) - calls OpenAI
import type { IncomingMessage, ServerResponse } from 'http'

export const config = {
  runtime: 'nodejs',
}

type Body = {
  commanderName: string
  commanderColors: string[]
  archetype: string
  bracket: string
  priceRange: string
  poolSnippet?: string
}

export default async function handler(
  req: IncomingMessage & { body?: unknown; method?: string },
  res: ServerResponse,
) {
  const json = (code: number, body: any) => {
    res.statusCode = code
    res.setHeader('Content-Type', 'application/json')
    res.end(JSON.stringify(body))
  }

  if (req.method !== 'POST') {
    return json(405, { error: 'Method not allowed' })
  }

  // body parsing with fallback
  let body: Body = req.body as Body
  if (!body) {
    body = await new Promise((resolve, reject) => {
      let data = ''
      req.on('data', (chunk) => (data += chunk))
      req.on('end', () => {
        try {
          resolve(data ? JSON.parse(data) : {})
        } catch (e) {
          reject(e)
        }
      })
    })
  }

  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    return json(500, { error: 'OPENAI_API_KEY mancante nel backend' })
  }

  if (!body?.commanderName) {
    return json(400, { error: 'Missing commanderName' })
  }

  const prompt = [
    `Sei un deckbuilder esperto di Commander. Genera una lista di 100 carte (1 comandante + 99 non-commander) per ${body.commanderName}.`,
    body.commanderColors.length
      ? `Rispetta identità di colore: ${body.commanderColors.join(', ')}.`
      : 'Comandante incolore.',
    `Archetipo: ${body.archetype}. Bracket: ${body.bracket}. Budget: ${body.priceRange}.`,
    'Bilancia terre (33-38), ramp (8-12), removal (8-12), draw (8-12), protezioni/interaction (6-10), resto value/wincon. Evita banlist, niente duplicati non permessi.',
    'Restituisci JSON compatto: { "cards": [ { "name": "...", "role": "ramp|draw|removal|protection|wincon|land|value" } ] } con esattamente 99 non-commander. Non aggiungere testo extra.',
    body.poolSnippet ? `Pool Scryfall/EDH a supporto:\n${body.poolSnippet}` : '',
  ].join('\n')

  try {
    const completion = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.4,
      }),
    })

    if (!completion.ok) {
      const text = await completion.text()
      return json(500, { error: 'LLM error', detail: text })
    }

    const data = await completion.json()
    const text = data.choices?.[0]?.message?.content ?? ''
    return json(200, { deck: text })
  } catch (err) {
    console.error('generate-deck error', err)
    return json(500, { error: 'Unexpected backend error', detail: (err as Error).message })
  }
}
