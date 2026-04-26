import { LucideIcon } from 'lucide-react'

type Props = {
  label: string
  value: number
  icon: LucideIcon
  color: string
  sub?: string
}

export default function StatCard({ label, value, icon: Icon, color, sub }: Props) {
  const formatted = sub === '€ totali'
    ? `€${value.toFixed(2)}`
    : value.toString()

  return (
    <div className="bg-[#242424] dark:bg-[#242424] border border-[#333] rounded-2xl p-5 flex items-center gap-4 animate-fadeIn">
      <div className={`p-3 rounded-xl ${color}`}>
        <Icon size={24} className="text-white" />
      </div>
      <div>
        <p className="text-[#888] text-xs font-semibold uppercase tracking-wider">{label}</p>
        <p className="text-3xl font-manga text-white tracking-wide">{formatted}</p>
        {sub && <p className="text-[#888] text-xs mt-0.5">{sub}</p>}
      </div>
    </div>
  )
}