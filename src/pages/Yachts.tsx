import { useStore } from '@/store'
import type { Yacht, YachtStatus } from '@/types'
import { Link } from 'react-router-dom'
import { Plus, Ship, Users, Ruler, Trash2, Search } from 'lucide-react'
import { useState } from 'react'

const statusConfig: Record<YachtStatus, { label: string; cls: string }> = {
  available: { label: '可用', cls: 'bg-emerald-100 text-emerald-700' },
  maintenance: { label: '维护中', cls: 'bg-amber-100 text-amber-700' },
  retired: { label: '已退役', cls: 'bg-slate-100 text-slate-500' },
}

const emptyForm = {
  name: '',
  model: '',
  capacity: '',
  length: '',
  status: 'available' as YachtStatus,
  description: '',
  imageUrl: '',
}

export default function Yachts() {
  const yachts = useStore((s) => s.yachts)
  const addYacht = useStore((s) => s.addYacht)
  const deleteYacht = useStore((s) => s.deleteYacht)

  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState(emptyForm)

  const filtered = yachts.filter(
    (y) =>
      y.name.toLowerCase().includes(search.toLowerCase()) ||
      y.model.toLowerCase().includes(search.toLowerCase())
  )

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const imageUrl =
      form.imageUrl ||
      `https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=luxury%20yacht%20${encodeURIComponent(form.name)}%20harbor%20photorealistic&image_size=landscape_16_9`
    addYacht({
      name: form.name,
      model: form.model,
      capacity: Number(form.capacity),
      length: Number(form.length),
      status: form.status,
      description: form.description,
      imageUrl,
    })
    setForm(emptyForm)
    setShowModal(false)
  }

  function handleDelete(id: string) {
    if (confirm('确认删除该游艇？')) {
      deleteYacht(id)
    }
  }

  return (
    <div className="min-h-screen bg-foam-50 p-6">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8">
          <h1 className="font-display text-3xl font-semibold text-navy-900">
            游艇管理
          </h1>
          <p className="mt-1 text-slate-500">Yacht Management</p>
        </div>

        <div className="mb-6 flex items-center gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="搜索游艇名称或型号..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-lg border border-foam-200 bg-white py-2.5 pl-10 pr-4 text-sm focus:border-ocean-500 focus:outline-none focus:ring-1 focus:ring-ocean-500"
            />
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 rounded-lg bg-gold-500 px-5 py-2.5 text-sm font-medium text-navy-900 transition hover:bg-gold-400"
          >
            <Plus className="h-4 w-4" />
            新建游艇
          </button>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((yacht) => {
            const sc = statusConfig[yacht.status]
            return (
              <Link
                key={yacht.id}
                to={`/yachts/${yacht.id}`}
                className="group overflow-hidden rounded-xl border border-foam-200 bg-white shadow-sm transition hover:shadow-md"
              >
                <div className="relative">
                  <img
                    src={yacht.imageUrl}
                    alt={yacht.name}
                    className="h-48 w-full object-cover"
                  />
                  <span
                    className={`absolute right-3 top-3 rounded-full px-2.5 py-0.5 text-xs font-medium ${sc.cls}`}
                  >
                    {sc.label}
                  </span>
                </div>
                <div className="p-4">
                  <h3 className="font-display text-lg font-semibold text-navy-900">
                    {yacht.name}
                  </h3>
                  <p className="mt-0.5 text-sm text-slate-500">{yacht.model}</p>
                  <div className="mt-3 flex items-center gap-4 text-sm text-slate-600">
                    <span className="flex items-center gap-1">
                      <Users className="h-3.5 w-3.5" />
                      {yacht.capacity}人
                    </span>
                    <span className="flex items-center gap-1">
                      <Ruler className="h-3.5 w-3.5" />
                      {yacht.length}m
                    </span>
                  </div>
                </div>
                <div className="border-t border-foam-100 px-4 py-3">
                  <button
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      handleDelete(yacht.id)
                    }}
                    className="flex items-center gap-1 text-xs text-slate-400 transition hover:text-red-500"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    删除
                  </button>
                </div>
              </Link>
            )
          })}
        </div>

        {filtered.length === 0 && (
          <div className="mt-16 flex flex-col items-center text-slate-400">
            <Ship className="h-12 w-12" />
            <p className="mt-3 text-sm">未找到匹配的游艇</p>
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-xl bg-navy-800 p-6 text-white shadow-2xl">
            <h2 className="font-display text-xl font-semibold text-gold-500">
              新建游艇
            </h2>
            <form onSubmit={handleSubmit} className="mt-5 space-y-4">
              <div>
                <label className="mb-1 block text-xs text-foam-200">名称</label>
                <input
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full rounded-lg border border-navy-600 bg-navy-900 px-3 py-2 text-sm text-white placeholder-foam-200 focus:border-gold-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs text-foam-200">型号</label>
                <input
                  required
                  value={form.model}
                  onChange={(e) => setForm({ ...form, model: e.target.value })}
                  className="w-full rounded-lg border border-navy-600 bg-navy-900 px-3 py-2 text-sm text-white placeholder-foam-200 focus:border-gold-500 focus:outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-xs text-foam-200">
                    载客量
                  </label>
                  <input
                    required
                    type="number"
                    min={1}
                    value={form.capacity}
                    onChange={(e) =>
                      setForm({ ...form, capacity: e.target.value })
                    }
                    className="w-full rounded-lg border border-navy-600 bg-navy-900 px-3 py-2 text-sm text-white placeholder-foam-200 focus:border-gold-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-foam-200">
                    长度 (m)
                  </label>
                  <input
                    required
                    type="number"
                    min={1}
                    step={0.1}
                    value={form.length}
                    onChange={(e) =>
                      setForm({ ...form, length: e.target.value })
                    }
                    className="w-full rounded-lg border border-navy-600 bg-navy-900 px-3 py-2 text-sm text-white placeholder-foam-200 focus:border-gold-500 focus:outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="mb-1 block text-xs text-foam-200">状态</label>
                <select
                  value={form.status}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      status: e.target.value as YachtStatus,
                    })
                  }
                  className="w-full rounded-lg border border-navy-600 bg-navy-900 px-3 py-2 text-sm text-white focus:border-gold-500 focus:outline-none"
                >
                  <option value="available">可用</option>
                  <option value="maintenance">维护中</option>
                  <option value="retired">已退役</option>
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs text-foam-200">描述</label>
                <textarea
                  rows={2}
                  value={form.description}
                  onChange={(e) =>
                    setForm({ ...form, description: e.target.value })
                  }
                  className="w-full rounded-lg border border-navy-600 bg-navy-900 px-3 py-2 text-sm text-white placeholder-foam-200 focus:border-gold-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs text-foam-200">
                  图片URL（留空自动生成）
                </label>
                <input
                  value={form.imageUrl}
                  onChange={(e) =>
                    setForm({ ...form, imageUrl: e.target.value })
                  }
                  className="w-full rounded-lg border border-navy-600 bg-navy-900 px-3 py-2 text-sm text-white placeholder-foam-200 focus:border-gold-500 focus:outline-none"
                />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setForm(emptyForm)
                    setShowModal(false)
                  }}
                  className="rounded-lg px-4 py-2 text-sm text-foam-200 transition hover:text-white"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-gold-500 px-5 py-2 text-sm font-medium text-navy-900 transition hover:bg-gold-400"
                >
                  确认添加
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
