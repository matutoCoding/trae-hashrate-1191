import { useStore } from '@/store'
import type { Bill, BillSegment, PaymentRecord } from '@/types'
import { Receipt, DollarSign, CheckCircle, Eye, Download, Plus, XCircle, CreditCard } from 'lucide-react'
import { useState } from 'react'
import { format, parseISO } from 'date-fns'

type FilterTab = 'all' | 'unpaid' | 'paid' | 'cancelled' | 'refund_pending'

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

const statusLabel: Record<string, { label: string; cls: string }> = {
  unpaid: { label: '未支付', cls: 'bg-red-100 text-red-700' },
  paid: { label: '已支付', cls: 'bg-green-100 text-green-700' },
  cancelled: { label: '已作废', cls: 'bg-gray-100 text-gray-700' },
  refund_pending: { label: '待退款', cls: 'bg-orange-100 text-orange-700' },
}

const paymentTypeLabel: Record<string, string> = {
  deposit: '订金',
  balance: '尾款',
  full: '全款',
}

function pad(s: string, len: number): string {
  while (s.length < len) s += ' '
  return s.slice(0, len)
}

function exportBillText(
  bill: Bill,
  booking: { customerName: string; customerPhone: string; startTime: string; endTime: string } | undefined,
  yacht: { name: string; model: string } | null,
  segments: BillSegment[],
  payments: PaymentRecord[]
) {
  const lines: string[] = []
  lines.push('================================')
  lines.push('          游艇出海账单')
  lines.push('================================')
  lines.push('')
  lines.push(`客户姓名：${booking?.customerName ?? '—'}
`)
  lines.push(`联系电话：${booking?.customerPhone ?? '—'}
`)
  lines.push(`游艇名称：${yacht?.name ?? '—'}
`)
  if (yacht?.model) lines.push(`游艇型号：${yacht.model}
`)
  lines.push('')
  if (booking) {
    lines.push(`出海时间：${format(parseISO(booking.startTime), 'yyyy-MM-dd HH:mm')}
`)
    lines.push(`返回时间：${format(parseISO(booking.endTime), 'yyyy-MM-dd HH:mm')}
`)
  }
  lines.push('')
  lines.push('--------------------------------')
  lines.push('分段计费明细')
  lines.push('--------------------------------')
  lines.push(
    `${pad('费率档位', 12)}${pad('类型', 6)}${pad('时段范围', 16)}${pad('时长(h)', 8)}${pad('费率(¥/h)', 10)}小计(¥)`
  )
  for (const seg of segments) {
    const timeRange = `${format(parseISO(seg.segmentStart), 'HH:mm')}-${format(parseISO(seg.segmentEnd), 'HH:mm')}
`
    lines.push(
      `${pad(seg.rateTierName, 12)}${pad(typeLabel[seg.rateTierType] ?? '', 6)}${pad(timeRange, 16)}${pad(seg.durationHours.toFixed(1), 8)}${pad(seg.rate.toLocaleString(), 10)}${seg.subtotal.toLocaleString()}`
    )
  }
  lines.push('--------------------------------')
  lines.push(`账单总额：¥${bill.totalAmount.toLocaleString()}
`)
  lines.push(`应收订金：¥${bill.depositAmount.toLocaleString()}
`)
  if (payments.length > 0) {
    lines.push('')
    lines.push('--------------------------------')
    lines.push('收款记录')
    lines.push('--------------------------------')
    for (const p of payments) {
      lines.push(`${format(parseISO(p.paidAt), 'yyyy-MM-dd HH:mm')}  ${paymentTypeLabel[p.type] ?? p.type}  ¥${p.amount.toLocaleString()}
`)
    }
    lines.push('--------------------------------')
  }
  lines.push(`已收金额：¥${bill.paidAmount.toLocaleString()}
`)
  lines.push(`待收金额：¥${Math.max(bill.totalAmount - bill.paidAmount, 0).toLocaleString()}
`)
  lines.push('================================')
  lines.push(`生成日期：${format(parseISO(bill.generatedAt), 'yyyy-MM-dd HH:mm')}
`)
  lines.push(`账单编号：${bill.id.slice(0, 8).toUpperCase()}
`)

  const content = lines.join('\n')
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `账单_${booking?.customerName ?? 'unknown'}_${format(parseISO(bill.generatedAt), 'yyyyMMdd')}.txt`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

interface PaymentModalProps {
  bill: Bill
  onClose: () => void
  onSubmit: (payment: Omit<PaymentRecord, 'id' | 'billId'>) => void
}

function PaymentModal({ bill, onClose, onSubmit }: PaymentModalProps) {
  const [paymentType, setPaymentType] = useState<'deposit' | 'balance' | 'full'>('deposit')
  const [amount, setAmount] = useState('')
  const [note, setNote] = useState('')

  const remaining = Math.max(bill.totalAmount - bill.paidAmount, 0)
  const depositRemaining = Math.max(bill.depositAmount - bill.paidAmount, 0)
  const balanceAmount = Math.max(bill.totalAmount - bill.depositAmount, 0)

  const suggestedAmount =
    paymentType === 'deposit' ? depositRemaining : paymentType === 'full' ? remaining : balanceAmount

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-navy-900/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
        <div className="px-6 py-4 bg-navy-900 text-white flex items-center justify-between">
          <h2 className="text-lg font-bold font-display">登记收款</h2>
          <button onClick={onClose} className="text-white/70 hover:text-white transition-colors">
            <XCircle className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="bg-foam-50 rounded-lg p-4">
            <div className="text-sm text-navy-700 space-y-1">
              <div className="flex justify-between">
                <span>账单总额</span>
                <span className="font-semibold">¥{bill.totalAmount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span>应收订金 (30%)</span>
                <span className="font-semibold">¥{bill.depositAmount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between border-t border-foam-200 pt-2 mt-2">
                <span>已收金额</span>
                <span className="font-semibold">¥{bill.paidAmount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-ocean-600">待收金额</span>
                <span className="font-semibold text-ocean-600">¥{remaining.toLocaleString()}</span>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-navy-700 mb-2">收款类型</label>
            <div className="grid grid-cols-3 gap-2">
              {(['deposit', 'balance', 'full'] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => {
                    setPaymentType(t)
                    const suggested =
                      t === 'deposit' ? depositRemaining : t === 'full' ? remaining : balanceAmount
                    setAmount(suggested.toFixed(2))
                  }}
                  className={`px-3 py-2 text-sm rounded-lg transition-colors ${
                    paymentType === t
                      ? 'bg-gold-500 text-navy-900 font-semibold'
                      : 'bg-foam-100 text-navy-600 hover:bg-foam-200'
                  }`}
                >
                  {paymentTypeLabel[t]}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-navy-700 mb-1">收款金额 (¥)</label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full px-3 py-2.5 text-sm bg-foam-50 border border-foam-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-ocean-500/30 focus:border-ocean-500 transition-colors"
              placeholder={suggestedAmount.toFixed(2)}
            />
            <p className="text-xs text-navy-500 mt-1">建议金额：¥{suggestedAmount.toFixed(2)}</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-navy-700 mb-1">备注</label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full px-3 py-2.5 text-sm bg-foam-50 border border-foam-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-ocean-500/30 focus:border-ocean-500 transition-colors"
              placeholder="可选，如收款方式、转账单号等"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-sm font-medium text-navy-700 bg-foam-100 rounded-lg hover:bg-foam-200 transition-colors"
            >
              取消
            </button>
            <button
              type="button"
              onClick={() => {
                const amt = parseFloat(amount)
                if (isNaN(amt) || amt <= 0 || amt > remaining + 0.01) return
                onSubmit({
                  amount: Math.round(amt * 100) / 100,
                  type: paymentType,
                  paidAt: new Date().toISOString(),
                  note,
                })
                onClose()
              }}
              className="px-6 py-2.5 text-sm font-semibold text-navy-900 bg-gold-500 rounded-lg hover:bg-gold-400 transition-colors shadow-sm"
            >
              确认收款
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function Bills() {
  const { bills, billSegments, bookings, yachts, paymentRecords, addPayment, refundBill } = useStore()
  const [activeTab, setActiveTab] = useState<FilterTab>('all')
  const [expandedBillId, setExpandedBillId] = useState<string | null>(null)
  const [paymentModalBill, setPaymentModalBill] = useState<Bill | null>(null)

  const tabs: { key: FilterTab; label: string }[] = [
    { key: 'all', label: '全部' },
    { key: 'unpaid', label: '未支付' },
    { key: 'paid', label: '已支付' },
    { key: 'refund_pending', label: '待退款' },
    { key: 'cancelled', label: '已作废' },
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

  const getPayments = (billId: string) =>
    paymentRecords.filter((p) => p.billId === billId).sort((a, b) => new Date(a.paidAt).getTime() - new Date(b.paidAt).getTime())

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

        <div className="mb-6 flex flex-wrap gap-2">
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
              const payments = getPayments(bill.id)
              const remaining = Math.max(bill.totalAmount - bill.paidAmount, 0)
              const shortId = bill.id.slice(0, 8).toUpperCase()
              const statusInfo = statusLabel[bill.status] ?? statusLabel.unpaid
              const canCollect = bill.status === 'unpaid' && remaining > 0.01

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
                            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${statusInfo.cls}`}
                          >
                            {statusInfo.label}
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
                        {bill.paidAmount > 0 && (
                          <div className="text-xs text-slate-500">
                            已收 ¥{bill.paidAmount.toLocaleString()}
                            {remaining > 0.01 && (
                              <span className="text-ocean-600"> / 待收 ¥{remaining.toLocaleString()}</span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-foam-100 pt-4">
                      <button
                        onClick={() => toggleDetail(bill.id)}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-foam-50 px-3 py-1.5 text-sm font-medium text-navy-800 transition-colors hover:bg-foam-100"
                      >
                        <Eye className="h-4 w-4" />
                        {isExpanded ? '收起详情' : '查看详情'}
                      </button>
                      <button
                        onClick={() =>
                          exportBillText(
                            bill,
                            booking
                              ? {
                                  customerName: booking.customerName,
                                  customerPhone: booking.customerPhone,
                                  startTime: booking.startTime,
                                  endTime: booking.endTime,
                                }
                              : undefined,
                            yacht
                              ? { name: yacht.name, model: yacht.model }
                              : null,
                            getSegments(bill.id),
                            payments
                          )
                        }
                        className="inline-flex items-center gap-1.5 rounded-lg bg-navy-900 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-navy-800"
                      >
                        <Download className="h-4 w-4" />
                        导出账单
                      </button>
                      {canCollect && (
                        <button
                          onClick={() => setPaymentModalBill(bill)}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-green-50 px-3 py-1.5 text-sm font-medium text-green-700 transition-colors hover:bg-green-100"
                        >
                          <CreditCard className="h-4 w-4" />
                          登记收款
                        </button>
                      )}
                      {bill.status === 'unpaid' && remaining <= 0.01 && (
                        <span className="inline-flex items-center gap-1.5 rounded-lg bg-green-100 px-3 py-1.5 text-sm font-medium text-green-700">
                          <CheckCircle className="h-4 w-4" />
                          已全额收款
                        </span>
                      )}
                      {bill.status === 'unpaid' && bill.paidAmount > 0 && remaining > 0.01 && (
                        <span className="inline-flex items-center gap-1.5 rounded-lg bg-ocean-50 px-3 py-1.5 text-sm font-medium text-ocean-700">
                          部分收款
                        </span>
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

                      <div className="mb-4 grid grid-cols-3 gap-4">
                        <div className="rounded-lg bg-white p-3 text-center">
                          <div className="text-xs text-slate-500">账单总额</div>
                          <div className="text-lg font-bold text-navy-900">¥{bill.totalAmount.toLocaleString()}</div>
                        </div>
                        <div className="rounded-lg bg-white p-3 text-center">
                          <div className="text-xs text-slate-500">应收订金</div>
                          <div className="text-lg font-bold text-ocean-600">¥{bill.depositAmount.toLocaleString()}</div>
                        </div>
                        <div className="rounded-lg bg-white p-3 text-center">
                          <div className="text-xs text-slate-500">待收金额</div>
                          <div className="text-lg font-bold text-gold-600">¥{remaining.toLocaleString()}</div>
                        </div>
                      </div>

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

                      {payments.length > 0 && (
                        <div className="mt-6">
                          <h4 className="mb-3 text-sm font-semibold text-navy-800">收款记录</h4>
                          <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                              <thead>
                                <tr className="border-b border-foam-200 text-left text-xs font-medium uppercase text-slate-500">
                                  <th className="pb-2 pr-4">收款时间</th>
                                  <th className="pb-2 pr-4">类型</th>
                                  <th className="pb-2 pr-4 text-right">金额(¥)</th>
                                  <th className="pb-2 text-right">备注</th>
                                </tr>
                              </thead>
                              <tbody>
                                {payments.map((p) => (
                                  <tr key={p.id} className="border-b border-foam-100 last:border-0">
                                    <td className="py-2 pr-4 text-slate-600">
                                      {format(parseISO(p.paidAt), 'yyyy-MM-dd HH:mm')}
                                    </td>
                                    <td className="py-2 pr-4">
                                      <span className="inline-flex rounded-full px-2 py-0.5 text-xs font-medium bg-foam-100 text-navy-700">
                                        {paymentTypeLabel[p.type]}
                                      </span>
                                    </td>
                                    <td className="py-2 pr-4 text-right font-medium text-green-700">
                                      ¥{p.amount.toLocaleString()}
                                    </td>
                                    <td className="py-2 text-right text-slate-500">{p.note || '—'}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {paymentModalBill && (
        <PaymentModal
          bill={paymentModalBill}
          onClose={() => setPaymentModalBill(null)}
          onSubmit={(payment) => addPayment(paymentModalBill.id, payment)}
        />
      )}
    </div>
  )
}
