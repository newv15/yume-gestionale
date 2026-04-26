'use client'
import { useState, useRef } from 'react'
import Papa from 'papaparse'
import { supabase } from '@/lib/supabase'
import { Upload, X, CheckCircle, AlertCircle, FileText } from 'lucide-react'

type Props = {
  onClose: () => void
  onDone: () => void
}

type RigaCSV = {
  data?: string
  nome_cliente?: string
  contatto?: string
  tipo_ordine?: string
  nome_articolo?: string
  quantita?: string
  costo?: string
  prezzo_vendita?: string
  stato?: string
  fornitore?: string
  pagamento?: string
  note?: string
}

type Risultato = {
  totale: number
  importati: number
  errori: string[]
}

const STATI_VALIDI = ['da cercare', 'ordinato', 'arrivato', 'completato']
const FORNITORI_VALIDI = ['manicomics', 'starshop', 'terminal', 'second hand', 'cubex', 'altro']
const PAGAMENTI_VALIDI = ['pagato', 'da saldare']
const TIPI_VALIDI = ['online', 'in store']

function normalizza(val: string | undefined, opzioni: string[], fallback: string): string {
  if (!val) return fallback
  const v = val.trim().toLowerCase()
  return opzioni.find(o => o === v) || fallback
}

function normalizzaData(val: string | undefined): string {
  if (!val) return new Date().toISOString().split('T')[0]
  // Prova vari formati: DD/MM/YYYY, YYYY-MM-DD, MM/DD/YYYY
  const pulita = val.trim()
  if (/^\d{4}-\d{2}-\d{2}$/.test(pulita)) return pulita
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(pulita)) {
    const [d, m, y] = pulita.split('/')
    return `${y}-${m}-${d}`
  }
  return new Date().toISOString().split('T')[0]
}

function normalizzaNumero(val: string | undefined): number | null {
  if (!val || val.trim() === '') return null
  const n = parseFloat(val.replace(',', '.').replace(/[^0-9.]/g, ''))
  return isNaN(n) ? null : n
}

export default function ImportCSV({ onClose, onDone }: Props) {
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<RigaCSV[]>([])
  const [loading, setLoading] = useState(false)
  const [risultato, setRisultato] = useState<Risultato | null>(null)
  const [step, setStep] = useState<'upload' | 'preview' | 'done'>('upload')
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFile = (f: File) => {
    setFile(f)
    Papa.parse<RigaCSV>(f, {
      header: true,
      skipEmptyLines: true,
      complete: (res) => {
        setPreview(res.data.slice(0, 5)) // mostra solo le prime 5 come preview
        setStep('preview')
      }
    })
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const f = e.dataTransfer.files[0]
    if (f && f.name.endsWith('.csv')) handleFile(f)
  }

  const handleImport = async () => {
    if (!file) return
    setLoading(true)
    const errori: string[] = []
    let importati = 0

    Papa.parse<RigaCSV>(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (res) => {
        const righe = res.data
        const BATCH = 50 // importa 50 righe alla volta

        for (let i = 0; i < righe.length; i += BATCH) {
          const chunk = righe.slice(i, i + BATCH)
          const payload = chunk.map((r, idx) => {
            const riga = i + idx + 2 // +2 perché riga 1 è header
            if (!r.nome_articolo?.trim()) {
              errori.push(`Riga ${riga}: nome_articolo mancante — saltata`)
              return null
            }
            if (!r.nome_cliente?.trim()) {
              errori.push(`Riga ${riga}: nome_cliente mancante — saltata`)
              return null
            }
            const fornitore = normalizza(r.fornitore, FORNITORI_VALIDI, 'altro')
            return {
              data: normalizzaData(r.data),
              nome_cliente: r.nome_cliente.trim(),
              contatto: r.contatto?.trim() || null,
              tipo_ordine: normalizza(r.tipo_ordine, TIPI_VALIDI, 'online'),
              nome_articolo: r.nome_articolo.trim(),
              quantita: parseInt(r.quantita || '1') || 1,
              costo: normalizzaNumero(r.costo),
              prezzo_vendita: normalizzaNumero(r.prezzo_vendita),
              stato: normalizza(r.stato, STATI_VALIDI, 'da cercare'),
              fornitore,
              fornitore_custom: fornitore === 'altro' ? (r.fornitore?.trim() || null) : null,
              pagamento: normalizza(r.pagamento, PAGAMENTI_VALIDI, 'da saldare'),
              note: r.note?.trim() || null,
            }
          }).filter(Boolean)

          if (payload.length > 0) {
            const { error } = await supabase.from('ordini').insert(payload)
            if (error) {
              errori.push(`Batch ${Math.floor(i/BATCH)+1}: ${error.message}`)
            } else {
              importati += payload.length
            }
          }
        }

        setRisultato({ totale: res.data.length, importati, errori })
        setLoading(false)
        setStep('done')
      }
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/70 backdrop-blur-sm p-0 md:p-4">
      <div className="bg-[#1A1A1A] border border-[#333] rounded-t-2xl md:rounded-2xl w-full md:max-w-xl max-h-[90vh] overflow-y-auto animate-fadeIn">

        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[#333]">
          <h2 className="font-manga text-2xl text-[#E8162B]">IMPORT CSV</h2>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-[#333] text-[#888]"><X size={20} /></button>
        </div>

        <div className="p-4">

          {/* STEP: UPLOAD */}
          {step === 'upload' && (
            <div>
              <p className="text-[#888] text-sm mb-4">
                Carica il file CSV esportato dal tuo foglio. Le colonne devono avere questi nomi nella prima riga:
              </p>
              <div className="bg-[#0F0F0F] rounded-xl p-3 mb-4 overflow-x-auto">
                <code className="text-[#E8162B] text-xs whitespace-nowrap">
                  data, nome_cliente, contatto, tipo_ordine, nome_articolo, quantita, costo, prezzo_vendita, stato, fornitore, pagamento, note
                </code>
              </div>

              {/* Drop zone */}
              <div
                onDrop={handleDrop}
                onDragOver={e => e.preventDefault()}
                onClick={() => inputRef.current?.click()}
                className="border-2 border-dashed border-[#444] hover:border-[#E8162B] rounded-xl p-10 text-center cursor-pointer transition-colors group"
              >
                <Upload size={32} className="mx-auto mb-3 text-[#555] group-hover:text-[#E8162B] transition-colors" />
                <p className="text-white font-semibold">Trascina il file qui</p>
                <p className="text-[#888] text-sm mt-1">oppure clicca per selezionare</p>
                <p className="text-[#555] text-xs mt-2">Solo file .csv</p>
                <input
                  ref={inputRef}
                  type="file"
                  accept=".csv"
                  className="hidden"
                  onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])}
                />
              </div>
            </div>
          )}

          {/* STEP: PREVIEW */}
          {step === 'preview' && (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <FileText size={18} className="text-[#E8162B]" />
                <p className="text-white font-semibold">{file?.name}</p>
              </div>
              <p className="text-[#888] text-sm mb-3">
                Anteprima delle prime 5 righe — controlla che i dati siano corretti prima di importare:
              </p>

              <div className="overflow-x-auto rounded-xl border border-[#333] mb-4">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-[#0F0F0F] border-b border-[#333]">
                      {['Cliente', 'Articolo', 'Data', 'Stato', 'Fornitore'].map(h => (
                        <th key={h} className="px-3 py-2 text-left text-[#888] font-semibold uppercase tracking-wider whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#242424]">
                    {preview.map((r, i) => (
                      <tr key={i} className="hover:bg-[#242424]">
                        <td className="px-3 py-2 text-white whitespace-nowrap">{r.nome_cliente || '—'}</td>
                        <td className="px-3 py-2 text-white max-w-[140px] truncate">{r.nome_articolo || '—'}</td>
                        <td className="px-3 py-2 text-[#888] whitespace-nowrap">{r.data || '—'}</td>
                        <td className="px-3 py-2 text-[#888] whitespace-nowrap">{r.stato || '—'}</td>
                        <td className="px-3 py-2 text-[#888] whitespace-nowrap">{r.fornitore || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex gap-3">
                <button onClick={() => setStep('upload')} className="flex-1 py-3 rounded-xl border border-[#444] text-[#888] font-bold">
                  Cambia file
                </button>
                <button onClick={handleImport} disabled={loading}
                  className="flex-1 py-3 rounded-xl bg-[#E8162B] text-white font-bold disabled:opacity-50 flex items-center justify-center gap-2">
                  {loading ? (
                    <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Importazione...</>
                  ) : (
                    <><Upload size={16} /> Importa tutto</>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* STEP: DONE */}
          {step === 'done' && risultato && (
            <div className="text-center py-4">
              <CheckCircle size={48} className="mx-auto mb-4 text-green-400" />
              <h3 className="font-manga text-2xl text-white mb-1">IMPORTAZIONE COMPLETATA</h3>
              <p className="text-[#888] text-sm mb-6">
                {risultato.importati} ordini importati su {risultato.totale} righe totali
              </p>

              {risultato.errori.length > 0 && (
                <div className="bg-red-900/20 border border-red-800/40 rounded-xl p-4 mb-6 text-left">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertCircle size={16} className="text-red-400" />
                    <p className="text-red-400 text-sm font-semibold">{risultato.errori.length} righe saltate</p>
                  </div>
                  <div className="space-y-1 max-h-32 overflow-y-auto">
                    {risultato.errori.map((e, i) => (
                      <p key={i} className="text-red-300 text-xs">{e}</p>
                    ))}
                  </div>
                </div>
              )}

              <button onClick={onDone}
                className="w-full py-3 rounded-xl bg-[#E8162B] text-white font-bold">
                Vai agli ordini
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}