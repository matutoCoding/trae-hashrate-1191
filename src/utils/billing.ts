import type { RateTier, BillSegment } from '@/types'
import { addDays, startOfDay } from 'date-fns'

function findApplicableTier(
  minutesFromMidnight: number,
  tiers: RateTier[]
): RateTier | null {
  let best: RateTier | null = null
  for (const tier of tiers) {
    const [sh, sm] = tier.startTime.split(':').map(Number)
    const [eh, em] = tier.endTime.split(':').map(Number)
    const startMin = sh * 60 + sm
    const endMin = eh * 60 + em
    if (minutesFromMidnight >= startMin && minutesFromMidnight < endMin) {
      if (!best || tier.sortOrder > best.sortOrder) {
        best = tier
      }
    }
  }
  return best
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
    const nextDayStart = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000)
    const isLastDay = end <= nextDayStart
    const activeStartMin =
      current <= dayStart
        ? 0
        : current.getHours() * 60 + current.getMinutes()
    let activeEndMin: number
    if (isLastDay) {
      const endH = end.getHours()
      const endM = end.getMinutes()
      if (endH === 0 && endM === 0) {
        activeEndMin = 1440
      } else {
        activeEndMin = endH * 60 + endM
      }
    } else {
      activeEndMin = 1440
    }

    if (activeStartMin >= activeEndMin) {
      current = addDays(startOfDay(current), 1)
      continue
    }

    const boundarySet = new Set<number>()
    boundarySet.add(activeStartMin)
    boundarySet.add(activeEndMin)
    for (const tier of sortedTiers) {
      const [sh, sm] = tier.startTime.split(':').map(Number)
      const [eh, em] = tier.endTime.split(':').map(Number)
      boundarySet.add(sh * 60 + sm)
      boundarySet.add(eh * 60 + em)
    }
    const boundaries = [...boundarySet].sort((a, b) => a - b)

    for (let i = 0; i < boundaries.length - 1; i++) {
      const segStartMin = Math.max(boundaries[i], activeStartMin)
      const segEndMin = Math.min(boundaries[i + 1], activeEndMin)
      if (segStartMin >= segEndMin) continue

      const midMin = (segStartMin + segEndMin) / 2
      const tier = findApplicableTier(midMin, sortedTiers)
      if (!tier) continue

      const segStartDate = new Date(dayStart)
      segStartDate.setHours(Math.floor(segStartMin / 60), segStartMin % 60, 0, 0)
      const segEndDate = new Date(dayStart)
      segEndDate.setHours(Math.floor(segEndMin / 60), segEndMin % 60, 0, 0)

      const durationMs = segEndDate.getTime() - segStartDate.getTime()
      const durationHours = durationMs / (1000 * 60 * 60)

      if (durationHours > 0) {
        segments.push({
          id: `${segStartDate.toISOString()}-${tier.id}`,
          billId: '',
          rateTierId: tier.id,
          rateTierName: tier.name,
          rateTierType: tier.type,
          segmentStart: segStartDate.toISOString(),
          segmentEnd: segEndDate.toISOString(),
          durationHours: Math.round(durationHours * 100) / 100,
          rate: tier.pricePerHour,
          subtotal: Math.round(durationHours * tier.pricePerHour * 100) / 100,
        })
      }
    }

    current = addDays(startOfDay(current), 1)
  }

  return segments
}
