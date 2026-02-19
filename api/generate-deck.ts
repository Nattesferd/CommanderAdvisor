// Serverless endpoint (Vercel/Netlify-compatible) - placeholder that calls OpenAI
import type { VercelRequest, VercelResponse } from '@vercel/node'

type Body = {
  commanderName: string
  commanderColors: string[]
  archetype: string
  bracket: string
  priceRange: string
  poolSnippet?: string
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const body = req.body as Body
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    return res.status(500).json({ error: 'OPENAI_API_KEY mancante nel backend' })
  }

  const prompt = [
    `Sei un deckbuilder esperto di Commander. Genera una lista di 100 carte (1 comandante + 99 non-commander) per ${body.commanderName}.`,
    body.commanderColors.length
      ? `Rispetta identità di colore: ${body.commanderColors.join(', ')}.`
      : 'Comandante incolore.',
    `Archetipo: ${body.archetype}. Bracket: ${body.bracket}. Budget: ${body.priceRange}.`,
    'Bilancia terre/ramp/removal/draw/protezioni, evita banlist, niente duplicati non permessi.',
    'Restituisci solo elenco numerato di carte (nome e ruolo breve).',
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
        temperature: 0.7,
      }),
    })

    if (!completion.ok) {
      const text = await completion.text()
      return res.status(500).json({ error: 'LLM error', detail: text })
    }

    const data = await completion.json()
    const text = data.choices?.[0]?.message?.content ?? ''
    return res.status(200).json({ deck: text })
  } catch (err) {
    console.error(err)
    return res.status(500).json({ error: 'Unexpected backend error' })
  }
}
