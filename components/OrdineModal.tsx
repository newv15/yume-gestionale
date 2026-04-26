'use client'
import { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import { supabase, Ordine } from '@/lib/supabase'

type Props = {
  ordine?: Ordine | null
  onClose: () => void
  onSaved: () => void
}

type FormState = {
  data: string
  nome_cliente: string
  contatto: string
  tipo_ordine: string
  nome_articolo: string
  quantita: number | string
  costo: number | string
  prezzo_vendita: number | string
  stato: string
  fornitore: string
  fornitore_custom: string
  pagamento: string
  note: string
}

const STATI     = ['da cercare', 'ordinato', 'arrivato', 'completato']
const FORNITORI = ['manicomics', 'starshop', 'terminal', 'second hand', 'cubex', 'altro']
const TIPI      = ['online', 'in store']
const PAGAMENTI = ['da saldare', 'pagato']

const emptyForm: FormState = {
  data: new Date().toISOString().split('T')[0],
  nome_cliente: '', contatto: '', tipo_ordine: 'online',
  nome_articolo: '', quantita: 1, costo: '', prezzo_vendita: '',
  stato: 'da cercare', fornitore: 'manicomics', fornitore_custom: '',
  pagamento: 'da saldare', note: ''
}

export default function OrdineModal({ ordine, onClose, onSaved }: Props) {
  const [form, setForm]     = useState<FormState>(emptyForm)
  const [loading, setLoading] = useState(false)
  const [error, setError]   = useState('')

  useEffect(() => {
    if (ordine) {
      setForm({
        data: ordine.data,
        nome_cliente: ordine.nome_cliente,
        contatto: ordine.contatto ?? '',
        tipo_ordine: ordine.tipo_ordine,
        nome_articolo: ordine.nome_articolo,
        quantita: ordine.quantita,
        costo: ordine.costo ?? '',
        prezzo_vendita: ordine.prezzo_vendita ?? '',
        stato: ordine.stato,
        fornitore: ordine.fornitore,
        fornitore_custom: ordine.fornitore_custom ?? '',
        pagamento: ordine.pagamento,
        note: ordine.note ?? '',
      })
    } else {
      setForm(emptyForm)
    }
  }, [ordine])

  const set = (k: keyof FormState, v: string | number) =>
    setForm(p => ({ ...p, [k]: v }))

  const handleSave = async () => {
    if (!form.nome_articolo.trim()) { setError('Il nome articolo è obbligatorio'); return }
    if (!form.nome_cliente.trim())  { setError('Il nome cliente è obbligatorio'); return }
    setLoading(true); setError('')
    const payload = {
      data: form.data,
      nome_cliente: form.nome_cliente,
      contatto: form.contatto || null,
      tipo_ordine: form.tipo_ordine,
      nome_articolo: form.nome_articolo,
      quantita: Number(form.quantita) || 1,
      costo: form.costo !== '' ? Number(form.costo) : null,
      prezzo_vendita: form.prezzo_vendita !== '' ? Number(form.prezzo_vendita) : null,
      stato: form.stato,
      fornitore: form.fornitore,
      fornitore_custom: form.fornitore === 'altro' ? form.fornitore_custom : null,
      pagamento: form.pagamento,
      note: form.note || null,
    }
    let err
    if (ordine) {
      ({ error: err } = await supabase.from('ordini').update(payload).eq('id', ordine.id))
    } else {
      ({ error: err } = await supabase.from('ordini').insert(payload))
    }
    setLoading(false)
    if (err) { setError(err.message); return }
    onSaved()
  }

  const inputCls = "w-full bg-[#0F0F0F] border border-[#444] text-white rounded-xl px-4 py-3 text-base focus:outline-none focus:border-[#E8162B] transition-colors"
  const labelCls = "block text-xs text-[#888] font-semibold uppercase tracking-wider mb-1.5"

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end md:justify-center md:items-center bg-black/80 backdrop-blur-sm">
      
      {/* Backdrop click per chiudere */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-[#1A1A1A] w-full md:max-w-2xl md:rounded-2xl rounded-t-3xl flex flex-col"
        style={{ maxHeight: '92vh' }}>

        {/* Handle mobile */}
        <div className="md:hidden flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 bg-[#444] rounded-full" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#333]">
          <h2 className="font-manga text-2xl text-[#E8162B]">
            {ordine ? 'MODIFICA ORDINE' : 'NUOVO ORDINE'}
          </h2>
          <button onClick={onClose}
            className="p-2 rounded-xl bg-[#242424] text-[#888] hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Form scrollabile */}
        <div className="overflow-y-auto flex-1 px-5 py-4">
          <div className="grid grid-cols-2 gap-4">

            <div>
              <label className={labelCls}>Data</label>
              <input type="date" className={inputCls}
                value={form.data} onChange={e => set('data', e.target.value)} />
            </div>

            <div>
              <label className={labelCls}>Tipo ordine</label>
              <select className={inputCls}
                value={form.tipo_ordine} onChange={e => set('tipo_ordine', e.target.value)}>
                {TIPI.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>

            <div>
              <label className={labelCls}>Nome cliente *</label>
              <input className={inputCls}
                value={form.nome_cliente} onChange={e => set('nome_cliente', e.target.value)}
                placeholder="Mario Rossi" />
            </div>

            <div>
              <label className={labelCls}>Contatto</label>
              <input className={inputCls}
                value={form.contatto} onChange={e => set('contatto', e.target.value)}
                placeholder="Tel / Instagram" />
            </div>

            <div className="col-span-2">
              <label className={labelCls}>Nome articolo *</label>
              <input className={inputCls}
                value={form.nome_articolo} onChange={e => set('nome_articolo', e.target.value)}
                placeholder="One Piece Vol. 1..." />
            </div>

            <div>
              <label className={labelCls}>Quantità</label>
              <input type="number" min={1} className={inputCls}
                value={form.quantita} onChange={e => set('quantita', e.target.value)} />
            </div>

            <div>
              <label className={labelCls}>Stato</label>
              <select className={inputCls}
                value={form.stato} onChange={e => set('stato', e.target.value)}>
                {STATI.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>

            <div>
              <label className={labelCls}>Costo acquisto (€)</label>
              <input type="number" step="0.01" className={inputCls}
                value={form.costo} onChange={e => set('costo', e.target.value)}
                placeholder="0.00" />
            </div>

            <div>
              <label className={labelCls}>Prezzo vendita (€)</label>
              <input type="number" step="0.01" className={inputCls}
                value={form.prezzo_vendita} onChange={e => set('prezzo_vendita', e.target.value)}
                placeholder="0.00" />
            </div>

            <div className={form.fornitore === 'altro' ? '' : 'col-span-2'}>
              <label className={labelCls}>Fornitore</label>
              <select className={inputCls}
                value={form.fornitore} onChange={e => set('fornitore', e.target.value)}>
                {FORNITORI.map(f => <option key={f} value={f}>{f}</option>)}
              </select>
            </div>

            {form.fornitore === 'altro' && (
              <div>
                <label className={labelCls}>Specifica fornitore</label>
                <input className={inputCls}
                  value={form.fornitore_custom} onChange={e => set('fornitore_custom', e.target.value)}
                  placeholder="Nome fornitore..." />
              </div>
            )}

            <div className="col-span-2">
              <label className={labelCls}>Pagamento</label>
              <select className={inputCls}
                value={form.pagamento} onChange={e => set('pagamento', e.target.value)}>
                {PAGAMENTI.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>

            <div className="col-span-2">
              <label className={labelCls}>Note</label>
              <textarea className={`${inputCls} resize-none`} rows={3}
                value={form.note} onChange={e => set('note', e.target.value)}
                placeholder="Note libere..." />
            </div>

          </div>
        </div>

        {/* Footer fisso */}
        <div className="px-5 py-4 border-t border-[#333]">
          {error && <p className="text-red-400 text-sm mb-3">{error}</p>}
          <div className="flex gap-3">
            <button onClick={onClose}
              className="flex-1 py-4 rounded-xl border border-[#444] text-[#888] hover:text-white font-bold text-base transition-all">
              Annulla
            </button>
            <button onClick={handleSave} disabled={loading}
              className="flex-1 py-4 rounded-xl bg-[#E8162B] hover:bg-[#B01020] text-white font-bold text-base transition-all disabled:opacity-50">
              {loading ? 'Salvataggio...' : ordine ? 'Aggiorna' : 'Crea Ordine'}
            </button>
          </div>
        </div>

      </div>
    </div>
  )
}