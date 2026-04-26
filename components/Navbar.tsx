'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ShoppingBag, Users, LayoutDashboard, Sun, Moon, StickyNote } from 'lucide-react'
import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'

const links = [
  { href: '/',        label: 'Dashboard', icon: LayoutDashboard },
  { href: '/ordini',  label: 'Ordini',    icon: ShoppingBag },
  { href: '/clienti', label: 'Clienti',   icon: Users },
  { href: '/note',    label: 'Note',      icon: StickyNote },
]

export default function Navbar() {
  const path = usePathname()
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  const toggleTheme = () => setTheme(theme === 'dark' ? 'light' : 'dark')

  return (
    <>
      {/* TOP BAR desktop */}
      <header className="hidden md:flex items-center justify-between px-6 py-3 border-b border-[#333] bg-[#1A1A1A] sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <span className="font-manga text-3xl text-[#E8162B] tracking-widest">YUME</span>
          <span className="text-xs text-[#888] font-semibold uppercase tracking-widest mt-1">Gestionale</span>
        </div>
        <nav className="flex gap-2 items-center">
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
          {/* Toggle tema */}
          {mounted && (
            <button onClick={toggleTheme}
              className="ml-2 p-2 rounded-lg border border-[#333] text-[#888] hover:text-white hover:border-[#E8162B] transition-all">
              {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
            </button>
          )}
        </nav>
      </header>

      {/* BOTTOM BAR mobile */}
      {/* BOTTOM BAR mobile */}
<nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#1A1A1A] border-t border-[#333] flex items-stretch">
  {links.map(({ href, label, icon: Icon }) => (
    <Link key={href} href={href}
      className={`flex-1 flex flex-col items-center justify-center py-3 gap-1 text-xs font-bold transition-all min-w-0
        ${path === href ? 'text-[#E8162B]' : 'text-[#888]'}`}>
      <Icon size={20} />
      <span className="truncate">{label}</span>
    </Link>
  ))}
  {mounted && (
    <button onClick={toggleTheme}
      className="flex-1 flex flex-col items-center justify-center py-3 gap-1 text-xs font-bold text-[#888] min-w-0">
      {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
      <span>{theme === 'dark' ? 'Light' : 'Dark'}</span>
    </button>
  )}
</nav>
    </>
  )
}