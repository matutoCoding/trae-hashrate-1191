import type { Booking } from '@/types'

export function hasOverlap(
  newStart: string,
  newEnd: string,
  existingBookings: Booking[]
): Booking[] {
  const ns = new Date(newStart).getTime()
  const ne = new Date(newEnd).getTime()
  return existingBookings.filter((b) => {
    if (b.status === 'cancelled') return false
    const bs = new Date(b.startTime).getTime()
    const be = new Date(b.endTime).getTime()
    return ns < be && bs < ne
  })
}
