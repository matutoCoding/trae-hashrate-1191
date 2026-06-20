export type YachtStatus = 'available' | 'maintenance' | 'retired'
export type BookingStatus = 'pending' | 'confirmed' | 'cancelled' | 'completed'
export type ApprovalStatus = 'pending' | 'approved' | 'rejected'
export type RateType = 'peak' | 'standard' | 'offpeak'
export type BillStatus = 'unpaid' | 'paid' | 'cancelled' | 'refund_pending'
export type PaymentType = 'deposit' | 'balance' | 'full'

export interface Yacht {
  id: string
  name: string
  model: string
  capacity: number
  status: YachtStatus
  imageUrl: string
  length: number
  description: string
}

export interface Booking {
  id: string
  yachtId: string
  customerName: string
  customerPhone: string
  startTime: string
  endTime: string
  status: BookingStatus
  totalAmount: number
  approvalStatus: ApprovalStatus
  approvalComment: string
  createdAt: string
}

export interface RateTier {
  id: string
  name: string
  type: RateType
  startTime: string
  endTime: string
  pricePerHour: number
  sortOrder: number
}

export interface Bill {
  id: string
  bookingId: string
  totalAmount: number
  depositAmount: number
  paidAmount: number
  generatedAt: string
  status: BillStatus
}

export interface PaymentRecord {
  id: string
  billId: string
  amount: number
  type: PaymentType
  paidAt: string
  note: string
}

export interface BillSegment {
  id: string
  billId: string
  rateTierId: string
  rateTierName: string
  rateTierType: RateType
  segmentStart: string
  segmentEnd: string
  durationHours: number
  rate: number
  subtotal: number
}
