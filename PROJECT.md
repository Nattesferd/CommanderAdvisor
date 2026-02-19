# Commander Advisor – Guida rapida

## Stack
- Vite + React + TypeScript
- Tailwind CSS
- Scryfall API (nessuna chiave richiesta)
- Backend serverless (`api/generate-deck.ts`) che chiama OpenAI (serve `OPENAI_API_KEY`)

## Flusso
1. Il FE pesca un comandante (random o ricerca) e costruisce un pool di carte da Scryfall (order=edhrec, fino a ~600 risultati).
2. Applica vincoli di colori, budget, bracket e archetype, filtra carte bandite/fast‑mana nei bracket bassi, sceglie triome/dual, riempie i ruoli (ramp/draw/removal/protection/wincon), e genera 99 + comandante.
3. Invia commander + vincoli + snippet pool al backend `/api/generate-deck` per un rerank IA. Se l’LLM risponde JSON, la lista viene riordinata; altrimenti fallback testo.
4. Mostra delta ruoli, suggerimenti di swap e export TXT/CSV/Moxfield/JSON.

## Backend (Vercel/Netlify)
- Endpoint: `api/generate-deck.ts` usa `process.env.OPENAI_API_KEY` (modello `gpt-4o-mini`). Nessun altro secret richiesto.
- Errori “@vercel/node mancante” risolti: usa tipi Node standard; `tsconfig` include `"types": ["vite/client","node"]` e `"include": ["src","api"]`.

### Usarlo senza pushare
Opzione A: Vercel CLI con deploy già online  
```
vercel dev --token <token>
# oppure
VITE_API_BASE=https://<tuo-deploy>.vercel.app npm run dev
```
- In locale puoi puntare al deploy remoto settando `.env` con `VITE_API_BASE=https://<tuo-deploy>.vercel.app` (il FE chiamerà l’endpoint remoto).  
- Se vuoi far girare il backend localmente: `vercel dev` dalla root legge la tua `OPENAI_API_KEY` (mettila in `.env` o nelle env Vercel) e espone `/api/generate-deck` su `http://localhost:3000/api/generate-deck`; poi avvia il FE con `VITE_API_BASE=http://localhost:3000 npm run dev`.

### Deploy
- Ogni push sul branch collegato redeploya automaticamente su Vercel. Se vuoi aggiornare senza push, usa `vercel deploy --prebuilt` dalla tua macchina (serve login Vercel).

## Comandi
- `npm run dev` – avvia FE (usa `VITE_API_BASE` se impostata, altrimenti stesso dominio)
- `npm run build` – build FE + typecheck API

## Esportazione liste
- TXT/CSV/Moxfield/JSON (mainboard + comandante). JSON semplice: `{ commander, mainboard: [{name,count}] }`.

## Note su dati
- EDHREC: non ha API pubblica; usiamo ranking EDH incorporato in Scryfall (order=edhrec). L’LLM migliora sinergia e copre le mancanze.

## Cose principali già fatte
- Filtri colore con chip + icone, 4‑color inclusi.
- Ban bracket 1‑3: extra turn, tutor pesanti, mass land destruction, fast‑mana notorio.
- Ruoli e delta: ramp/draw/removal/protection/wincon/lands; suggerimenti di swap dai primi 5 candidati per ruolo mancante.
- Terre: triome/dual prioritarie, basiche aggregate xN.
- Tooltip (title) + anteprima grande; hover preview.

## TODO futuri (se servirà)
- Risposte LLM già in JSON con proposte di sostituzione dirette.
- Tooltip con immagine `border_crop` inline e skeleton più ricchi.
- Quote per colore su ramp/draw/removal e filtri budget per categoria. 
