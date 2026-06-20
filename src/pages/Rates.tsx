import { useStore } from '@/store'
import type { RateTier, RateType } from '@/types'
import { Plus, Edit2, Trash2, Clock, TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { useState } from 'react'

const TYPE_CONFIG: Record<RateType, { label: string; bg: string; text: string; bar: string; icon: React.ReactNode }> = {
  peak: {
    label: '高峰',
    bg: 'bg-amber-100',
    text: 'text-amber-700',
    bar: '#F59E0B',
    icon: <TrendingUp size={14} />,
  },
  standard: {
    label: '平峰',
    bg: 'bg-sky-100',
    text: 'text-sky-700',
    bar: '#0EA5E9',
    icon: <Minus size={14} />,
  },
  offpeak: {
    label: '低谷',
    bg: 'bg-teal-100',
    text: 'text-teal-700',
    bar: '#14B8A6',
    icon: <TrendingDown size={14} />,
  },
}

const TIMELINE_START = 6
const TIMELINE_END = 22
const TIMELINE_HOURS = TIMELINE_END - TIMELINE_START

function timeToPosition(time: string): number {
  const [h, m] = time.split(':').map(Number)
  return ((h + m / 60) - TIMELINE_START) / TIMELINE_HOURS * 100
}

interface ModalData {
  name: string
  type: RateType
  startTime: string
  endTime: string
  pricePerHour: number
  sortOrder: number
}

const emptyModal: ModalData = {
  name: '',
  type: 'standard',
  startTime: '06:00',
  endTime: '22:00',
  pricePerHour: 0,
  sortOrder: 0,
}

export default function Rates() {
  const rateTiers = useStore((s) => s.rateTiers)
  const addRateTier = useStore((s) => s.addRateTier)
  const updateRateTier = useStore((s) => s.updateRateTier)
  const deleteRateTier = useStore((s) => s.deleteRateTier)

  const [modalOpen, setModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<ModalData>(emptyModal)

  const sorted = [...rateTiers].sort((a, b) => a.sortOrder - b.sortOrder)

  function openAdd() {
    setEditingId(null)
    setForm({ ...emptyModal, sortOrder: rateTiers.length + 1 })
    setModalOpen(true)
  }

  function openEdit(tier: RateTier) {
    setEditingId(tier.id)
    setForm({
      name: tier.name,
      type: tier.type,
      startTime: tier.startTime,
      endTime: tier.endTime,
      pricePerHour: tier.pricePerHour,
      sortOrder: tier.sortOrder,
    })
    setModalOpen(true)
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (editingId) {
      updateRateTier(editingId, form)
    } else {
      addRateTier(form)
    }
    setModalOpen(false)
  }

  function handleDelete(id: string, name: string) {
    if (window.confirm(`确认删除费率档位「${name}」？`)) {
      deleteRateTier(id)
    }
  }

  function setField<K extends keyof ModalData>(key: K, value: ModalData[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  return (
    <div className="min-h-screen bg-foam-50 font-body">
      <div className="mx-auto max-w-5xl px-4 py-8">
        <div className="mb-8">
          <h1 className="font-display text-3xl font-bold text-navy-900">费率管理</h1>
          <p className="mt-1 text-sm text-navy-500/70">Rate Management</p>
        </div>

        {/* 24h Timeline */}
        <div className="mb-10 rounded-2xl border border-foam-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-navy-900">
            <Clock size={18} className="text-gold-500" />
            24h 时段概览
          </h2>
          <div className="relative">
            <div className="flex h-10 overflow-hidden rounded-lg">
              {sorted.map((tier) => {
                const start = timeToPosition(tier.startTime)
                const end = timeToPosition(tier.endTime)
                const width = Math.max(end - start, 0)
                const cfg = TYPE_CONFIG[tier.type]
                return (
                  <div
                    key={tier.id}
                    style={{ width: `${width}%`, backgroundColor: cfg.bar }}
                    className="relative flex items-center justify-center text-xs font-medium text-white"
                    title={`${tier.name} ${tier.startTime}-${tier.endTime}`}
                  >
                    {width > 8 && tier.name}
                  </div>
                )
              })}
            </div>
            <div className="mt-1 flex justify-between text-xs text-navy-500/60">
              <span>06:00</span>
              <span>09:00</span>
              <span>12:00</span>
              <span>15:00</span>
              <span>18:00</span>
              <span>22:00</span>
            </div>
            <div className="mt-4 flex flex-wrap gap-4">
              {sorted.map((tier) => {
                const cfg = TYPE_CONFIG[tier.type]
                return (
                  <div key={tier.id} className="flex items-center gap-2 text-sm">
                    <span
                      className="inline-block h-3 w-3 rounded-sm"
                      style={{ backgroundColor: cfg.bar }}
                    />
                    <span className="text-navy-900">{tier.name}</span>
                    <span className="text-navy-500/60">¥{tier.pricePerHour}/h</span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Rate Tier Table */}
        <div className="rounded-2xl border border-foam-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-foam-100 px-6 py-4">
            <h2 className="text-lg font-semibold text-navy-900">费率档位</h2>
            <button
              onClick={openAdd}
              className="flex items-center gap-1.5 rounded-lg bg-gold-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-gold-400"
            >
              <Plus size={16} />
              添加费率档位
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-foam-100 text-left text-xs uppercase tracking-wider text-navy-500/60">
                  <th className="px-6 py-3">档位名称</th>
                  <th className="px-6 py-3">类型</th>
                  <th className="px-6 py-3">时段范围</th>
                  <th className="px-6 py-3">每小时单价</th>
                  <th className="px-6 py-3">操作</th>
                </tr>
              </thead>
              <tbody>
                {sorted.map((tier) => {
                  const cfg = TYPE_CONFIG[tier.type]
                  return (
                    <tr
                      key={tier.id}
                      className="border-b border-foam-50 transition hover:bg-foam-50/50"
                    >
                      <td className="px-6 py-4 font-medium text-navy-900">{tier.name}</td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${cfg.bg} ${cfg.text}`}
                        >
                          {cfg.icon}
                          {cfg.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-navy-500/80">
                        {tier.startTime} - {tier.endTime}
                      </td>
                      <td className="px-6 py-4 font-medium text-navy-900">
                        ¥{tier.pricePerHour.toLocaleString()}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => openEdit(tier)}
                            className="rounded-md p-1.5 text-navy-500/60 transition hover:bg-foam-100 hover:text-navy-900"
                          >
                            <Edit2 size={15} />
                          </button>
                          <button
                            onClick={() => handleDelete(tier.id, tier.name)}
                            className="rounded-md p-1.5 text-navy-500/60 transition hover:bg-red-50 hover:text-red-600"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
                {sorted.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-navy-500/50">
                      暂无费率档位，点击上方按钮添加
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="mx-4 w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <h3 className="mb-5 text-lg font-semibold text-navy-900">
              {editingId ? '编辑费率档位' : '添加费率档位'}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-navy-900">档位名称</label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) => setField('name', e.target.value)}
                  className="w-full rounded-lg border border-foam-200 bg-foam-50 px-3 py-2 text-sm text-navy-900 outline-none transition focus:border-gold-500 focus:ring-1 focus:ring-gold-500"
                  placeholder="例如：早低谷"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-navy-900">类型</label>
                <select
                  value={form.type}
                  onChange={(e) => setField('type', e.target.value as RateType)}
                  className="w-full rounded-lg border border-foam-200 bg-foam-50 px-3 py-2 text-sm text-navy-900 outline-none transition focus:border-gold-500 focus:ring-1 focus:ring-gold-500"
                >
                  <option value="peak">高峰</option>
                  <option value="standard">平峰</option>
                  <option value="offpeak">低谷</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-sm font-medium text-navy-900">开始时间</label>
                  <input
                    type="text"
                    required
                    value={form.startTime}
                    onChange={(e) => setField('startTime', e.target.value)}
                    className="w-full rounded-lg border border-foam-200 bg-foam-50 px-3 py-2 text-sm text-navy-900 outline-none transition focus:border-gold-500 focus:ring-1 focus:ring-gold-500"
                    placeholder="HH:mm"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-navy-900">结束时间</label>
                  <input
                    type="text"
                    required
                    value={form.endTime}
                    onChange={(e) => setField('endTime', e.target.value)}
                    className="w-full rounded-lg border border-foam-200 bg-foam-50 px-3 py-2 text-sm text-navy-900 outline-none transition focus:border-gold-500 focus:ring-1 focus:ring-gold-500"
                    placeholder="HH:mm"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-sm font-medium text-navy-900">每小时单价 (¥)</label>
                  <input
                    type="number"
                    required
                    min={0}
                    value={form.pricePerHour}
                    onChange={(e) => setField('pricePerHour', Number(e.target.value))}
                    className="w-full rounded-lg border border-foam-200 bg-foam-50 px-3 py-2 text-sm text-navy-900 outline-none transition focus:border-gold-500 focus:ring-1 focus:ring-gold-500"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-navy-900">排序</label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={form.sortOrder}
                    onChange={(e) => setField('sortOrder', Number(e.target.value))}
                    className="w-full rounded-lg border border-foam-200 bg-foam-50 px-3 py-2 text-sm text-navy-900 outline-none transition focus:border-gold-500 focus:ring-1 focus:ring-gold-500"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="rounded-lg border border-foam-200 px-4 py-2 text-sm font-medium text-navy-500 transition hover:bg-foam-50"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-gold-500 px-5 py-2 text-sm font-medium text-white transition hover:bg-gold-400"
                >
                  {editingId ? '保存' : '添加'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
