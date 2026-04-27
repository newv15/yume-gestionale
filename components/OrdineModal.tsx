/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'
import { useState, useEffect, useCallback } from 'react'
import { X } from 'lucide-react'
import { supabase, Ordine } from '@/lib/supabase'

type Props = {
  ordine?: Ordine | null
  onClose: () => void
  onSaved: () => void
}

const STATI     = ['da cercare', 'ordinato', 'arrivato', 'completato']
const FORNITORI = ['manicomics', 'starshop', 'terminal', 'second hand', 'cubex', 'cardverse', 'altro']
const TIPI      = ['online', 'in store']
const PAGAMENTI = ['da saldare', 'pagato']

export default function OrdineModal({ ordine, onClose, onSaved }: Props) {
  const [loading, setLoading]            = useState(false)
  const [error, setError]                = useState('')
  const [fornitore, setFornitore]        = useState<any>(ordine?.fornitore ?? 'manicomics')
  const [showCustom, setShowCustom]      = useState((ordine?.fornitore ?? '') === 'altro')
  const [data, setData]                  = useState(ordine?.data ?? new Date().toISOString().split('T')[0])
  const [nomeCliente, setNomeCliente]    = useState(ordine?.nome_cliente ?? '')
  const [contatto, setContatto]          = useState(ordine?.contatto ?? '')
  const [tipoOrdine, setTipoOrdine]      = useState<any>(ordine?.tipo_ordine ?? 'in store')
  const [nomeArticolo, setNomeArticolo]  = useState(ordine?.nome_articolo ?? '')
  const [quantita, setQuantita]          = useState(String(ordine?.quantita ?? 1))
  const [costo, setCosto]                = useState(ordine?.costo != null ? String(ordine.costo) : '')
  const [prezzoVendita, setPrezzoVendita] = useState(ordine?.prezzo_vendita != null ? String(ordine.prezzo_vendita) : '')
  const [stato, setStato]                = useState<any>(ordine?.stato ?? 'da cercare')
  const [fornitoreCustom, setFornitoreCustom] = useState(ordine?.fornitore_custom ?? '')
  const [pagamento, setPagamento]        = useState<any>(ordine?.pagamento ?? 'da saldare')
  const [note, setNote]                  = useState(ordine?.note ?? '')

  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  useEffect(() => {
    setShowCustom(fornitore === 'altro')
  }, [fornitore])

  const handleSave = useCallback(async () => {
    if (!nomeArticolo.trim()) { setError('Il nome articolo è obbligatorio'); return }
    if (!nomeCliente.trim())  { setError('Il nome cliente è obbligatorio'); return }
    setLoading(true); setError('')
    const payload = {
      data,
      nome_cliente: nomeCliente,
      contatto: contatto || null,
      tipo_ordine: tipoOrdine,
      nome_articolo: nomeArticolo,
      quantita: Number(quantita) || 1,
      costo: costo !== '' ? Number(costo) : null,
      prezzo_vendita: prezzoVendita !== '' ? Number(prezzoVendita) : null,
      stato,
      fornitore,
      fornitore_custom: fornitore === 'altro' ? fornitoreCustom : null,
      pagamento,
      note: note || null,
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
  }, [data, nomeCliente, contatto, tipoOrdine, nomeArticolo, quantita, costo,
      prezzoVendita, stato, fornitore, fornitoreCustom, pagamento, note, ordine, onSaved])

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
    fontFamily: 'Nunito, sans-serif',
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

  return (
    <div style={{
      position: 'fixed',
      top: 0, left: 0, right: 0, bottom: 0,
      zIndex: 9999,
      background: 'rgba(0,0,0,0.9)',
      display: 'flex',
      alignItems: 'flex-end',
    }}>
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
        <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 0 4px', flexShrink: 0 }}>
          <div style={{ width: 44, height: 5, background: '#555', borderRadius: 99 }} />
        </div>

        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '10px 20px 14px', borderBottom: '1px solid #2a2a2a', flexShrink: 0,
        }}>
          <span style={{ fontFamily: 'Bangers, cursive', fontSize: 24, color: '#E8162B', letterSpacing: 2 }}>
            {ordine ? 'MODIFICA ORDINE' : 'NUOVO ORDINE'}
          </span>
          <button onClick={onClose} style={{
            background: '#2a2a2a', border: 'none', color: '#888',
            borderRadius: 10, padding: 8, cursor: 'pointer',
            display: 'flex', alignItems: 'center',
          }}>
            <X size={20} />
          </button>
        </div>

        {/* Campi scrollabili */}
        <div style={{
          flex: 1, overflowY: 'auto', overflowX: 'hidden',
          padding: '16px 20px',
        }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={lbl}>Data</label>
                <input type="date" style={inp}
                  value={data} onChange={e => setData(e.target.value)} />
              </div>
              <div>
                <label style={lbl}>Tipo ordine</label>
                <select style={inp}
                  value={tipoOrdine} onChange={e => setTipoOrdine(e.target.value)}>
                  {TIPI.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={lbl}>Nome cliente *</label>
                <input style={inp}
                  value={nomeCliente} onChange={e => setNomeCliente(e.target.value)}
                  placeholder="Mario Rossi" autoComplete="off" />
              </div>
              <div>
                <label style={lbl}>Contatto</label>
                <input style={inp}
                  value={contatto} onChange={e => setContatto(e.target.value)}
                  placeholder="Tel / Instagram" autoComplete="off" />
              </div>
            </div>

            <div>
              <label style={lbl}>Nome articolo *</label>
              <input style={inp}
                value={nomeArticolo} onChange={e => setNomeArticolo(e.target.value)}
                placeholder="One Piece Vol. 1..." autoComplete="off" />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={lbl}>Quantità</label>
                <input type="number" min={1} style={inp}
                  value={quantita} onChange={e => setQuantita(e.target.value)} />
              </div>
              <div>
                <label style={lbl}>Stato</label>
                <select style={inp}
                  value={stato} onChange={e => setStato(e.target.value)}>
                  {STATI.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={lbl}>Costo acquisto (€)</label>
                <input type="number" step="0.01" style={inp}
                  value={costo} onChange={e => setCosto(e.target.value)}
                  placeholder="0.00" />
              </div>
              <div>
                <label style={lbl}>Prezzo vendita (€)</label>
                <input type="number" step="0.01" style={inp}
                  value={prezzoVendita} onChange={e => setPrezzoVendita(e.target.value)}
                  placeholder="0.00" />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: showCustom ? '1fr 1fr' : '1fr', gap: 12 }}>
              <div>
                <label style={lbl}>Fornitore</label>
                <select style={inp}
                  value={fornitore} onChange={e => setFornitore(e.target.value)}>
                  {FORNITORI.map(f => <option key={f} value={f}>{f}</option>)}
                </select>
              </div>
              {showCustom && (
                <div>
                  <label style={lbl}>Specifica fornitore</label>
                  <input style={inp}
                    value={fornitoreCustom} onChange={e => setFornitoreCustom(e.target.value)}
                    placeholder="Nome fornitore..." />
                </div>
              )}
            </div>

            <div>
              <label style={lbl}>Pagamento</label>
              <select style={inp}
                value={pagamento} onChange={e => setPagamento(e.target.value)}>
                {PAGAMENTI.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>

            <div>
              <label style={lbl}>Note</label>
              <textarea style={{ ...inp, resize: 'none' }} rows={4}
                value={note} onChange={e => setNote(e.target.value)}
                placeholder="Note libere..." />
            </div>

          </div>
        </div>

        {/* Footer */}
        <div style={{
          padding: '16px 20px',
          paddingBottom: 'max(16px, env(safe-area-inset-bottom))',
          borderTop: '1px solid #2a2a2a',
          flexShrink: 0,
          background: '#1A1A1A',
        }}>
          {error && <p style={{ color: '#f87171', fontSize: 13, marginBottom: 12 }}>{error}</p>}
          <div style={{ display: 'flex', gap: 12 }}>
            <button onClick={onClose} style={{
              flex: 1, padding: '17px 0', borderRadius: 14,
              border: '1px solid #444', background: 'transparent',
              color: '#aaa', fontWeight: 700, fontSize: 16, cursor: 'pointer',
              fontFamily: 'Nunito, sans-serif',
            }}>
              Annulla
            </button>
            <button onClick={handleSave} disabled={loading} style={{
              flex: 1, padding: '17px 0', borderRadius: 14,
              border: 'none', background: loading ? '#555' : '#E8162B',
              color: 'white', fontWeight: 700, fontSize: 16, cursor: 'pointer',
              fontFamily: 'Nunito, sans-serif',
            }}>
              {loading ? 'Salvataggio...' : ordine ? 'Aggiorna' : 'Crea Ordine'}
            </button>
          </div>
        </div>

      </div>
    </div>
  )
}