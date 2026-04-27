'use client'
import { useEffect, useState, useCallback } from 'react'
import { supabase, Ordine } from '@/lib/supabase'
import Navbar from '@/components/Navbar'
import OrdineModal from '@/components/OrdineModal'
import ImportCSV from '@/components/ImportCSV'
import ExportTools from '@/components/ExportTools'
import { Plus, Search, Filter, Pencil, Trash2, X, Upload, ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react'

const STATI     = ['da cercare', 'ordinato', 'arrivato', 'completato']
const FORNITORI = ['manicomics', 'starshop', 'terminal', 'second hand', 'cubex', 'cardverse', 'altro']
const PAGAMENTI = ['pagato', 'da saldare']
const TIPI      = ['online', 'in store']

type SortField = 'data' | 'nome_cliente' | 'nome_articolo' | 'quantita' | 'stato' | 'fornitore' | 'pagamento' | 'tot_prezzo_vendita'
type SortDir   = 'asc' | 'desc'

export default function OrdiniPage() {
  const [ordini, setOrdini]           = useState<Ordine[]>([])
  const [loading, setLoading]         = useState(true)
  const [modal, setModal]             = useState(false)
  const [editing, setEditing]         = useState<Ordine | null>(null)
  const [deleting, setDeleting]       = useState<string | null>(null)
  const [importModal, setImportModal] = useState(false)
  const [showFilters, setShowFilters] = useState(false)

  // Ricerca
  const [search, setSearch] = useState('')

  // Filtri multiselezione
  const [fStato,     setFStato]     = useState<string[]>([])
  const [fFornitore, setFFornitore] = useState<string[]>([])
  const [fPagamento, setFPagamento] = useState<string[]>([])
  const [fTipo,      setFTipo]      = useState<string[]>([])

  // Ordinamento
  const [sortField, setSortField] = useState<SortField>('data')
  const [sortDir,   setSortDir]   = useState<SortDir>('desc')

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDir('asc')
    }
  }

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <ChevronsUpDown size={12} className="text-[#555]" />
    return sortDir === 'asc'
      ? <ChevronUp size={12} className="text-[#E8162B]" />
      : <ChevronDown size={12} className="text-[#E8162B]" />
  }

  const load = useCallback(async () => {
    setLoading(true)
    let q = supabase
      .from('ordini')
      .select('*')
      .order(sortField, { ascending: sortDir === 'asc' })

    if (fStato.length > 0)     q = q.in('stato', fStato)
    if (fFornitore.length > 0) q = q.in('fornitore', fFornitore)
    if (fPagamento.length > 0) q = q.in('pagamento', fPagamento)
    if (fTipo.length > 0)      q = q.in('tipo_ordine', fTipo)

    const { data } = await q
    let result: Ordine[] = (data || []) as Ordine[]

    if (search.trim()) {
      const s = search.toLowerCase()
      result = result.filter(o =>
        o.nome_articolo.toLowerCase().includes(s) ||
        o.nome_cliente.toLowerCase().includes(s) ||
        (o.contatto || '').toLowerCase().includes(s)
      )
    }

    setOrdini(result)
    setLoading(false)
  }, [search, fStato, fFornitore, fPagamento, fTipo, sortField, sortDir])

  useEffect(() => { load() }, [load])

  const handleDelete = async (id: string) => {
    if (!confirm('Eliminare questo ordine?')) return
    setDeleting(id)
    await supabase.from('ordini').delete().eq('id', id)
    setDeleting(null)
    load()
  }

  const toggleFiltro = (
    val: string,
    current: string[],
    setter: React.Dispatch<React.SetStateAction<string[]>>
  ) => {
    setter(current.includes(val) ? current.filter(v => v !== val) : [...current, val])
  }

  const activeFilters = [fStato, fFornitore, fPagamento, fTipo].filter(a => a.length > 0).length

  const statoBadge = (s: string) => {
    const map: Record<string, string> = {
      'da cercare': 'stato-da-cercare',
      'ordinato':   'stato-ordinato',
      'arrivato':   'stato-arrivato',
      'completato': 'stato-completato',
    }
    return (
      <span className={`text-xs px-2 py-1 rounded-full font-bold whitespace-nowrap ${map[s] || ''}`}>
        {s}
      </span>
    )
  }

  const pagBadge = (p: string) => (
    <span className={`text-xs px-2 py-1 rounded-full font-bold ${p === 'pagato' ? 'pag-pagato' : 'pag-da-saldare'}`}>
      {p}
    </span>
  )

  const filtroLabel = [
    ...fStato, ...fFornitore, ...fPagamento, ...fTipo
  ].join(', ')

  const colHeaders: { label: string; field: SortField }[] = [
    { label: 'Data',      field: 'data' },
    { label: 'Cliente',   field: 'nome_cliente' },
    { label: 'Articolo',  field: 'nome_articolo' },
    { label: 'Qtà',       field: 'quantita' },
    { label: 'Stato',     field: 'stato' },
    { label: 'Fornitore', field: 'fornitore' },
    { label: 'Pagamento', field: 'pagamento' },
    { label: 'Tot €',     field: 'tot_prezzo_vendita' },
  ]

  return (
    <div className="min-h-screen bg-[#0F0F0F]">
      <Navbar />
      <main className="max-w-7xl mx-auto px-3 py-5 pb-24 md:pb-6">

        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <h1 className="font-manga text-4xl text-white tracking-wider">
              ORDINI<span className="text-[#E8162B]">.</span>
            </h1>
            <p className="text-[#888] text-xs mt-0.5">{ordini.length} risultati</p>
          </div>
          <div className="flex gap-2">
            <ExportTools ordini={ordini} filtroAttivo={filtroLabel} />
            <button
              onClick={() => setImportModal(true)}
              className="flex items-center gap-2 border border-[#444] hover:border-[#E8162B] text-[#888] hover:text-white px-3 py-2.5 rounded-xl font-bold text-sm transition-all">
              <Upload size={16} />
              <span className="hidden md:inline">Import CSV</span>
            </button>
            <button
              onClick={() => { setEditing(null); setModal(true) }}
              className="flex items-center gap-2 bg-[#E8162B] hover:bg-[#B01020] text-white px-4 py-2.5 rounded-xl font-bold text-sm transition-all pulse-red">
              <Plus size={18} /> Nuovo
            </button>
          </div>
        </div>

        {/* Search + pulsante filtri */}
        <div className="mb-4 space-y-3">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#888]" />
              <input
                className="w-full bg-[#1A1A1A] border border-[#333] rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder-[#666] focus:outline-none focus:border-[#E8162B] transition-colors"
                placeholder="Cerca articolo, cliente..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
              {search && (
                <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#888]">
                  <X size={14} />
                </button>
              )}
            </div>
            <button
              onClick={() => setShowFilters(p => !p)}
              className={`flex items-center gap-1.5 px-3 py-2.5 rounded-xl border text-sm font-bold transition-all
                ${showFilters || activeFilters > 0
                  ? 'bg-[#E8162B] border-[#E8162B] text-white'
                  : 'border-[#333] text-[#888] hover:text-white hover:border-[#666]'}`}>
              <Filter size={16} />
              {activeFilters > 0 && (
                <span className="bg-white text-[#E8162B] text-xs w-4 h-4 rounded-full flex items-center justify-center font-bold">
                  {activeFilters}
                </span>
              )}
            </button>
          </div>

          {/* Pannello filtri multiselezione */}
          {showFilters && (
            <div className="bg-[#1A1A1A] border border-[#333] rounded-2xl p-4 animate-fadeIn">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                {[
                  { label: 'Stato',     vals: fStato,     set: setFStato,     opts: STATI },
                  { label: 'Fornitore', vals: fFornitore, set: setFFornitore, opts: FORNITORI },
                  { label: 'Pagamento', vals: fPagamento, set: setFPagamento, opts: PAGAMENTI },
                  { label: 'Tipo',      vals: fTipo,      set: setFTipo,      opts: TIPI },
                ].map(f => (
                  <div key={f.label}>
                    <p className="text-xs text-[#888] font-semibold uppercase tracking-wider mb-2">
                      {f.label}
                    </p>
                    <div className="space-y-2">
                      {f.opts.map(opt => {
                        const selected = f.vals.includes(opt)
                        return (
                          <label key={opt}
                            className="flex items-center gap-2 cursor-pointer group"
                            onClick={() => toggleFiltro(opt, f.vals, f.set)}>
                            <div className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 transition-all
                              ${selected
                                ? 'bg-[#E8162B] border-[#E8162B]'
                                : 'border-[#555] group-hover:border-[#E8162B]'}`}>
                              {selected && (
                                <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                                  <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
                                </svg>
                              )}
                            </div>
                            <span className={`text-sm capitalize transition-colors
                              ${selected ? 'text-white' : 'text-[#888] group-hover:text-white'}`}>
                              {opt}
                            </span>
                          </label>
                        )
                      })}
                    </div>
                    {f.vals.length > 0 && (
                      <button
                        onClick={() => f.set([])}
                        className="text-xs text-[#E8162B] hover:underline mt-2 block">
                        Azzera
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Tabella desktop */}
        <div className="hidden md:block bg-[#1A1A1A] border border-[#333] rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#333] text-[#888] text-xs uppercase tracking-wider">
                  {colHeaders.map(({ label, field }) => (
                    <th key={field}
                      onClick={() => handleSort(field)}
                      className="px-4 py-3 text-left font-semibold whitespace-nowrap cursor-pointer hover:text-white transition-colors select-none">
                      <div className="flex items-center gap-1">
                        {label}
                        <SortIcon field={field} />
                      </div>
                    </th>
                  ))}
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-[#242424]">
                {loading && (
                  <tr>
                    <td colSpan={9} className="text-center py-12">
                      <div className="w-6 h-6 border-2 border-[#E8162B] border-t-transparent rounded-full animate-spin mx-auto" />
                    </td>
                  </tr>
                )}
                {!loading && ordini.length === 0 && (
                  <tr>
                    <td colSpan={9} className="text-center py-12 text-[#888]">
                      Nessun ordine trovato
                    </td>
                  </tr>
                )}
                {ordini.map(o => (
                  <tr key={o.id} className="hover:bg-[#242424] transition-colors">
                    <td className="px-4 py-3 text-[#888] whitespace-nowrap">{o.data}</td>
                    <td className="px-4 py-3">
                      <p className="text-white font-semibold">{o.nome_cliente}</p>
                      {o.contatto && <p className="text-[#888] text-xs">{o.contatto}</p>}
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-white max-w-[200px] truncate">{o.nome_articolo}</p>
                      <p className="text-[#888] text-xs">{o.tipo_ordine}</p>
                    </td>
                    <td className="px-4 py-3 text-white text-center">{o.quantita}</td>
                    <td className="px-4 py-3">{statoBadge(o.stato)}</td>
                    <td className="px-4 py-3 text-[#888] text-xs">
                      {o.fornitore === 'altro' ? (o.fornitore_custom || 'altro') : o.fornitore}
                    </td>
                    <td className="px-4 py-3">{pagBadge(o.pagamento)}</td>
                    <td className="px-4 py-3 text-white font-semibold whitespace-nowrap">
                      {o.tot_prezzo_vendita > 0 ? `€${Number(o.tot_prezzo_vendita).toFixed(2)}` : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        <button
                          onClick={() => { setEditing(o); setModal(true) }}
                          className="p-1.5 rounded-lg hover:bg-[#333] text-[#888] hover:text-white transition-colors">
                          <Pencil size={14} />
                        </button>
                        <button
                          onClick={() => handleDelete(o.id)}
                          disabled={deleting === o.id}
                          className="p-1.5 rounded-lg hover:bg-red-900/30 text-[#888] hover:text-red-400 transition-colors disabled:opacity-40">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Card mobile */}
        <div className="md:hidden space-y-3">
          {loading && (
            <div className="flex justify-center py-10">
              <div className="w-6 h-6 border-2 border-[#E8162B] border-t-transparent rounded-full animate-spin" />
            </div>
          )}
          {!loading && ordini.length === 0 && (
            <p className="text-center text-[#888] py-10">Nessun ordine trovato</p>
          )}
          {ordini.map(o => (
            <div key={o.id} className="bg-[#1A1A1A] border border-[#333] rounded-xl p-4 animate-fadeIn">
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1 min-w-0 mr-2">
                  <p className="text-white font-bold truncate">{o.nome_articolo}</p>
                  <p className="text-[#888] text-xs">{o.nome_cliente} · {o.data}</p>
                </div>
                <div className="flex gap-1 flex-shrink-0">
                  <button
                    onClick={() => { setEditing(o); setModal(true) }}
                    className="p-2 rounded-lg bg-[#242424] text-[#888]">
                    <Pencil size={14} />
                  </button>
                  <button
                    onClick={() => handleDelete(o.id)}
                    className="p-2 rounded-lg bg-[#242424] text-[#888]">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
              <div className="flex flex-wrap gap-2 mt-2">
                {statoBadge(o.stato)}
                {pagBadge(o.pagamento)}
                <span className="text-xs px-2 py-1 bg-[#242424] text-[#888] rounded-full">
                  {o.fornitore === 'altro' ? (o.fornitore_custom || 'altro') : o.fornitore}
                </span>
                {o.tot_prezzo_vendita > 0 && (
                  <span className="text-xs px-2 py-1 bg-[#242424] text-[#FFD700] rounded-full font-bold">
                    €{Number(o.tot_prezzo_vendita).toFixed(2)}
                  </span>
                )}
              </div>
              {o.note && <p className="text-[#666] text-xs mt-2 italic">{o.note}</p>}
            </div>
          ))}
        </div>

      </main>

      {modal && (
        <OrdineModal
          ordine={editing}
          onClose={() => { setModal(false); setEditing(null) }}
          onSaved={() => { setModal(false); setEditing(null); load() }}
        />
      )}

      {importModal && (
        <ImportCSV
          onClose={() => setImportModal(false)}
          onDone={() => { setImportModal(false); load() }}
        />
      )}

    </div>
  )
}