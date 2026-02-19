# Commander Advisor – guida rapida

## Stack
- Vite + React + TypeScript
- Tailwind CSS
- Scryfall API (solo FE, nessuna chiave)
- Nessun backend attivo

## Flusso attuale
1. Pesca comandante (random con filtro colori in select, oppure ricerca manuale) da Scryfall.
2. Costruisce un pool ordinato per EDHREC, filtra per identità colore, bracket e archetipo.
3. Seleziona carte rispettando budget totale e cap per carta, preferendo la versione più economica e scartando prezzi n/a.
4. Applica quote per ruoli (ramp/draw/removal/protection/wincon/lands), evita game‑changers oltre il limite per bracket, bilancia terre (triome/dual, basiche aggregate xN).
5. Mostra decklist, delta ruoli, suggerimenti di completamento e export TXT/CSV/Moxfield/JSON.

## Budget
- Range: 0‑50, 50‑150, 150‑300, nessun budget.
- Usa il prezzo minimo disponibile (usd/usd_foil/eur). Carte senza prezzo vengono scartate; le basiche valgono 0.
- Il mazzo non può superare il budget selezionato.

## Game Changer
- Riconosce staple/extra turn/combo note; badge "Game Changer" vicino al nome.
- Limiti per bracket: 0/1/3/6/illimitato (1→5).

## Note
- Il prompt/LLM è solo documentativo: nessuna chiamata esterna.
- EDHREC non ha API pubbliche: usiamo `order=edhrec` di Scryfall.

## Comandi
- `npm run dev` – avvio locale
- `npm run build` – build produzione
