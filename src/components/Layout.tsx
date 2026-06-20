import { NavLink, Outlet } from 'react-router-dom'
import {
  LayoutDashboard,
  Ship,
  Calendar,
  Clock,
  Receipt,
  CheckCircle,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/yachts', icon: Ship, label: 'Yachts' },
  { to: '/bookings', icon: Calendar, label: 'Bookings' },
  { to: '/rates', icon: Clock, label: 'Rates' },
  { to: '/bills', icon: Receipt, label: 'Bills' },
  { to: '/approvals', icon: CheckCircle, label: 'Approvals' },
]

export default function Layout() {
  return (
    <div className="flex h-screen overflow-hidden">
      <aside className="hidden md:flex md:w-20 lg:w-64 flex-col bg-navy-900 shrink-0">
        <div className="flex flex-col items-center lg:items-start px-4 py-6 border-b border-navy-800">
          <h1 className="font-display text-2xl text-gold-500 tracking-wider">
            YOCEAN
          </h1>
          <span className="hidden lg:block text-xs text-gold-400/60 mt-1 font-body">
            游艇管理
          </span>
        </div>

        <nav className="flex-1 flex flex-col gap-1 px-2 py-4">
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                cn(
                  'group flex items-center gap-3 px-3 py-2.5 rounded-md transition-colors duration-150',
                  'justify-center lg:justify-start',
                  isActive
                    ? 'bg-navy-800 text-gold-500 border-l-[3px] border-gold-500'
                    : 'text-foam-200/70 hover:bg-navy-800 hover:text-foam-50 border-l-[3px] border-transparent'
                )
              }
            >
              <Icon className="h-5 w-5 shrink-0" />
              <span className="hidden lg:block text-sm font-body">{label}</span>
            </NavLink>
          ))}
        </nav>
      </aside>

      <main className="flex-1 overflow-auto bg-foam-50">
        <Outlet />
      </main>
    </div>
  )
}
