import { useStore } from '@/store'
import type { Bill, BillSegment } from '@/types'
import { Link, useParams } from 'react-router-dom'
import { Receipt, DollarSign, CheckCircle, Eye } from 'lucide-react'
import { useState } from 'react'
import { format, parseISO } from 'date-fns'

type FilterTab = 'all' | 'unpaid' | 'paid'

const typeBadge: Record<string, string> = {
  peak: 'bg-amber-100 text-amber-700',
  standard: 'bg-blue-100 text-blue-700',
  offpeak: 'bg-teal-100 text-teal-700',
}

const typeLabel: Record<string, string> = {
  peak: '高峰',
  standard: '平峰',
  offpeak: '低谷',
}

export default function Bills() {
  const { bills, billSegments, bookings, yachts, payBill } = useStore()
  const [activeTab, setActiveTab] = useState<FilterTab>('all')
  const [expandedBillId, setExpandedBillId] = useState<string | null>(null)

  const tabs: { key: FilterTab; label: string }[] = [
    { key: 'all', label: '全部' },
    { key: 'unpaid', label: '未支付' },
    { key: 'paid', label: '已支付' },
  ]

  const filteredBills =
    activeTab === 'all'
      ? bills
      : bills.filter((b) => b.status === activeTab)

  const getBooking = (bill: Bill) =>
    bookings.find((bk) => bk.id === bill.bookingId)

  const getYacht = (bookingId: string) => {
    const booking = bookings.find((bk) => bk.id === bookingId)
    if (!booking) return null
    return yachts.find((y) => y.id === booking.yachtId)
  }

  const getSegments = (billId: string) =>
    billSegments.filter((seg) => seg.billId === billId)

  const toggleDetail = (billId: string) => {
    setExpandedBillId((prev) => (prev === billId ? null : billId))
  }

  return (
    <div className="min-h-screen bg-foam-50 p-6">
      <div className="mx-auto max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-navy-900">账单中心</h1>
          <p className="mt-1 font-display text-lg text-gold-500">
            Billing Center
          </p>
        </div>

        <div className="mb-6 flex gap-2">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                activeTab === tab.key
                  ? 'bg-navy-900 text-white'
                  : 'bg-foam-100 text-slate-600 hover:bg-foam-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {filteredBills.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-foam-200 bg-white py-16">
            <Receipt className="mb-3 h-12 w-12 text-foam-200" />
            <p className="text-slate-500">暂无账单</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredBills.map((bill) => {
              const booking = getBooking(bill)
              const yacht = getYacht(bill.bookingId)
              const isExpanded = expandedBillId === bill.id
              const segments = isExpanded ? getSegments(bill.id) : []
              const shortId = bill.id.slice(0, 8).toUpperCase()

              return (
                <div
                  key={bill.id}
                  className="overflow-hidden rounded-2xl border border-foam-200 bg-white shadow-sm"
                >
                  <div className="p-5">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="mb-1 flex items-center gap-3">
                          <span className="font-mono text-sm text-slate-500">
                            #{shortId}
                          </span>
                          <span
                            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                              bill.status === 'unpaid'
                                ? 'bg-red-100 text-red-700'
                                : 'bg-green-100 text-green-700'
                            }`}
                          >
                            {bill.status === 'unpaid' ? '未支付' : '已支付'}
                          </span>
                        </div>
                        <div className="mt-2 flex items-center gap-4 text-sm text-slate-600">
                          <span>{booking?.customerName ?? '—'}</span>
                          <span className="text-foam-200">|</span>
                          <span>{yacht?.name ?? '—'}</span>
                        </div>
                        <div className="mt-1 text-xs text-slate-400">
                          生成日期：{format(parseISO(bill.generatedAt), 'yyyy-MM-dd HH:mm')}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center gap-1 text-2xl font-bold text-gold-500">
                          <DollarSign className="h-5 w-5" />
                          {bill.totalAmount.toLocaleString()}
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 flex items-center gap-3 border-t border-foam-100 pt-4">
                      <button
                        onClick={() => toggleDetail(bill.id)}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-foam-50 px-3 py-1.5 text-sm font-medium text-navy-800 transition-colors hover:bg-foam-100"
                      >
                        <Eye className="h-4 w-4" />
                        {isExpanded ? '收起详情' : '查看详情'}
                      </button>
                      {bill.status === 'unpaid' && (
                        <button
                          onClick={() => payBill(bill.id)}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-green-50 px-3 py-1.5 text-sm font-medium text-green-700 transition-colors hover:bg-green-100"
                        >
                          <CheckCircle className="h-4 w-4" />
                          标记已付
                        </button>
                      )}
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="border-t border-foam-100 bg-foam-50 p-5">
                      {booking && (
                        <div className="mb-4 text-sm text-slate-600">
                          <span className="font-medium text-navy-800">预约时段：</span>
                          {format(parseISO(booking.startTime), 'yyyy-MM-dd HH:mm')} —{' '}
                          {format(parseISO(booking.endTime), 'yyyy-MM-dd HH:mm')}
                        </div>
                      )}

                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b border-foam-200 text-left text-xs font-medium uppercase text-slate-500">
                              <th className="pb-2 pr-4">费率档位</th>
                              <th className="pb-2 pr-4">类型</th>
                              <th className="pb-2 pr-4">时段范围</th>
                              <th className="pb-2 pr-4 text-right">时长(h)</th>
                              <th className="pb-2 pr-4 text-right">费率(¥/h)</th>
                              <th className="pb-2 text-right">小计(¥)</th>
                            </tr>
                          </thead>
                          <tbody>
                            {segments.map((seg) => (
                              <tr
                                key={seg.id}
                                className="border-b border-foam-100 last:border-0"
                              >
                                <td className="py-2.5 pr-4 text-slate-700">
                                  {seg.rateTierName}
                                </td>
                                <td className="py-2.5 pr-4">
                                  <span
                                    className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${typeBadge[seg.rateTierType]}`}
                                  >
                                    {typeLabel[seg.rateTierType]}
                                  </span>
                                </td>
                                <td className="py-2.5 pr-4 text-slate-500">
                                  {format(parseISO(seg.segmentStart), 'HH:mm')}–
                                  {format(parseISO(seg.segmentEnd), 'HH:mm')}
                                </td>
                                <td className="py-2.5 pr-4 text-right text-slate-600">
                                  {seg.durationHours}
                                </td>
                                <td className="py-2.5 pr-4 text-right text-slate-600">
                                  {seg.rate.toLocaleString()}
                                </td>
                                <td className="py-2.5 text-right text-slate-700">
                                  {seg.subtotal.toLocaleString()}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                          <tfoot>
                            <tr className="border-t-2 border-navy-900">
                              <td
                                colSpan={5}
                                className="py-3 text-right font-medium text-navy-900"
                              >
                                合计
                              </td>
                              <td className="py-3 text-right text-lg font-bold text-gold-500">
                                ¥{bill.totalAmount.toLocaleString()}
                              </td>
                            </tr>
                          </tfoot>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
