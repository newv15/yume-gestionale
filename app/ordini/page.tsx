'use client'
import ExportTools from '@/components/ExportTools'
import { useEffect, useState, useCallback } from 'react'
import { supabase, Ordine } from '@/lib/supabase'
import Navbar from '@/components/Navbar'
import OrdineModal from '@/components/OrdineModal'
import ImportCSV from '@/components/ImportCSV'
import { Plus, Search, Filter, Pencil, Trash2, X, Upload, ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react'

const STATI     = ['', 'da cercare', 'ordinato', 'arrivato', 'completato']
const FORNITORI = ['', 'manicomics', 'starshop', 'terminal', 'second hand', 'cubex', 'altro']
const PAGAMENTI = ['', 'pagato', 'da saldare']
const TIPI      = ['', 'online', 'in store']

type SortField = 'data' | 'nome_cliente' | 'nome_articolo' | 'quantita' | 'stato' | 'fornitore' | 'pagamento' | 'tot_prezzo_vendita'
type SortDir   = 'asc' | 'desc'

export default function OrdiniPage() {
  const [ordini, setOrdini]       = useState<Ordine[]>([])
  const [loading, setLoading]     = useState(true)
  const [modal, setModal]         = useState(false)
  const [editing, setEditing]     = useState<Ordine | null>(null)
  const [deleting, setDeleting]   = useState<string | null>(null)
  const [importModal, setImportModal] = useState(false)

  // Filtri
  const [search, setSearch]       = useState('')
  const [fStato, setFStato]       = useState('')
  const [fFornitore, setFFornitore] = useState('')
  const [fPagamento, setFPagamento] = useState('')
  const [fTipo, setFTipo]         = useState('')
  const [showFilters, setShowFilters] = useState(false)

  // Ordinamento
  const [sortField, setSortField] = useState<SortField>('data')
  const [sortDir, setSortDir]     = useState<SortDir>('desc')

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
    let q = supabase.from('ordini').select('*').order(sortField, { ascending: sortDir === 'asc' })
    if (fStato)    q = q.eq('stato', fStato)
    if (fFornitore) q = q.eq('fornitore', fFornitore)
    if (fPagamento) q = q.eq('pagamento', fPagamento)
    if (fTipo)     q = q.eq('tipo_ordine', fTipo)
    const { data } = await q
    let result = data || []
    if (search) {
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

  const statoBadge = (s: string) => {
    const map: Record<string, string> = {
      'da cercare': 'stato-da-cercare',
      'ordinato':   'stato-ordinato',
      'arrivato':   'stato-arrivato',
      'completato': 'stato-completato',
    }
    return <span className={`text-xs px-2 py-1 rounded-full font-bold whitespace-nowrap ${map[s] || ''}`}>{s}</span>
  }

  const pagBadge = (p: string) => (
    <span className={`text-xs px-2 py-1 rounded-full font-bold ${p === 'pagato' ? 'pag-pagato' : 'pag-da-saldare'}`}>{p}</span>
  )

  const activeFilters = [fStato, fFornitore, fPagamento, fTipo].filter(Boolean).length

  type ColHeader = { label: string; field: SortField }
  const colHeaders: ColHeader[] = [
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
  <ExportTools
    ordini={ordini}
    filtroAttivo={fStato || fFornitore || fPagamento || fTipo || ''}
  />
  <button onClick={() => setImportModal(true)}
    className="flex items-center gap-2 border border-[#444] hover:border-[#E8162B] text-[#888] hover:text-white px-3 py-2.5 rounded-xl font-bold text-sm transition-all">
    <Upload size={16} />
    <span className="hidden md:inline">Import CSV</span>
  </button>
  <button onClick={() => { setEditing(null); setModal(true) }}
    className="flex items-center gap-2 bg-[#E8162B] hover:bg-[#B01020] text-white px-4 py-2.5 rounded-xl font-bold text-sm transition-all pulse-red">
    <Plus size={18} /> Nuovo
  </button>
</div>
        </div>

        {/* Search + Filtri */}
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
            <button onClick={() => setShowFilters(p => !p)}
              className={`flex items-center gap-1.5 px-3 py-2.5 rounded-xl border text-sm font-bold transition-all
                ${showFilters || activeFilters > 0
                  ? 'bg-[#E8162B] border-[#E8162B] text-white'
                  : 'border-[#333] text-[#888] hover:text-white hover:border-[#666]'}`}>
              <Filter size={16} />
              {activeFilters > 0 && (
                <span className="bg-white text-[#E8162B] text-xs w-4 h-4 rounded-full flex items-center justify-center">
                  {activeFilters}
                </span>
              )}
            </button>
          </div>

          {showFilters && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 animate-fadeIn">
              {[
                { label: 'Stato',     val: fStato,     set: setFStato,     opts: STATI },
                { label: 'Fornitore', val: fFornitore, set: setFFornitore, opts: FORNITORI },
                { label: 'Pagamento', val: fPagamento, set: setFPagamento, opts: PAGAMENTI },
                { label: 'Tipo',      val: fTipo,      set: setFTipo,      opts: TIPI },
              ].map(f => (
                <select key={f.label}
                  className="bg-[#1A1A1A] border border-[#333] text-sm text-white rounded-xl px-3 py-2 focus:outline-none focus:border-[#E8162B]"
                  value={f.val} onChange={e => f.set(e.target.value)}>
                  <option value="">{f.label}: tutti</option>
                  {f.opts.filter(Boolean).map(o => <option key={o} value={o}>{o}</option>)}
                </select>
              ))}
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
                      {o.tot_prezzo_vendita > 0 ? `€${o.tot_prezzo_vendita.toFixed(2)}` : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        <button onClick={() => { setEditing(o); setModal(true) }}
                          className="p-1.5 rounded-lg hover:bg-[#333] text-[#888] hover:text-white transition-colors">
                          <Pencil size={14} />
                        </button>
                        <button onClick={() => handleDelete(o.id)}
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
                <div>
                  <p className="text-white font-bold">{o.nome_articolo}</p>
                  <p className="text-[#888] text-xs">{o.nome_cliente} · {o.data}</p>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => { setEditing(o); setModal(true) }}
                    className="p-2 rounded-lg bg-[#242424] text-[#888]">
                    <Pencil size={14} />
                  </button>
                  <button onClick={() => handleDelete(o.id)}
                    className="p-2 rounded-lg bg-[#242424] text-[#888]">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
              <div className="flex flex-wrap gap-2 mt-2">
                {statoBadge(o.stato)}
                {pagBadge(o.pagamento)}
                <span className="text-xs px-2 py-1 bg-[#242424] text-[#888] rounded-full">{o.fornitore}</span>
                {o.tot_prezzo_vendita > 0 && (
                  <span className="text-xs px-2 py-1 bg-[#242424] text-[#FFD700] rounded-full font-bold">
                    €{o.tot_prezzo_vendita.toFixed(2)}
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