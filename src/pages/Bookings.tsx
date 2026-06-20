import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Calendar, List, XCircle, AlertTriangle, Search } from 'lucide-react'
import { format, parseISO, startOfWeek, addDays, isSameDay } from 'date-fns'
import { useStore } from '@/store'
import type { Booking } from '@/types'

type TabKey = 'calendar' | 'list'

const STATUS_MAP: Record<Booking['status'], { label: string; cls: string }> = {
  pending: { label: '待确认', cls: 'bg-yellow-100 text-yellow-800' },
  confirmed: { label: '已确认', cls: 'bg-green-100 text-green-800' },
  cancelled: { label: '已取消', cls: 'bg-red-100 text-red-800' },
  completed: { label: '已完成', cls: 'bg-blue-100 text-blue-800' },
}

const APPROVAL_MAP: Record<Booking['approvalStatus'], { label: string; cls: string }> = {
  pending: { label: '待审批', cls: 'bg-yellow-100 text-yellow-800' },
  approved: { label: '已审批', cls: 'bg-green-100 text-green-800' },
  rejected: { label: '已驳回', cls: 'bg-red-100 text-red-800' },
}

const BAR_COLORS = [
  'bg-ocean-500/80 text-white',
  'bg-navy-600/80 text-white',
  'bg-gold-500/80 text-navy-900',
  'bg-emerald-500/80 text-white',
  'bg-violet-500/80 text-white',
]

function getDurationHours(start: string, end: string): string {
  const ms = new Date(end).getTime() - new Date(start).getTime()
  const h = ms / (1000 * 60 * 60)
  return h % 1 === 0 ? `${h}h` : `${h.toFixed(1)}h`
}

interface ModalForm {
  yachtId: string
  customerName: string
  customerPhone: string
  startTime: string
  endTime: string
}

const EMPTY_FORM: ModalForm = {
  yachtId: '',
  customerName: '',
  customerPhone: '',
  startTime: '',
  endTime: '',
}

export default function Bookings() {
  const { bookings, yachts, addBooking, cancelBooking, rateTiers } = useStore()
  const [activeTab, setActiveTab] = useState<TabKey>('calendar')
  const [weekOffset, setWeekOffset] = useState(0)
  const [searchText, setSearchText] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState<ModalForm>(EMPTY_FORM)
  const [conflict, setConflict] = useState<Booking | null>(null)
  const [submitSuccess, setSubmitSuccess] = useState(false)

  const availableYachts = yachts.filter((y) => y.status === 'available')

  const weekStart = startOfWeek(addDays(new Date(), weekOffset * 7), { weekStartsOn: 1 })
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))

  function bookingBarColor(yachtId: string): string {
    const idx = yachts.findIndex((y) => y.id === yachtId)
    return BAR_COLORS[idx % BAR_COLORS.length]
  }

  function getBookingsForCell(yachtId: string, day: Date): Booking[] {
    return bookings.filter((b) => {
      if (b.yachtId !== yachtId || b.status === 'cancelled') return false
      const s = parseISO(b.startTime)
      const e = parseISO(b.endTime)
      return s <= addDays(day, 1) && e >= day
    })
  }

  function handleCellClick(yachtId: string, day: Date) {
    const dateStr = format(day, 'yyyy-MM-dd')
    setForm({
      ...EMPTY_FORM,
      yachtId,
      startTime: `${dateStr}T09:00`,
      endTime: `${dateStr}T17:00`,
    })
    setConflict(null)
    setSubmitSuccess(false)
    setShowModal(true)
  }

  function handleOpenModal() {
    setForm(EMPTY_FORM)
    setConflict(null)
    setSubmitSuccess(false)
    setShowModal(true)
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setConflict(null)
    setSubmitSuccess(false)

    const result = addBooking({
      yachtId: form.yachtId,
      customerName: form.customerName,
      customerPhone: form.customerPhone,
      startTime: form.startTime,
      endTime: form.endTime,
      status: 'pending',
    })

    if (result === null) {
      const conflicting = bookings.find((b) => {
        if (b.yachtId !== form.yachtId || b.status === 'cancelled') return false
        const ns = new Date(form.startTime).getTime()
        const ne = new Date(form.endTime).getTime()
        const bs = new Date(b.startTime).getTime()
        const be = new Date(b.endTime).getTime()
        return ns < be && bs < ne
      })
      setConflict(conflicting ?? null)
    } else {
      setSubmitSuccess(true)
      setTimeout(() => {
        setShowModal(false)
        setSubmitSuccess(false)
      }, 800)
    }
  }

  const filteredBookings = bookings.filter((b) =>
    b.customerName.toLowerCase().includes(searchText.toLowerCase())
  )

  const tabs: { key: TabKey; label: string; icon: React.ReactNode }[] = [
    { key: 'calendar', label: '排期日历', icon: <Calendar className="w-4 h-4" /> },
    { key: 'list', label: '预订列表', icon: <List className="w-4 h-4" /> },
  ]

  return (
    <div className="min-h-screen bg-foam-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-navy-900 font-display">预订管理</h1>
            <p className="text-sm text-navy-500 mt-1">管理游艇预订与排期</p>
          </div>
          <button
            onClick={handleOpenModal}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-gold-500 text-navy-900 rounded-lg font-semibold hover:bg-gold-400 transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            新建预订
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-foam-100 p-1 rounded-lg w-fit mb-6">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === tab.key
                  ? 'bg-white text-navy-900 shadow-sm'
                  : 'text-navy-500 hover:text-navy-700'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* Calendar Tab */}
        {activeTab === 'calendar' && (
          <div className="bg-white rounded-xl shadow-sm border border-foam-200 overflow-hidden">
            {/* Week Navigation */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-foam-100">
              <button
                onClick={() => setWeekOffset((w) => w - 1)}
                className="px-3 py-1.5 text-sm font-medium text-navy-700 bg-foam-50 rounded-lg hover:bg-foam-100 transition-colors"
              >
                ← 上一周
              </button>
              <span className="text-sm font-semibold text-navy-900">
                {format(weekStart, 'yyyy年M月d日')} — {format(addDays(weekStart, 6), 'M月d日')}
              </span>
              <button
                onClick={() => setWeekOffset((w) => w + 1)}
                className="px-3 py-1.5 text-sm font-medium text-navy-700 bg-foam-50 rounded-lg hover:bg-foam-100 transition-colors"
              >
                下一周 →
              </button>
            </div>

            {/* Calendar Grid */}
            <div className="overflow-x-auto">
              <table className="w-full min-w-[800px]">
                <thead>
                  <tr>
                    <th className="sticky left-0 z-10 bg-foam-50 px-4 py-3 text-left text-xs font-semibold text-navy-500 uppercase tracking-wider border-b border-r border-foam-200 w-32">
                      游艇
                    </th>
                    {weekDays.map((day) => (
                      <th
                        key={day.toISOString()}
                        className={`px-3 py-3 text-center text-xs font-semibold uppercase tracking-wider border-b border-foam-200 ${
                          isSameDay(day, new Date())
                            ? 'text-ocean-500 bg-ocean-500/5'
                            : 'text-navy-500'
                        }`}
                      >
                        <div>{format(day, 'EEE')}</div>
                        <div className="text-sm font-bold mt-0.5">{format(day, 'd')}</div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {yachts.map((yacht) => (
                    <tr key={yacht.id} className="border-b border-foam-100 last:border-b-0">
                      <td className="sticky left-0 z-10 bg-white px-4 py-3 text-sm font-medium text-navy-900 border-r border-foam-200">
                        {yacht.name}
                      </td>
                      {weekDays.map((day) => {
                        const cellBookings = getBookingsForCell(yacht.id, day)
                        return (
                          <td
                            key={day.toISOString()}
                            className={`px-2 py-2 align-top border-r border-foam-100 last:border-r-0 min-h-[60px] ${
                              isSameDay(day, new Date()) ? 'bg-ocean-500/5' : ''
                            }`}
                          >
                            {cellBookings.length > 0 ? (
                              cellBookings.map((b) => (
                                <div
                                  key={b.id}
                                  className={`${bookingBarColor(b.yachtId)} rounded px-2 py-1 text-xs font-medium mb-1 truncate`}
                                  title={`${b.customerName} ${format(parseISO(b.startTime), 'HH:mm')}-${format(parseISO(b.endTime), 'HH:mm')}`}
                                >
                                  {b.customerName}
                                </div>
                              ))
                            ) : (
                              <button
                                onClick={() => handleCellClick(yacht.id, day)}
                                className="w-full h-full min-h-[36px] rounded border border-dashed border-foam-200 hover:border-ocean-500 hover:bg-ocean-500/5 transition-colors flex items-center justify-center opacity-0 hover:opacity-100"
                              >
                                <Plus className="w-3.5 h-3.5 text-ocean-500" />
                              </button>
                            )}
                          </td>
                        )
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* List Tab */}
        {activeTab === 'list' && (
          <div className="bg-white rounded-xl shadow-sm border border-foam-200 overflow-hidden">
            {/* Search */}
            <div className="px-6 py-4 border-b border-foam-100 flex items-center gap-3">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-navy-500" />
                <input
                  type="text"
                  placeholder="搜索客户姓名..."
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 text-sm bg-foam-50 border border-foam-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-ocean-500/30 focus:border-ocean-500 transition-colors"
                />
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px]">
                <thead>
                  <tr className="bg-foam-50">
                    <th className="px-4 py-3 text-left text-xs font-semibold text-navy-500 uppercase tracking-wider">预订编号</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-navy-500 uppercase tracking-wider">游艇</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-navy-500 uppercase tracking-wider">客户</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-navy-500 uppercase tracking-wider">出海时间</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-navy-500 uppercase tracking-wider">返回时间</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-navy-500 uppercase tracking-wider">时长</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-navy-500 uppercase tracking-wider">状态</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-navy-500 uppercase tracking-wider">审批</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-navy-500 uppercase tracking-wider">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredBookings.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="px-4 py-12 text-center text-sm text-navy-500">
                        暂无预订记录
                      </td>
                    </tr>
                  ) : (
                    filteredBookings.map((b) => {
                      const yacht = yachts.find((y) => y.id === b.yachtId)
                      const st = STATUS_MAP[b.status]
                      const ap = APPROVAL_MAP[b.approvalStatus]
                      const canCancel = b.status === 'pending' || b.status === 'confirmed'
                      return (
                        <tr key={b.id} className="border-t border-foam-100 hover:bg-foam-50/50 transition-colors">
                          <td className="px-4 py-3 text-sm font-mono text-navy-700">{b.id.slice(0, 8)}</td>
                          <td className="px-4 py-3 text-sm text-navy-900 font-medium">{yacht?.name ?? '—'}</td>
                          <td className="px-4 py-3 text-sm text-navy-700">{b.customerName}</td>
                          <td className="px-4 py-3 text-sm text-navy-700">{format(parseISO(b.startTime), 'MM-dd HH:mm')}</td>
                          <td className="px-4 py-3 text-sm text-navy-700">{format(parseISO(b.endTime), 'MM-dd HH:mm')}</td>
                          <td className="px-4 py-3 text-sm text-navy-700">{getDurationHours(b.startTime, b.endTime)}</td>
                          <td className="px-4 py-3">
                            <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold ${st.cls}`}>
                              {st.label}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold ${ap.cls}`}>
                              {ap.label}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            {canCancel && (
                              <button
                                onClick={() => cancelBooking(b.id)}
                                className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
                              >
                                <XCircle className="w-3.5 h-3.5" />
                                退订
                              </button>
                            )}
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* New Booking Modal */}
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-navy-900/50 backdrop-blur-sm" onClick={() => setShowModal(false)} />
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden">
              {/* Modal Header */}
              <div className="px-6 py-4 bg-navy-900 text-white flex items-center justify-between">
                <h2 className="text-lg font-bold font-display">新建预订</h2>
                <button onClick={() => setShowModal(false)} className="text-white/70 hover:text-white transition-colors">
                  <XCircle className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                {/* Conflict Warning */}
                {conflict && (
                  <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-red-500 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-sm font-semibold text-red-800">时段冲突！该游艇在此时段已有预订</p>
                      <p className="text-xs text-red-600 mt-1">
                        冲突预订：{conflict.customerName}，{format(parseISO(conflict.startTime), 'MM-dd HH:mm')} ~ {format(parseISO(conflict.endTime), 'HH:mm')}
                      </p>
                    </div>
                  </div>
                )}

                {/* Success Message */}
                {submitSuccess && (
                  <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-3 text-sm font-semibold text-green-800">
                    ✓ 预订创建成功！
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-navy-700 mb-1">游艇</label>
                  <select
                    required
                    value={form.yachtId}
                    onChange={(e) => setForm((f) => ({ ...f, yachtId: e.target.value }))}
                    className="w-full px-3 py-2.5 text-sm bg-foam-50 border border-foam-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-ocean-500/30 focus:border-ocean-500 transition-colors"
                  >
                    <option value="">请选择游艇</option>
                    {availableYachts.map((y) => (
                      <option key={y.id} value={y.id}>{y.name} ({y.model})</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-navy-700 mb-1">客户姓名</label>
                    <input
                      type="text"
                      required
                      value={form.customerName}
                      onChange={(e) => setForm((f) => ({ ...f, customerName: e.target.value }))}
                      className="w-full px-3 py-2.5 text-sm bg-foam-50 border border-foam-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-ocean-500/30 focus:border-ocean-500 transition-colors"
                      placeholder="请输入客户姓名"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-navy-700 mb-1">联系电话</label>
                    <input
                      type="text"
                      required
                      value={form.customerPhone}
                      onChange={(e) => setForm((f) => ({ ...f, customerPhone: e.target.value }))}
                      className="w-full px-3 py-2.5 text-sm bg-foam-50 border border-foam-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-ocean-500/30 focus:border-ocean-500 transition-colors"
                      placeholder="请输入联系电话"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-navy-700 mb-1">出海时间</label>
                    <input
                      type="datetime-local"
                      required
                      value={form.startTime}
                      onChange={(e) => setForm((f) => ({ ...f, startTime: e.target.value }))}
                      className="w-full px-3 py-2.5 text-sm bg-foam-50 border border-foam-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-ocean-500/30 focus:border-ocean-500 transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-navy-700 mb-1">返回时间</label>
                    <input
                      type="datetime-local"
                      required
                      value={form.endTime}
                      onChange={(e) => setForm((f) => ({ ...f, endTime: e.target.value }))}
                      className="w-full px-3 py-2.5 text-sm bg-foam-50 border border-foam-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-ocean-500/30 focus:border-ocean-500 transition-colors"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2.5 text-sm font-medium text-navy-700 bg-foam-100 rounded-lg hover:bg-foam-200 transition-colors"
                  >
                    取消
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2.5 text-sm font-semibold text-navy-900 bg-gold-500 rounded-lg hover:bg-gold-400 transition-colors shadow-sm"
                  >
                    提交预订
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
