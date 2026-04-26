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
    // Blocca lo scroll del body quando il modal è aperto
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

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
    padding: '14px',
    fontSize: '16px',
    outline: 'none',
    boxSizing: 'border-box',
    WebkitAppearance: 'none',
  }

  const lbl: React.CSSProperties = {
    display: 'block',
    fontSize: '11px',
    color: '#888',
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    marginBottom: '8px',
  }

  const Field = ({ label, children, full }: { label: string; children: React.ReactNode; full?: boolean }) => (
    <div style={{ gridColumn: full ? '1 / -1' : undefined }}>
      <label style={lbl}>{label}</label>
      {children}
    </div>
  )

  return (
    <div style={{
      position: 'fixed',
      top: 0, left: 0, right: 0, bottom: 0,
      zIndex: 9999,
      background: 'rgba(0,0,0,0.9)',
      display: 'flex',
      alignItems: 'flex-end',
    }}>
      {/* Modal — occupa 95% dell'altezza schermo */}
      <div style={{
        width: '100%',
        height: '95vh',
        background: '#1A1A1A',
        borderRadius: '20px 20px 0 0',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}>

        {/* Handle */}
        <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 12, paddingBottom: 4, flexShrink: 0 }}>
          <div style={{ width: 44, height: 5, background: '#555', borderRadius: 99 }} />
        </div>

        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '10px 20px 14px', borderBottom: '1px solid #2a2a2a', flexShrink: 0,
        }}>
          <span style={{
            fontFamily: 'Bangers, cursive', fontSize: 24,
            color: '#E8162B', letterSpacing: 2,
          }}>
            {ordine ? 'MODIFICA ORDINE' : 'NUOVO ORDINE'}
          </span>
          <button onClick={onClose} style={{
            background: '#2a2a2a', border: 'none', color: '#888',
            borderRadius: 10, padding: 8, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <X size={20} />
          </button>
        </div>

        {/* Campi — scrollabile */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          overflowX: 'hidden',
          padding: '16px 20px',
          WebkitOverflowScrolling: 'touch',
        }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 16,
          }}>
            <Field label="Data">
              <input type="date" style={inp} value={form.data}
                onChange={e => set('data', e.target.value)} />
            </Field>

            <Field label="Tipo ordine">
              <select style={inp} value={form.tipo_ordine}
                onChange={e => set('tipo_ordine', e.target.value)}>
                {TIPI.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </Field>

            <Field label="Nome cliente *">
              <input style={inp} value={form.nome_cliente}
                onChange={e => set('nome_cliente', e.target.value)}
                placeholder="Mario Rossi" />
            </Field>

            <Field label="Contatto">
              <input style={inp} value={form.contatto}
                onChange={e => set('contatto', e.target.value)}
                placeholder="Tel / Instagram" />
            </Field>

            <Field label="Nome articolo *" full>
              <input style={inp} value={form.nome_articolo}
                onChange={e => set('nome_articolo', e.target.value)}
                placeholder="One Piece Vol. 1..." />
            </Field>

            <Field label="Quantità">
              <input type="number" min={1} style={inp} value={form.quantita}
                onChange={e => set('quantita', e.target.value)} />
            </Field>

            <Field label="Stato">
              <select style={inp} value={form.stato}
                onChange={e => set('stato', e.target.value)}>
                {STATI.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </Field>

            <Field label="Costo acquisto (€)">
              <input type="number" step="0.01" style={inp} value={form.costo}
                onChange={e => set('costo', e.target.value)} placeholder="0.00" />
            </Field>

            <Field label="Prezzo vendita (€)">
              <input type="number" step="0.01" style={inp} value={form.prezzo_vendita}
                onChange={e => set('prezzo_vendita', e.target.value)} placeholder="0.00" />
            </Field>

            <Field label="Fornitore" full={form.fornitore !== 'altro'}>
              <select style={inp} value={form.fornitore}
                onChange={e => set('fornitore', e.target.value)}>
                {FORNITORI.map(f => <option key={f} value={f}>{f}</option>)}
              </select>
            </Field>

            {form.fornitore === 'altro' && (
              <Field label="Specifica fornitore">
                <input style={inp} value={form.fornitore_custom}
                  onChange={e => set('fornitore_custom', e.target.value)}
                  placeholder="Nome fornitore..." />
              </Field>
            )}

            <Field label="Pagamento" full>
              <select style={inp} value={form.pagamento}
                onChange={e => set('pagamento', e.target.value)}>
                {PAGAMENTI.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </Field>

            <Field label="Note" full>
              <textarea style={{ ...inp, resize: 'none' }} rows={4}
                value={form.note}
                onChange={e => set('note', e.target.value)}
                placeholder="Note libere..." />
            </Field>
          </div>
        </div>

        {/* Footer fisso in fondo */}
        <div style={{
          padding: '16px 20px',
          paddingBottom: 'max(16px, env(safe-area-inset-bottom))',
          borderTop: '1px solid #2a2a2a',
          flexShrink: 0,
          background: '#1A1A1A',
        }}>
          {error && (
            <p style={{ color: '#f87171', fontSize: 13, marginBottom: 12 }}>{error}</p>
          )}
          <div style={{ display: 'flex', gap: 12 }}>
            <button onClick={onClose} style={{
              flex: 1, padding: '17px 0', borderRadius: 14,
              border: '1px solid #444', background: 'transparent',
              color: '#aaa', fontWeight: 700, fontSize: 16, cursor: 'pointer',
            }}>
              Annulla
            </button>
            <button onClick={handleSave} disabled={loading} style={{
              flex: 1, padding: '17px 0', borderRadius: 14,
              border: 'none',
              background: loading ? '#555' : '#E8162B',
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