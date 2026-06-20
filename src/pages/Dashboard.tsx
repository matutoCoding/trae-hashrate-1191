import { useStore } from '@/store'
import type { Booking, Yacht } from '@/types'
import { format, isToday, parseISO, isAfter } from 'date-fns'
import {
  Ship,
  Sailboat,
  Clock,
  DollarSign,
  Check,
  X,
  Inbox,
} from 'lucide-react'

function getYachtName(yachts: Yacht[], yachtId: string): string {
  return yachts.find((y) => y.id === yachtId)?.name ?? '—'
}

function calcDuration(start: string, end: string): string {
  const ms = new Date(end).getTime() - new Date(start).getTime()
  const hours = Math.round(ms / 3600000 * 10) / 10
  return `${hours}h`
}

const statusBadge: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-700',
  confirmed: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
  completed: 'bg-blue-100 text-blue-700',
}

const statusLabel: Record<string, string> = {
  pending: '待确认',
  confirmed: '已确认',
  cancelled: '已取消',
  completed: '已完成',
}

export default function Dashboard() {
  const yachts = useStore((s) => s.yachts)
  const bookings = useStore((s) => s.bookings)
  const bills = useStore((s) => s.bills)
  const approveBooking = useStore((s) => s.approveBooking)
  const rejectBooking = useStore((s) => s.rejectBooking)

  const availableCount = yachts.filter((y) => y.status === 'available').length

  const todaySeaCount = bookings.filter(
    (b) => isToday(parseISO(b.startTime)) && b.status === 'confirmed'
  ).length

  const pendingBookings = bookings.filter(
    (b) => b.approvalStatus === 'pending'
  )

  const now = new Date()
  const monthRevenue = bills
    .filter((b) => {
      const d = parseISO(b.generatedAt)
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
    })
    .reduce((sum, b) => sum + b.totalAmount, 0)

  const recentBookings = [...bookings]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5)

  const stats = [
    {
      label: '在港游艇',
      value: availableCount,
      icon: Ship,
      borderColor: 'border-l-navy-500',
    },
    {
      label: '今日出海',
      value: todaySeaCount,
      icon: Sailboat,
      borderColor: 'border-l-ocean-500',
    },
    {
      label: '待审批',
      value: pendingBookings.length,
      icon: Clock,
      borderColor: 'border-l-gold-500',
    },
    {
      label: '本月营收',
      value: `¥${monthRevenue.toLocaleString()}`,
      icon: DollarSign,
      borderColor: 'border-l-emerald-500',
    },
  ]

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-navy-900">仪表盘</h1>
        <p className="font-display text-sm text-navy-800/60">Dashboard</p>
      </div>

      <div className="grid grid-cols-4 gap-5">
        {stats.map((s) => (
          <div
            key={s.label}
            className={`rounded-xl bg-white shadow-sm border-l-4 ${s.borderColor} p-5`}
          >
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-500">{s.label}</span>
              <s.icon className="h-5 w-5 text-slate-400" />
            </div>
            <p className="mt-2 font-display text-3xl font-bold text-navy-900">
              {s.value}
            </p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="rounded-xl bg-white shadow-sm p-6">
          <h2 className="mb-4 text-lg font-semibold text-navy-900">待审批预订</h2>

          {pendingBookings.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-slate-400">
              <Inbox className="mb-2 h-10 w-10" />
              <p className="text-sm">暂无待审批预订</p>
            </div>
          ) : (
            <ul className="space-y-3">
              {pendingBookings.map((b) => (
                <li
                  key={b.id}
                  className="flex items-center justify-between rounded-lg bg-foam-50 px-4 py-3"
                >
                  <div className="space-y-0.5">
                    <p className="font-medium text-navy-900">
                      {b.customerName}
                      <span className="ml-2 text-sm text-slate-500">
                        {getYachtName(yachts, b.yachtId)}
                      </span>
                    </p>
                    <p className="text-xs text-slate-500">
                      {format(parseISO(b.startTime), 'MM-dd HH:mm')} ·{' '}
                      {calcDuration(b.startTime, b.endTime)}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => approveBooking(b.id, '快捷审批')}
                      className="rounded-lg bg-green-50 p-2 text-green-600 transition hover:bg-green-100"
                    >
                      <Check className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => rejectBooking(b.id, '驳回')}
                      className="rounded-lg bg-red-50 p-2 text-red-500 transition hover:bg-red-100"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="rounded-xl bg-white shadow-sm p-6">
          <h2 className="mb-4 text-lg font-semibold text-navy-900">近期预订</h2>

          {recentBookings.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-slate-400">
              <Inbox className="mb-2 h-10 w-10" />
              <p className="text-sm">暂无预订记录</p>
            </div>
          ) : (
            <ul className="space-y-3">
              {recentBookings.map((b) => (
                <li
                  key={b.id}
                  className="flex items-center justify-between rounded-lg bg-foam-50 px-4 py-3"
                >
                  <div className="space-y-0.5">
                    <p className="font-medium text-navy-900">
                      {b.customerName}
                      <span className="ml-2 text-sm text-slate-500">
                        {getYachtName(yachts, b.yachtId)}
                      </span>
                    </p>
                    <p className="text-xs text-slate-500">
                      {format(parseISO(b.startTime), 'MM-dd HH:mm')} –{' '}
                      {format(parseISO(b.endTime), 'MM-dd HH:mm')}
                    </p>
                  </div>
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${statusBadge[b.status]}`}
                  >
                    {statusLabel[b.status]}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}
