'use client'
import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import Navbar from '@/components/Navbar'
import { Plus, Check, X } from 'lucide-react'

type Nota = {
  id: string
  testo: string
  completato: boolean
  completato_at: string | null
  created_at: string
}

export default function NotePage() {
  const [note, setNote]       = useState<Nota[]>([])
  const [loading, setLoading] = useState(true)
  const [testo, setTesto]     = useState('')
  const [saving, setSaving]   = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase
      .from('note')
      .select('*')
      .order('created_at', { ascending: false })
    if (data) setNote(data as Nota[])
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  // Elimina automaticamente le note completate da più di 3 giorni
  useEffect(() => {
    const tre_giorni_fa = new Date()
    tre_giorni_fa.setDate(tre_giorni_fa.getDate() - 3)
    supabase
      .from('note')
      .delete()
      .eq('completato', true)
      .lt('completato_at', tre_giorni_fa.toISOString())
      .then(() => load())
  }, [load])

  const aggiungi = async () => {
    if (!testo.trim()) return
    setSaving(true)
    await supabase.from('note').insert({ testo: testo.trim() })
    setTesto('')
    setSaving(false)
    load()
  }

  const toggleCompleto = async (nota: Nota) => {
    await supabase.from('note').update({
      completato: !nota.completato,
      completato_at: !nota.completato ? new Date().toISOString() : null,
    }).eq('id', nota.id)
    load()
  }

  const elimina = async (id: string) => {
    await supabase.from('note').delete().eq('id', id)
    load()
  }

  const attive    = note.filter(n => !n.completato)
  const completate = note.filter(n => n.completato)

  const giorniRimasti = (completato_at: string | null) => {
    if (!completato_at) return 3
    const diff = new Date().getTime() - new Date(completato_at).getTime()
    const giorni = Math.floor(diff / (1000 * 60 * 60 * 24))
    return Math.max(0, 3 - giorni)
  }

  return (
    <div className="min-h-screen bg-[#0F0F0F]">
      <Navbar />
      <main className="max-w-2xl mx-auto px-4 py-6 pb-24 md:pb-6">

        {/* Header */}
        <div className="mb-6">
          <h1 className="font-manga text-4xl text-white tracking-wider">
            NOTE<span className="text-[#E8162B]">.</span>
          </h1>
          <p className="text-[#888] text-xs mt-1">Note interne del team — i task completati spariscono dopo 3 giorni</p>
        </div>

        {/* Input nuova nota */}
        <div className="bg-[#1A1A1A] border border-[#333] rounded-2xl p-4 mb-6">
          <p className="text-xs text-[#888] font-semibold uppercase tracking-wider mb-2">Nuova nota</p>
          <div className="flex gap-2">
            <input
              className="flex-1 bg-[#0F0F0F] border border-[#444] text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#E8162B] transition-colors placeholder-[#555]"
              placeholder="Scrivi un task o una nota..."
              value={testo}
              onChange={e => setTesto(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && aggiungi()}
            />
            <button
              onClick={aggiungi}
              disabled={saving || !testo.trim()}
              className="flex items-center gap-2 bg-[#E8162B] hover:bg-[#B01020] text-white px-4 py-2.5 rounded-xl font-bold text-sm transition-all disabled:opacity-40">
              <Plus size={18} />
              <span className="hidden md:inline">Aggiungi</span>
            </button>
          </div>
          <p className="text-[#555] text-xs mt-2">Premi Invio per aggiungere rapidamente</p>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-6 h-6 border-2 border-[#E8162B] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <>
            {/* Note attive */}
            {attive.length === 0 && completate.length === 0 && (
              <div className="text-center py-12">
                <p className="text-[#555] text-4xl mb-3">📝</p>
                <p className="text-[#888]">Nessuna nota ancora. Aggiungine una!</p>
              </div>
            )}

            {attive.length > 0 && (
              <div className="mb-6">
                <p className="text-xs text-[#888] font-semibold uppercase tracking-wider mb-3 px-1">
                  Da fare ({attive.length})
                </p>
                <div className="space-y-2">
                  {attive.map(n => (
                    <div key={n.id}
                      className="bg-[#1A1A1A] border border-[#333] rounded-xl px-4 py-3 flex items-center gap-3 group hover:border-[#E8162B]/30 transition-all animate-fadeIn">
                      <button
                        onClick={() => toggleCompleto(n)}
                        className="w-6 h-6 rounded-full border-2 border-[#444] hover:border-[#E8162B] flex items-center justify-center flex-shrink-0 transition-all hover:bg-[#E8162B]/10">
                        <Check size={12} className="text-transparent group-hover:text-[#E8162B] transition-colors" />
                      </button>
                      <p className="flex-1 text-white text-sm">{n.testo}</p>
                      <button
                        onClick={() => elimina(n.id)}
                        className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-red-900/30 text-[#888] hover:text-red-400 transition-all">
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Note completate */}
            {completate.length > 0 && (
              <div>
                <p className="text-xs text-[#888] font-semibold uppercase tracking-wider mb-3 px-1">
                  Completati ({completate.length})
                </p>
                <div className="space-y-2">
                  {completate.map(n => (
                    <div key={n.id}
                      className="bg-[#1A1A1A]/50 border border-[#2a2a2a] rounded-xl px-4 py-3 flex items-center gap-3 group animate-fadeIn">
                      <button
                        onClick={() => toggleCompleto(n)}
                        className="w-6 h-6 rounded-full bg-green-700/40 border-2 border-green-600 flex items-center justify-center flex-shrink-0 flex-shrink-0 transition-all">
                        <Check size={12} className="text-green-400" />
                      </button>
                      <p className="flex-1 text-[#555] text-sm line-through">{n.testo}</p>
                      <span className="text-[#555] text-xs flex-shrink-0">
                        {giorniRimasti(n.completato_at)}g
                      </span>
                      <button
                        onClick={() => elimina(n.id)}
                        className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-red-900/30 text-[#888] hover:text-red-400 transition-all">
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                </div>
                <p className="text-[#555] text-xs mt-3 px-1">
                  I task completati vengono eliminati automaticamente dopo 3 giorni
                </p>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  )
}