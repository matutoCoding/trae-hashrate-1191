import { useStore } from '@/store'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, Ship, Users, Ruler, Calendar } from 'lucide-react'
import { format, parseISO, isSameDay, startOfWeek, addDays } from 'date-fns'

const statusLabel: Record<string, { label: string; cls: string; barCls: string }> = {
  pending: { label: '待确认', cls: 'bg-amber-100 text-amber-700', barCls: 'bg-amber-200 border-amber-400' },
  confirmed: { label: '已确认', cls: 'bg-emerald-100 text-emerald-700', barCls: 'bg-emerald-200 border-emerald-400' },
  completed: { label: '已完成', cls: 'bg-ocean-400/20 text-ocean-500', barCls: 'bg-ocean-400/30 border-ocean-400' },
  cancelled: { label: '已取消', cls: 'bg-slate-100 text-slate-500', barCls: 'bg-slate-200 border-slate-400' },
}

export default function YachtDetail() {
  const { yachtId } = useParams<{ yachtId: string }>()
  const yachts = useStore((s) => s.yachts)
  const bookings = useStore((s) => s.bookings)

  const yacht = yachts.find((y) => y.id === yachtId)
  const yachtBookings = bookings.filter(
    (b) => b.yachtId === yachtId && b.status !== 'cancelled'
  )

  if (!yacht) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-foam-50">
        <div className="text-center">
          <Ship className="mx-auto h-12 w-12 text-slate-300" />
          <p className="mt-3 text-slate-500">未找到该游艇</p>
          <Link
            to="/yachts"
            className="mt-4 inline-block text-sm text-ocean-500 hover:underline"
          >
            返回游艇列表
          </Link>
        </div>
      </div>
    )
  }

  const sc = statusLabel[yacht.status === 'available' ? 'confirmed' : yacht.status === 'maintenance' ? 'pending' : 'cancelled']
  const yachtStatusDisplay: Record<string, { label: string; cls: string }> = {
    available: { label: '可用', cls: 'bg-emerald-100 text-emerald-700' },
    maintenance: { label: '维护中', cls: 'bg-amber-100 text-amber-700' },
    retired: { label: '已退役', cls: 'bg-slate-100 text-slate-500' },
  }
  const ys = yachtStatusDisplay[yacht.status]

  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 })
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))

  return (
    <div className="min-h-screen bg-foam-50 p-6">
      <div className="mx-auto max-w-5xl">
        <Link
          to="/yachts"
          className="mb-6 inline-flex items-center gap-1.5 text-sm text-slate-500 transition hover:text-navy-900"
        >
          <ArrowLeft className="h-4 w-4" />
          返回游艇列表
        </Link>

        <div className="overflow-hidden rounded-xl border border-foam-200 bg-white shadow-sm">
          <div className="md:flex">
            <img
              src={yacht.imageUrl}
              alt={yacht.name}
              className="h-64 w-full object-cover md:h-auto md:w-80"
            />
            <div className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <h1 className="font-display text-2xl font-semibold text-navy-900">
                    {yacht.name}
                  </h1>
                  <p className="mt-0.5 text-slate-500">{yacht.model}</p>
                </div>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-medium ${ys.cls}`}
                >
                  {ys.label}
                </span>
              </div>
              <div className="mt-4 flex items-center gap-6 text-sm text-slate-600">
                <span className="flex items-center gap-1.5">
                  <Users className="h-4 w-4 text-navy-500" />
                  {yacht.capacity}人
                </span>
                <span className="flex items-center gap-1.5">
                  <Ruler className="h-4 w-4 text-navy-500" />
                  {yacht.length}m
                </span>
              </div>
              {yacht.description && (
                <p className="mt-4 text-sm leading-relaxed text-slate-600">
                  {yacht.description}
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="mt-8">
          <div className="mb-4 flex items-center gap-2">
            <Calendar className="h-5 w-5 text-navy-500" />
            <h2 className="font-display text-xl font-semibold text-navy-900">
              排期日历
            </h2>
          </div>

          <div className="overflow-hidden rounded-xl border border-foam-200 bg-white shadow-sm">
            <div className="grid grid-cols-7 divide-x divide-foam-100">
              {weekDays.map((day) => {
                const dayStr = format(day, 'yyyy-MM-dd')
                const dayBookings = yachtBookings.filter((b) =>
                  isSameDay(parseISO(b.startTime), day)
                )
                const isToday = isSameDay(day, new Date())

                return (
                  <div key={dayStr} className="min-h-[160px]">
                    <div
                      className={`border-b border-foam-100 px-3 py-2 text-center text-xs ${
                        isToday
                          ? 'bg-ocean-400/10 font-semibold text-ocean-500'
                          : 'text-slate-500'
                      }`}
                    >
                      <div>{format(day, 'EEE')}</div>
                      <div className="mt-0.5 text-sm">{format(day, 'd')}</div>
                    </div>
                    <div className="space-y-1.5 p-2">
                      {dayBookings.map((b) => {
                        const bc = statusLabel[b.status] || statusLabel.pending
                        return (
                          <div
                            key={b.id}
                            className={`rounded border px-2 py-1.5 text-xs ${bc.barCls}`}
                          >
                            <div className="font-medium text-navy-900 truncate">
                              {b.customerName}
                            </div>
                            <div className="text-slate-600">
                              {format(parseISO(b.startTime), 'HH:mm')}-
                              {format(parseISO(b.endTime), 'HH:mm')}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
