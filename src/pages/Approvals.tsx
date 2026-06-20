import { useStore } from '@/store'
import type { Booking } from '@/types'
import { CheckCircle, XCircle, Clock, AlertCircle } from 'lucide-react'
import { useState } from 'react'
import { format, parseISO, differenceInMinutes } from 'date-fns'

export default function Approvals() {
  const { bookings, yachts, approveBooking, rejectBooking } = useStore()
  const [comments, setComments] = useState<Record<string, string>>({})

  const pendingBookings = bookings.filter(
    (b) => b.approvalStatus === 'pending'
  )
  const rejectedBookings = bookings.filter(
    (b) => b.approvalStatus === 'rejected'
  )

  const getYachtName = (booking: Booking) => {
    const yacht = yachts.find((y) => y.id === booking.yachtId)
    return yacht?.name ?? '—'
  }

  const getDurationHours = (booking: Booking) => {
    const mins = differenceInMinutes(
      parseISO(booking.endTime),
      parseISO(booking.startTime)
    )
    return (mins / 60).toFixed(1)
  }

  const handleApprove = (id: string) => {
    approveBooking(id, comments[id] ?? '')
    setComments((prev) => {
      const next = { ...prev }
      delete next[id]
      return next
    })
  }

  const handleReject = (id: string) => {
    rejectBooking(id, comments[id] ?? '')
    setComments((prev) => {
      const next = { ...prev }
      delete next[id]
      return next
    })
  }

  return (
    <div className="min-h-screen bg-foam-50 p-6">
      <div className="mx-auto max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-navy-900">出海报备审批</h1>
          <p className="mt-1 font-display text-lg text-gold-500">
            Departure Approval
          </p>
        </div>

        <section className="mb-10">
          <div className="mb-4 flex items-center gap-2">
            <Clock className="h-5 w-5 text-ocean-500" />
            <h2 className="text-xl font-semibold text-navy-900">待审批</h2>
            {pendingBookings.length > 0 && (
              <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-ocean-500 px-1.5 text-xs font-bold text-white">
                {pendingBookings.length}
              </span>
            )}
          </div>

          {pendingBookings.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-foam-200 bg-white py-12">
              <CheckCircle className="mb-3 h-12 w-12 text-green-300" />
              <p className="text-slate-500">暂无待审批记录</p>
            </div>
          ) : (
            <div className="space-y-4">
              {pendingBookings.map((booking) => (
                <div
                  key={booking.id}
                  className="rounded-2xl border border-foam-200 bg-white p-5 shadow-sm"
                >
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-3">
                        <span className="text-lg font-semibold text-navy-900">
                          {booking.customerName}
                        </span>
                        <span className="text-sm text-slate-500">
                          {booking.customerPhone}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-4 text-sm text-slate-600">
                        <span className="inline-flex items-center gap-1 rounded-full bg-foam-100 px-2.5 py-0.5 font-medium text-navy-800">
                          {getYachtName(booking)}
                        </span>
                        <span>
                          {format(parseISO(booking.startTime), 'MM-dd HH:mm')} —{' '}
                          {format(parseISO(booking.endTime), 'MM-dd HH:mm')}
                        </span>
                        <span className="text-slate-400">
                          {getDurationHours(booking)}h
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 border-t border-foam-100 pt-4">
                    <input
                      type="text"
                      placeholder="审批备注（可选）"
                      value={comments[booking.id] ?? ''}
                      onChange={(e) =>
                        setComments((prev) => ({
                          ...prev,
                          [booking.id]: e.target.value,
                        }))
                      }
                      className="mb-3 w-full rounded-lg border border-foam-200 bg-foam-50 px-3 py-2 text-sm text-slate-700 placeholder:text-slate-400 focus:border-ocean-500 focus:outline-none"
                    />
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => handleApprove(booking.id)}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-green-50 px-4 py-2 text-sm font-medium text-green-700 transition-colors hover:bg-green-100"
                      >
                        <CheckCircle className="h-4 w-4" />
                        通过
                      </button>
                      <button
                        onClick={() => handleReject(booking.id)}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-red-50 px-4 py-2 text-sm font-medium text-red-700 transition-colors hover:bg-red-100"
                      >
                        <XCircle className="h-4 w-4" />
                        驳回
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section>
          <div className="mb-4 flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-slate-400" />
            <h2 className="text-xl font-semibold text-slate-500">驳回记录</h2>
          </div>

          {rejectedBookings.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-foam-200 bg-white/50 py-8">
              <p className="text-sm text-slate-400">暂无驳回记录</p>
            </div>
          ) : (
            <div className="space-y-3">
              {rejectedBookings.map((booking) => (
                <div
                  key={booking.id}
                  className="rounded-xl border border-foam-200 bg-white/60 p-4 opacity-70"
                >
                  <div className="flex flex-wrap items-center gap-3 text-sm">
                    <span className="font-medium text-slate-600">
                      {booking.customerName}
                    </span>
                    <span className="text-slate-400">
                      {getYachtName(booking)}
                    </span>
                    <span className="text-slate-400">
                      {format(parseISO(booking.startTime), 'MM-dd HH:mm')} —{' '}
                      {format(parseISO(booking.endTime), 'MM-dd HH:mm')}
                    </span>
                  </div>
                  {booking.approvalComment && (
                    <p className="mt-2 text-sm text-red-400">
                      驳回原因：{booking.approvalComment}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
