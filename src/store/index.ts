import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Yacht, Booking, RateTier, Bill, BillSegment } from '@/types'
import { computeBillSegments } from '@/utils/billing'

function uid(): string {
  return crypto.randomUUID()
}

interface AppState {
  yachts: Yacht[]
  bookings: Booking[]
  rateTiers: RateTier[]
  bills: Bill[]
  billSegments: BillSegment[]

  addYacht: (y: Omit<Yacht, 'id'>) => void
  updateYacht: (id: string, y: Partial<Yacht>) => void
  deleteYacht: (id: string) => void

  addBooking: (b: Omit<Booking, 'id' | 'createdAt' | 'totalAmount' | 'approvalStatus' | 'approvalComment'>) => string | null
  cancelBooking: (id: string) => void
  completeBooking: (id: string) => void

  addRateTier: (r: Omit<RateTier, 'id'>) => void
  updateRateTier: (id: string, r: Partial<RateTier>) => void
  deleteRateTier: (id: string) => void

  approveBooking: (id: string, comment: string) => void
  rejectBooking: (id: string, comment: string) => void

  payBill: (id: string) => void
}

const defaultYachts: Yacht[] = [
  {
    id: 'y1',
    name: '海之梦',
    model: 'Azimut 55',
    capacity: 12,
    status: 'available',
    imageUrl: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=luxury%20white%20yacht%20on%20azure%20ocean%20photorealistic&image_size=landscape_16_9',
    length: 16.8,
    description: '豪华飞桥游艇，适合家庭聚会与商务接待',
  },
  {
    id: 'y2',
    name: '碧波号',
    model: 'Princess V58',
    capacity: 8,
    status: 'available',
    imageUrl: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=sleek%20sport%20yacht%20cruising%20sunset%20sea%20photorealistic&image_size=landscape_16_9',
    length: 17.7,
    description: '运动型游艇，追求速度与激情',
  },
  {
    id: 'y3',
    name: '云帆',
    model: 'Sunseeker 68',
    capacity: 16,
    status: 'available',
    imageUrl: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=elegant%20mega%20yacht%20harbor%20dawn%20photorealistic&image_size=landscape_16_9',
    length: 20.7,
    description: '旗舰级游艇，尽享尊贵航海体验',
  },
]

const defaultRateTiers: RateTier[] = [
  { id: 'r1', name: '早低谷', type: 'offpeak', startTime: '06:00', endTime: '09:00', pricePerHour: 1200, sortOrder: 1 },
  { id: 'r2', name: '上午平峰', type: 'standard', startTime: '09:00', endTime: '12:00', pricePerHour: 2000, sortOrder: 2 },
  { id: 'r3', name: '午间高峰', type: 'peak', startTime: '12:00', endTime: '15:00', pricePerHour: 3500, sortOrder: 3 },
  { id: 'r4', name: '下午平峰', type: 'standard', startTime: '15:00', endTime: '18:00', pricePerHour: 2000, sortOrder: 4 },
  { id: 'r5', name: '晚低谷', type: 'offpeak', startTime: '18:00', endTime: '22:00', pricePerHour: 1200, sortOrder: 5 },
]

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      yachts: defaultYachts,
      bookings: [],
      rateTiers: defaultRateTiers,
      bills: [],
      billSegments: [],

      addYacht: (y) =>
        set((s) => ({ yachts: [...s.yachts, { ...y, id: uid() }] })),

      updateYacht: (id, y) =>
        set((s) => ({
          yachts: s.yachts.map((item) => (item.id === id ? { ...item, ...y } : item)),
        })),

      deleteYacht: (id) =>
        set((s) => ({ yachts: s.yachts.filter((y) => y.id !== id) })),

      addBooking: (b) => {
        const state = get()
        const existing = state.bookings.filter(
          (eb) => eb.yachtId === b.yachtId && eb.status !== 'cancelled'
        )
        const ns = new Date(b.startTime).getTime()
        const ne = new Date(b.endTime).getTime()
        const conflict = existing.find((eb) => {
          const bs = new Date(eb.startTime).getTime()
          const be = new Date(eb.endTime).getTime()
          return ns < be && bs < ne
        })
        if (conflict) return null

        const id = uid()
        set((s) => ({
          bookings: [
            ...s.bookings,
            {
              ...b,
              id,
              totalAmount: 0,
              approvalStatus: 'pending',
              approvalComment: '',
              createdAt: new Date().toISOString(),
            },
          ],
        }))
        return id
      },

      cancelBooking: (id) =>
        set((s) => ({
          bookings: s.bookings.map((b) =>
            b.id === id ? { ...b, status: 'cancelled' } : b
          ),
        })),

      completeBooking: (id) =>
        set((s) => ({
          bookings: s.bookings.map((b) =>
            b.id === id ? { ...b, status: 'completed' } : b
          ),
        })),

      addRateTier: (r) =>
        set((s) => ({ rateTiers: [...s.rateTiers, { ...r, id: uid() }] })),

      updateRateTier: (id, r) =>
        set((s) => ({
          rateTiers: s.rateTiers.map((item) =>
            item.id === id ? { ...item, ...r } : item
          ),
        })),

      deleteRateTier: (id) =>
        set((s) => ({ rateTiers: s.rateTiers.filter((r) => r.id !== id) })),

      approveBooking: (id, comment) => {
        const state = get()
        const booking = state.bookings.find((b) => b.id === id)
        if (!booking) return

        const segments = computeBillSegments(
          booking.startTime,
          booking.endTime,
          state.rateTiers
        )
        const totalAmount = segments.reduce((sum, seg) => sum + seg.subtotal, 0)
        const billId = uid()

        const bill: Bill = {
          id: billId,
          bookingId: id,
          totalAmount: Math.round(totalAmount * 100) / 100,
          generatedAt: new Date().toISOString(),
          status: 'unpaid',
        }

        const billSegs: BillSegment[] = segments.map((seg) => ({
          ...seg,
          id: uid(),
          billId,
        }))

        set((s) => ({
          bookings: s.bookings.map((b) =>
            b.id === id
              ? {
                  ...b,
                  status: 'confirmed',
                  approvalStatus: 'approved',
                  approvalComment: comment,
                  totalAmount: bill.totalAmount,
                }
              : b
          ),
          bills: [...s.bills, bill],
          billSegments: [...s.billSegments, ...billSegs],
        }))
      },

      rejectBooking: (id, comment) =>
        set((s) => ({
          bookings: s.bookings.map((b) =>
            b.id === id
              ? { ...b, approvalStatus: 'rejected', approvalComment: comment }
              : b
          ),
        })),

      payBill: (id) =>
        set((s) => ({
          bills: s.bills.map((b) => (b.id === id ? { ...b, status: 'paid' } : b)),
        })),
    }),
    {
      name: 'yacht-charter-storage',
    }
  )
)
