'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ShoppingBag, Users, LayoutDashboard } from 'lucide-react'

const links = [
  { href: '/',         label: 'Dashboard',  icon: LayoutDashboard },
  { href: '/ordini',   label: 'Ordini',     icon: ShoppingBag },
  { href: '/clienti',  label: 'Clienti',    icon: Users },
]

export default function Navbar() {
  const path = usePathname()
  return (
    <>
      {/* TOP BAR desktop */}
      <header className="hidden md:flex items-center justify-between px-6 py-3 border-b border-[#333] bg-[#1A1A1A] sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <span className="font-manga text-3xl text-[#E8162B] tracking-widest">YUME</span>
          <span className="text-xs text-[#888] font-semibold uppercase tracking-widest mt-1">Gestionale</span>
        </div>
        <nav className="flex gap-2">
          {links.map(({ href, label, icon: Icon }) => (
            <Link key={href} href={href}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all
                ${path === href
                  ? 'bg-[#E8162B] text-white shadow-lg shadow-red-900/40'
                  : 'text-[#888] hover:text-white hover:bg-[#333]'}`}>
              <Icon size={16} />
              {label}
            </Link>
          ))}
        </nav>
      </header>

      {/* BOTTOM BAR mobile */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#1A1A1A] border-t border-[#333] flex">
        {links.map(({ href, label, icon: Icon }) => (
          <Link key={href} href={href}
            className={`flex-1 flex flex-col items-center py-3 gap-1 text-xs font-bold transition-all
              ${path === href ? 'text-[#E8162B]' : 'text-[#888]'}`}>
            <Icon size={20} />
            {label}
          </Link>
        ))}
      </nav>
    </>
  )
}