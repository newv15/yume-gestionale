'use client'
import { useEffect, useState, useCallback } from 'react'
import { supabase, Cliente } from '@/lib/supabase'
import Navbar from '@/components/Navbar'
import { Plus, Search, Pencil, Trash2, X, User } from 'lucide-react'

type ClienteExt = Cliente & { ultimo_acquisto?: string; n_ordini?: number }

export default function ClientiPage() {
  const [clienti, setClienti] = useState<ClienteExt[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [modal, setModal] = useState(false)
  const [editing, setEditing] = useState<Cliente | null>(null)
  const [form, setForm] = useState({ nome: '', cognome: '', contatto: '', note: '' })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    const { data: cl } = await supabase.from('clienti').select('*').order('created_at', { ascending: false })
    const { data: ord } = await supabase.from('ordini').select('nome_cliente, data').order('data', { ascending: false })
    const result = (cl || []).map(c => {
      const ordCliente = (ord || []).filter(o => o.nome_cliente.toLowerCase() === `${c.nome} ${c.cognome || ''}`.toLowerCase().trim())
      return { ...c, n_ordini: ordCliente.length, ultimo_acquisto: ordCliente[0]?.data }
    })
    let filtered = result
    if (search) {
      const s = search.toLowerCase()
      filtered = result.filter(c =>
        c.nome.toLowerCase().includes(s) ||
        (c.cognome || '').toLowerCase().includes(s) ||
        (c.contatto || '').toLowerCase().includes(s)
      )
    }
    setClienti(filtered)
    setLoading(false)
  }, [search])

  useEffect(() => { load() }, [load])

  const openNew = () => { setEditing(null); setForm({ nome: '', cognome: '', contatto: '', note: '' }); setError(''); setModal(true) }
  const openEdit = (c: Cliente) => { setEditing(c); setForm({ nome: c.nome, cognome: c.cognome || '', contatto: c.contatto || '', note: c.note || '' }); setError(''); setModal(true) }

  const handleSave = async () => {
    if (!form.nome.trim()) { setError('Il nome è obbligatorio'); return }
    setSaving(true); setError('')
    const payload = { nome: form.nome, cognome: form.cognome || null, contatto: form.contatto || null, note: form.note || null }
    let err
    if (editing) {
      ({ error: err } = await supabase.from('clienti').update(payload).eq('id', editing.id))
    } else {
      ({ error: err } = await supabase.from('clienti').insert(payload))
    }
    setSaving(false)
    if (err) { setError(err.message); return }
    setModal(false); load()
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Eliminare questo cliente?')) return
    await supabase.from('clienti').delete().eq('id', id)
    load()
  }

  const inputCls = "w-full bg-[#0F0F0F] border border-[#444] text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#E8162B] transition-colors"
  const labelCls = "block text-xs text-[#888] font-semibold uppercase tracking-wider mb-1"

  return (
    <div className="min-h-screen bg-[#0F0F0F]">
      <Navbar />
      <main className="max-w-4xl mx-auto px-3 py-5 pb-24 md:pb-6">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h1 className="font-manga text-4xl text-white tracking-wider">CLIENTI<span className="text-[#E8162B]">.</span></h1>
            <p className="text-[#888] text-xs mt-0.5">{clienti.length} clienti</p>
          </div>
          <button onClick={openNew}
            className="flex items-center gap-2 bg-[#E8162B] hover:bg-[#B01020] text-white px-4 py-2.5 rounded-xl font-bold text-sm transition-all">
            <Plus size={18} /> Nuovo
          </button>
        </div>

        {/* Search */}
        <div className="relative mb-4">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#888]" />
          <input
            className="w-full bg-[#1A1A1A] border border-[#333] rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder-[#666] focus:outline-none focus:border-[#E8162B] transition-colors"
            placeholder="Cerca per nome, cognome, contatto..."
            value={search} onChange={e => setSearch(e.target.value)}
          />
          {search && <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#888]"><X size={14} /></button>}
        </div>

        {/* Lista clienti */}
        {loading ? (
          <div className="flex justify-center py-12"><div className="w-6 h-6 border-2 border-[#E8162B] border-t-transparent rounded-full animate-spin" /></div>
        ) : clienti.length === 0 ? (
          <p className="text-center text-[#888] py-12">Nessun cliente trovato</p>
        ) : (
          <div className="grid gap-3">
            {clienti.map(c => (
              <div key={c.id} className="bg-[#1A1A1A] border border-[#333] rounded-xl p-4 flex items-center gap-4 hover:border-[#E8162B]/40 transition-colors animate-fadeIn">
                <div className="w-10 h-10 rounded-full bg-[#E8162B]/20 border border-[#E8162B]/30 flex items-center justify-center flex-shrink-0">
                  <User size={18} className="text-[#E8162B]" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white font-bold">{c.nome} {c.cognome}</p>
                  <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-0.5">
                    {c.contatto && <p className="text-[#888] text-xs">{c.contatto}</p>}
                    {c.ultimo_acquisto && <p className="text-[#888] text-xs">Ultimo: {c.ultimo_acquisto}</p>}
                    {(c.n_ordini || 0) > 0 && <p className="text-[#E8162B] text-xs font-semibold">{c.n_ordini} ordini</p>}
                  </div>
                  {c.note && <p className="text-[#666] text-xs mt-1 italic truncate">{c.note}</p>}
                </div>
                <div className="flex gap-1 flex-shrink-0">
                  <button onClick={() => openEdit(c)} className="p-2 rounded-lg hover:bg-[#333] text-[#888] hover:text-white transition-colors"><Pencil size={15} /></button>
                  <button onClick={() => handleDelete(c.id)} className="p-2 rounded-lg hover:bg-red-900/30 text-[#888] hover:text-red-400 transition-colors"><Trash2 size={15} /></button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Modal */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/70 backdrop-blur-sm p-0 md:p-4">
          <div className="bg-[#1A1A1A] border border-[#333] rounded-t-2xl md:rounded-2xl w-full md:max-w-md animate-fadeIn">
            <div className="flex items-center justify-between p-4 border-b border-[#333]">
              <h2 className="font-manga text-2xl text-[#E8162B]">{editing ? 'MODIFICA CLIENTE' : 'NUOVO CLIENTE'}</h2>
              <button onClick={() => setModal(false)} className="p-2 rounded-lg hover:bg-[#333] text-[#888]"><X size={20} /></button>
            </div>
            <div className="p-4 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>Nome *</label>
                  <input className={inputCls} value={form.nome} onChange={e => setForm(p => ({ ...p, nome: e.target.value }))} placeholder="Mario" />
                </div>
                <div>
                  <label className={labelCls}>Cognome</label>
                  <input className={inputCls} value={form.cognome} onChange={e => setForm(p => ({ ...p, cognome: e.target.value }))} placeholder="Rossi" />
                </div>
              </div>
              <div>
                <label className={labelCls}>Contatto</label>
                <input className={inputCls} value={form.contatto} onChange={e => setForm(p => ({ ...p, contatto: e.target.value }))} placeholder="Tel / Instagram" />
              </div>
              <div>
                <label className={labelCls}>Note</label>
                <textarea className={`${inputCls} resize-none`} rows={3} value={form.note} onChange={e => setForm(p => ({ ...p, note: e.target.value }))} placeholder="Note sul cliente..." />
              </div>
              {error && <p className="text-red-400 text-sm">{error}</p>}
              <div className="flex gap-3 pt-2">
                <button onClick={() => setModal(false)} className="flex-1 py-3 rounded-xl border border-[#444] text-[#888] font-bold">Annulla</button>
                <button onClick={handleSave} disabled={saving} className="flex-1 py-3 rounded-xl bg-[#E8162B] text-white font-bold disabled:opacity-50">
                  {saving ? 'Salvataggio...' : editing ? 'Aggiorna' : 'Crea'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}