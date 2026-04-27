import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseKey)

export type Ordine = {
  id: string
  data: string
  cliente_id: string | null
  nome_cliente: string
  contatto: string | null
  tipo_ordine: 'online' | 'in store'
  nome_articolo: string
  quantita: number
  costo: number | null
  tot_costo: number
  prezzo_vendita: number | null
  tot_prezzo_vendita: number
  stato: 'da cercare' | 'ordinato' | 'arrivato' | 'completato'
  fornitore: 'manicomics' | 'starshop' | 'terminal' | 'second hand' | 'cubex' | 'cardverse' | 'altro'
  fornitore_custom: string | null
  pagamento: 'pagato' | 'da saldare'
  note: string | null
  created_at: string
  updated_at: string
}

export type Cliente = {
  id: string
  nome: string
  cognome: string | null
  contatto: string | null
  note: string | null
  created_at: string
  updated_at: string
}