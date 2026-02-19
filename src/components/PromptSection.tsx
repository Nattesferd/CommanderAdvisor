type Props = { promptText: string }

export function PromptSection({ promptText }: Props) {
  return (
    <section className="glass rounded-3xl p-6 border border-white/10">
      <h3 className="text-xl font-semibold mb-2">Prossimi step (IA)</h3>
      <p className="text-slate-200/80">
        Integrare eventuali dataset EDHREC o Moxfield server-side per affinare le sinergie,
        aggiungere un motore LLM opzionale (solo via backend) e nuove metriche di bilanciamento
        (curve di mana, count di staple per bracket, power score). Questa sezione Ã¨ lasciata in
        fondo perchÃ© il prototipo attuale Ã¨ 100% frontend.
      </p>

      <div className="mt-4 glass rounded-2xl p-4 border border-white/10">
        <p className="text-sm text-slate-300 mb-2">Prompt generato (bozza documentativa):</p>
        <pre className="whitespace-pre-wrap text-slate-100 text-sm bg-slate-900/60 rounded-xl p-3 border border-white/5">
{promptText}
</pre>
        <p className="text-xs text-slate-400 mt-2">
          Nota: il prompt Ã¨ conservato solo a titolo di riferimento; nessuna chiamata a LLM avviene dal browser.
        </p>
      </div>
    </section>
  )
}
