'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import Navbar from '@/components/Navbar'
import StatCard from '@/components/StatCard'
import { ShoppingBag, Package, CheckCircle, Clock, TrendingUp } from 'lucide-react'

type Stats = {
  da_cercare: number
  ordinato: number
  arrivato: number
  completato: number
  da_saldare: number
  tot_vendite: number
}

type OrdineRow = {
  stato: string
  pagamento: string
  tot_prezzo_vendita: number
}

export default function Dashboard() {
  const [stats, setStats] = useState<Stats>({
    da_cercare: 0, ordinato: 0, arrivato: 0,
    completato: 0, da_saldare: 0, tot_vendite: 0
  })
  const [loading, setLoading] = useState(true)
  const [ultimi, setUltimi] = useState<OrdineRow[]>([])

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from('ordini')
        .select('stato, pagamento, tot_prezzo_vendita')

      if (data) {
        const rows = data as OrdineRow[]
        setStats({
          da_cercare:  rows.filter(d => d.stato === 'da cercare').length,
          ordinato:    rows.filter(d => d.stato === 'ordinato').length,
          arrivato:    rows.filter(d => d.stato === 'arrivato').length,
          completato:  rows.filter(d => d.stato === 'completato').length,
          da_saldare:  rows.filter(d => d.pagamento === 'da saldare').length,
          tot_vendite: rows
            .filter(d => d.stato === 'completato')
            .reduce((s, d) => s + (d.tot_prezzo_vendita || 0), 0),
        })
      }

      const { data: rec } = await supabase
        .from('ordini')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5)

      if (rec) setUltimi(rec as OrdineRow[])
      setLoading(false)
    }
    load()
  }, [])

  const statoBadge = (s: string) => {
    const map: Record<string, string> = {
      'da cercare': 'stato-da-cercare',
      'ordinato':   'stato-ordinato',
      'arrivato':   'stato-arrivato',
      'completato': 'stato-completato',
    }
    return (
      <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${map[s] || ''}`}>
        {s}
      </span>
    )
  }

  return (
    <div className="min-h-screen bg-[#0F0F0F]">
      <Navbar />
      <main className="max-w-5xl mx-auto px-4 py-6 pb-24 md:pb-6">
        <div className="mb-8">
          <h1 className="font-manga text-5xl text-white tracking-wider">
            DASHBOARD<span className="text-[#E8162B]">.</span>
          </h1>
          <p className="text-[#888] text-sm mt-1">Panoramica ordini Yume Fumetteria</p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-40">
            <div className="w-8 h-8 border-2 border-[#E8162B] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
              <StatCard label="Da cercare" value={stats.da_cercare} icon={Clock}        color="bg-purple-700" />
              <StatCard label="Ordinati"   value={stats.ordinato}   icon={ShoppingBag}  color="bg-sky-700" />
              <StatCard label="Arrivati"   value={stats.arrivato}   icon={Package}      color="bg-orange-700" />
              <StatCard label="Completati" value={stats.completato} icon={CheckCircle}  color="bg-green-700" />
            </div>

            <div className="grid grid-cols-2 gap-3 mb-8">
              <StatCard label="Da saldare"         value={stats.da_saldare}  icon={Clock}       color="bg-red-800"    sub="ordini non pagati" />
              <StatCard label="Vendite completate"  value={Math.round(stats.tot_vendite * 100) / 100} icon={TrendingUp}  color="bg-[#E8162B]"  sub="€ totali" />
            </div>

            <div className="bg-[#1A1A1A] border border-[#333] rounded-2xl overflow-hidden">
              <div className="px-5 py-4 border-b border-[#333]">
                <h2 className="font-manga text-xl text-white tracking-wide">ULTIMI ORDINI</h2>
              </div>
              <div className="divide-y divide-[#2a2a2a]">
                {ultimi.length === 0 && (
                  <p className="text-[#888] text-sm p-5">
                    Nessun ordine ancora. Vai su Ordini per aggiungerne uno!
                  </p>
                )}
                {ultimi.map((o, i) => {
                  const ordine = o as unknown as {
                    id: string
                    nome_articolo: string
                    nome_cliente: string
                    data: string
                    stato: string
                  }
                  return (
                    <div key={ordine.id || i} className="flex items-center justify-between px-5 py-3 hover:bg-[#242424] transition-colors">
                      <div>
                        <p className="text-white text-sm font-semibold">{ordine.nome_articolo}</p>
                        <p className="text-[#888] text-xs">{ordine.nome_cliente} · {ordine.data}</p>
                      </div>
                      <div>{statoBadge(ordine.stato)}</div>
                    </div>
                  )
                })}
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  )
}