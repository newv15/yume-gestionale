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
  const [form, setForm]       = useState<FormState>(emptyForm)
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')

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

  const inp: React.CSSProperties = {
    width: '100%',
    background: '#0F0F0F',
    border: '1px solid #444',
    color: 'white',
    borderRadius: '10px',
    padding: '12px 14px',
    fontSize: '16px',
    outline: 'none',
    boxSizing: 'border-box',
  }

  const lbl: React.CSSProperties = {
    display: 'block',
    fontSize: '11px',
    color: '#888',
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    marginBottom: '6px',
  }

  const row: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '14px',
  }

  const full: React.CSSProperties = {
    gridColumn: '1 / -1',
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 50,
      display: 'flex', flexDirection: 'column',
      justifyContent: 'flex-end',
      background: 'rgba(0,0,0,0.85)',
    }}>
      {/* Backdrop */}
      <div style={{ position: 'absolute', inset: 0 }} onClick={onClose} />

      {/* Modal */}
      <div style={{
        position: 'relative',
        background: '#1A1A1A',
        width: '100%',
        maxWidth: '680px',
        margin: '0 auto',
        borderRadius: '20px 20px 0 0',
        display: 'flex',
        flexDirection: 'column',
        maxHeight: '90vh',
      }}>
        {/* Handle */}
        <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 0 4px' }}>
          <div style={{ width: 40, height: 4, background: '#444', borderRadius: 99 }} />
        </div>

        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '12px 20px 16px', borderBottom: '1px solid #333',
        }}>
          <span style={{ fontFamily: 'Bangers, cursive', fontSize: 26, color: '#E8162B', letterSpacing: 2 }}>
            {ordine ? 'MODIFICA ORDINE' : 'NUOVO ORDINE'}
          </span>
          <button onClick={onClose} style={{
            background: '#242424', border: 'none', color: '#888',
            borderRadius: 10, padding: '8px', cursor: 'pointer', display: 'flex',
          }}>
            <X size={20} />
          </button>
        </div>

        {/* Form */}
        <div style={{ overflowY: 'auto', flex: 1, padding: '16px 20px' }}>
          <div style={row}>

            <div><label style={lbl}>Data</label>
              <input type="date" style={inp} value={form.data} onChange={e => set('data', e.target.value)} />
            </div>

            <div><label style={lbl}>Tipo ordine</label>
              <select style={inp} value={form.tipo_ordine} onChange={e => set('tipo_ordine', e.target.value)}>
                {TIPI.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>

            <div><label style={lbl}>Nome cliente *</label>
              <input style={inp} value={form.nome_cliente} onChange={e => set('nome_cliente', e.target.value)} placeholder="Mario Rossi" />
            </div>

            <div><label style={lbl}>Contatto</label>
              <input style={inp} value={form.contatto} onChange={e => set('contatto', e.target.value)} placeholder="Tel / Instagram" />
            </div>

            <div style={full}><label style={lbl}>Nome articolo *</label>
              <input style={inp} value={form.nome_articolo} onChange={e => set('nome_articolo', e.target.value)} placeholder="One Piece Vol. 1..." />
            </div>

            <div><label style={lbl}>Quantità</label>
              <input type="number" min={1} style={inp} value={form.quantita} onChange={e => set('quantita', e.target.value)} />
            </div>

            <div><label style={lbl}>Stato</label>
              <select style={inp} value={form.stato} onChange={e => set('stato', e.target.value)}>
                {STATI.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>

            <div><label style={lbl}>Costo acquisto (€)</label>
              <input type="number" step="0.01" style={inp} value={form.costo} onChange={e => set('costo', e.target.value)} placeholder="0.00" />
            </div>

            <div><label style={lbl}>Prezzo vendita (€)</label>
              <input type="number" step="0.01" style={inp} value={form.prezzo_vendita} onChange={e => set('prezzo_vendita', e.target.value)} placeholder="0.00" />
            </div>

            <div style={form.fornitore === 'altro' ? {} : full}>
              <label style={lbl}>Fornitore</label>
              <select style={inp} value={form.fornitore} onChange={e => set('fornitore', e.target.value)}>
                {FORNITORI.map(f => <option key={f} value={f}>{f}</option>)}
              </select>
            </div>

            {form.fornitore === 'altro' && (
              <div><label style={lbl}>Specifica fornitore</label>
                <input style={inp} value={form.fornitore_custom} onChange={e => set('fornitore_custom', e.target.value)} placeholder="Nome fornitore..." />
              </div>
            )}

            <div style={full}><label style={lbl}>Pagamento</label>
              <select style={inp} value={form.pagamento} onChange={e => set('pagamento', e.target.value)}>
                {PAGAMENTI.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>

            <div style={full}><label style={lbl}>Note</label>
              <textarea style={{ ...inp, resize: 'none' }} rows={3}
                value={form.note} onChange={e => set('note', e.target.value)} placeholder="Note libere..." />
            </div>

          </div>
        </div>

        {/* Footer */}
        <div style={{ padding: '16px 20px', borderTop: '1px solid #333' }}>
          {error && <p style={{ color: '#f87171', fontSize: 14, marginBottom: 12 }}>{error}</p>}
          <div style={{ display: 'flex', gap: 12 }}>
            <button onClick={onClose} style={{
              flex: 1, padding: '16px', borderRadius: 12,
              border: '1px solid #444', background: 'transparent',
              color: '#888', fontWeight: 700, fontSize: 16, cursor: 'pointer',
            }}>
              Annulla
            </button>
            <button onClick={handleSave} disabled={loading} style={{
              flex: 1, padding: '16px', borderRadius: 12,
              border: 'none', background: loading ? '#888' : '#E8162B',
              color: 'white', fontWeight: 700, fontSize: 16, cursor: 'pointer',
            }}>
              {loading ? 'Salvataggio...' : ordine ? 'Aggiorna' : 'Crea Ordine'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}