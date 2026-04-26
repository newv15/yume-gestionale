'use client'
import { useState } from 'react'
import { Ordine } from '@/lib/supabase'
import { Download, FileText, ChevronDown } from 'lucide-react'

type Props = {
  ordini: Ordine[]
  filtroAttivo: string
}

export default function ExportTools({ ordini, filtroAttivo }: Props) {
  const [open, setOpen] = useState(false)

  // ── CSV ──────────────────────────────────────────────
  const exportCSV = () => {
    const headers = [
      'data', 'nome_cliente', 'contatto', 'tipo_ordine', 'nome_articolo',
      'quantita', 'costo', 'tot_costo', 'prezzo_vendita', 'tot_prezzo_vendita',
      'stato', 'fornitore', 'pagamento', 'note'
    ]
    const rows = ordini.map(o => [
      o.data,
      o.nome_cliente,
      o.contatto ?? '',
      o.tipo_ordine,
      o.nome_articolo,
      o.quantita,
      o.costo ?? '',
      o.tot_costo ?? '',
      o.prezzo_vendita ?? '',
      o.tot_prezzo_vendita ?? '',
      o.stato,
      o.fornitore === 'altro' ? (o.fornitore_custom || 'altro') : o.fornitore,
      o.pagamento,
      (o.note ?? '').replace(/,/g, ';'),
    ])

    const csv = [headers, ...rows]
      .map(r => r.map(v => `"${v}"`).join(','))
      .join('\n')

    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href     = url
    a.download = `yume-ordini-${filtroAttivo || 'tutti'}-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
    setOpen(false)
  }

  // ── PDF ──────────────────────────────────────────────
  const exportPDF = async () => {
    const { default: jsPDF } = await import('jspdf')
    const { default: autoTable } = await import('jspdf-autotable')

    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })

    // Intestazione
    doc.setFillColor(232, 22, 43)
    doc.rect(0, 0, 297, 18, 'F')
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(16)
    doc.setFont('helvetica', 'bold')
    doc.text('YUME FUMETTERIA — Ordini', 10, 12)

    // Sottotitolo
    doc.setFontSize(9)
    doc.setTextColor(255, 255, 255)
    const label = filtroAttivo ? `Filtro: ${filtroAttivo}` : 'Tutti gli ordini'
    doc.text(`${label}   |   ${ordini.length} ordini   |   Generato il ${new Date().toLocaleDateString('it-IT')}`, 10, 17)

    // Totali
    const totVendite = ordini.reduce((s, o) => s + (o.tot_prezzo_vendita || 0), 0)
    const totCosto   = ordini.reduce((s, o) => s + (o.tot_costo || 0), 0)
    const margine    = totVendite - totCosto

    doc.setFillColor(36, 36, 36)
    doc.rect(0, 20, 297, 12, 'F')
    doc.setTextColor(200, 200, 200)
    doc.setFontSize(8)
    doc.text(`Totale vendite: €${totVendite.toFixed(2)}`, 10, 28)
    doc.text(`Totale costo:   €${totCosto.toFixed(2)}`, 70, 28)
    doc.text(`Margine:        €${margine.toFixed(2)}`, 130, 28)
    doc.text(`Da saldare: ${ordini.filter(o => o.pagamento === 'da saldare').length} ordini`, 190, 28)

    // Tabella
    autoTable(doc, {
      startY: 35,
      head: [['Data', 'Cliente', 'Articolo', 'Qtà', 'Stato', 'Fornitore', 'Pagamento', 'Costo €', 'Vendita €']],
      body: ordini.map(o => [
        o.data,
        o.nome_cliente + (o.contatto ? `\n${o.contatto}` : ''),
        o.nome_articolo,
        o.quantita,
        o.stato,
        o.fornitore === 'altro' ? (o.fornitore_custom || 'altro') : o.fornitore,
        o.pagamento,
        o.tot_costo ? `€${Number(o.tot_costo).toFixed(2)}` : '—',
        o.tot_prezzo_vendita ? `€${Number(o.tot_prezzo_vendita).toFixed(2)}` : '—',
      ]),
      styles: {
        fontSize: 8,
        cellPadding: 3,
        textColor: [30, 30, 30],
      },
      headStyles: {
        fillColor: [232, 22, 43],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 8,
      },
      alternateRowStyles: {
        fillColor: [245, 245, 245],
      },
      columnStyles: {
        0: { cellWidth: 22 },
        1: { cellWidth: 40 },
        2: { cellWidth: 60 },
        3: { cellWidth: 10, halign: 'center' },
        4: { cellWidth: 25 },
        5: { cellWidth: 25 },
        6: { cellWidth: 22 },
        7: { cellWidth: 22, halign: 'right' },
        8: { cellWidth: 22, halign: 'right' },
      },
    })

    // Footer pagine
    const pageCount = (doc as unknown as { internal: { getNumberOfPages: () => number } }).internal.getNumberOfPages()
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i)
      doc.setFontSize(7)
      doc.setTextColor(150)
      doc.text(`Pagina ${i} di ${pageCount}`, 280, 205, { align: 'right' })
    }

    doc.save(`yume-ordini-${filtroAttivo || 'tutti'}-${new Date().toISOString().split('T')[0]}.pdf`)
    setOpen(false)
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(p => !p)}
        className="flex items-center gap-2 border border-[#444] hover:border-[#E8162B] text-[#888] hover:text-white px-3 py-2.5 rounded-xl font-bold text-sm transition-all">
        <Download size={16} />
        <span className="hidden md:inline">Esporta</span>
        <ChevronDown size={14} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <>
          {/* Overlay per chiudere */}
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-12 z-50 bg-[#1A1A1A] border border-[#333] rounded-xl overflow-hidden shadow-xl w-48 animate-fadeIn">
            <button onClick={exportCSV}
              className="w-full flex items-center gap-3 px-4 py-3 text-sm text-white hover:bg-[#242424] transition-colors">
              <Download size={15} className="text-green-400" />
              <div className="text-left">
                <p className="font-semibold">Esporta CSV</p>
                <p className="text-[#888] text-xs">Backup dati</p>
              </div>
            </button>
            <div className="border-t border-[#333]" />
            <button onClick={exportPDF}
              className="w-full flex items-center gap-3 px-4 py-3 text-sm text-white hover:bg-[#242424] transition-colors">
              <FileText size={15} className="text-red-400" />
              <div className="text-left">
                <p className="font-semibold">Stampa PDF</p>
                <p className="text-[#888] text-xs">Con totali e margine</p>
              </div>
            </button>
          </div>
        </>
      )}
    </div>
  )
}