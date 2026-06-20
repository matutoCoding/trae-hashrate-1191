import type { RateTier, BillSegment } from '@/types'
import { addDays, startOfDay, endOfDay } from 'date-fns'

interface TimePoint {
  time: Date
  tierId: string
  tierName: string
  tierType: RateTier['type']
  rate: number
}

export function computeBillSegments(
  bookingStart: string,
  bookingEnd: string,
  rateTiers: RateTier[]
): BillSegment[] {
  const segments: BillSegment[] = []
  const start = new Date(bookingStart)
  const end = new Date(bookingEnd)
  const sortedTiers = [...rateTiers].sort((a, b) => a.sortOrder - b.sortOrder)

  if (sortedTiers.length === 0) return segments

  let current = new Date(start)

  while (current < end) {
    const dayStart = startOfDay(current)
    const dayEnd = endOfDay(current)
    const segEnd = end < dayEnd ? end : dayEnd

    const points: TimePoint[] = sortedTiers.map((tier) => {
      const [h, m] = tier.startTime.split(':').map(Number)
      const pt = new Date(dayStart)
      pt.setHours(h, m, 0, 0)
      return {
        time: pt,
        tierId: tier.id,
        tierName: tier.name,
        tierType: tier.type,
        rate: tier.pricePerHour,
      }
    })

    const activeStart = current > dayStart ? current : dayStart
    const activeEnd = segEnd

    let segCur = new Date(activeStart)

    while (segCur < activeEnd) {
      let bestTier: TimePoint | null = null
      for (const pt of points) {
        if (pt.time <= segCur) {
          bestTier = pt
        } else {
          break
        }
      }

      if (!bestTier) {
        bestTier = points[points.length - 1]
      }

      let nextBoundary = activeEnd
      for (const pt of points) {
        if (pt.time > segCur && pt.time < nextBoundary) {
          nextBoundary = pt.time
        }
      }

      const segStart = new Date(segCur)
      const segStop = nextBoundary < activeEnd ? nextBoundary : activeEnd
      const durationMs = segStop.getTime() - segStart.getTime()
      const durationHours = durationMs / (1000 * 60 * 60)

      if (durationHours > 0) {
        segments.push({
          id: `${segStart.toISOString()}-${bestTier.tierId}`,
          billId: '',
          rateTierId: bestTier.tierId,
          rateTierName: bestTier.tierName,
          rateTierType: bestTier.tierType,
          segmentStart: segStart.toISOString(),
          segmentEnd: segStop.toISOString(),
          durationHours: Math.round(durationHours * 100) / 100,
          rate: bestTier.rate,
          subtotal: Math.round(durationHours * bestTier.rate * 100) / 100,
        })
      }

      segCur = new Date(segStop)
    }

    current = addDays(startOfDay(current), 1)
  }

  return segments
}
