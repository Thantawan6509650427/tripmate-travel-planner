import { Response } from 'express'
import { prisma } from '../db/client'
import { sendSuccess, sendError } from '../utils/response'
import { AuthRequest } from '../middleware/auth'

// ============================================================================
// STEP 1 — DATE AVAILABILITY
// ============================================================================

// POST /api/votes/availability
export const submitAvailability = async (req: AuthRequest, res: Response) => {
  try {
    const { trip_id, dates } = req.body
    const userId = req.user!.id

    if (!trip_id || !dates || !Array.isArray(dates)) {
      return sendError(res, 'กรุณาส่ง trip_id และ dates', 'MISSING_FIELDS', 400)
    }

    // เช็คว่าเป็นสมาชิกของทริปนี้
    const member = await prisma.tripMember.findFirst({
      where: { tripId: trip_id, userId, status: 'APPROVED' }
    })
    if (!member) return sendError(res, 'ไม่มีสิทธิ์', 'FORBIDDEN', 403)

    // upsert — ถ้าเคยส่งแล้วให้ update
    const availability = await prisma.availability.upsert({
      where: { tripId_userId: { tripId: trip_id, userId } },
      update: { dates },
      create: { tripId: trip_id, userId, dates }
    })

    return sendSuccess(res, availability, 'บันทึกวันที่สำเร็จ', 'AVAILABILITY_SAVED')

  } catch (err) {
    console.error(err)
    return sendError(res, 'เกิดข้อผิดพลาด', 'SERVER_ERROR', 500)
  }
}

// GET /api/votes/:tripId/date-matching-result
export const getDateMatchingResult = async (req: AuthRequest, res: Response) => {
  try {
    const tripId = req.params['tripId'] as string
    const userId = req.user!.id

    // เช็คสิทธิ์
    const member = await prisma.tripMember.findFirst({
      where: { tripId, userId, status: 'APPROVED' }
    })
    if (!member) return sendError(res, 'ไม่มีสิทธิ์', 'FORBIDDEN', 403)

    // ดึง availability ทุกคนในทริป
    const allAvailabilities = await prisma.availability.findMany({
      where: { tripId },
      include: { user: { select: { id: true, name: true, avatar: true } } }
    })

    const totalMembers = await prisma.tripMember.count({
      where: { tripId, status: 'APPROVED' }
    })

    // นับว่าแต่ละวันมีกี่คนว่าง
    const dateCountMap: Record<string, { count: number; users: any[] }> = {}

    for (const avail of allAvailabilities) {
      for (const date of avail.dates) {
        if (!dateCountMap[date]) {
          dateCountMap[date] = { count: 0, users: [] }
        }
        dateCountMap[date].count++
        dateCountMap[date].users.push(avail.user)
      }
    }

    // เรียงจากวันที่มีคนว่างมากสุด
    const sortedDates = Object.entries(dateCountMap)
      .map(([date, { count, users }]) => ({ date, count, users }))
      .sort((a, b) => b.count - a.count)

    // heatmap data — แต่ละวันมีสีตาม % ของคนที่ว่าง
    const heatmap = sortedDates.map(d => ({
      date: d.date,
      count: d.count,
      percentage: Math.round((d.count / totalMembers) * 100),
      users: d.users
    }))

    return sendSuccess(res, {
      heatmap,
      totalMembers,
      submittedCount: allAvailabilities.length,
      bestDates: sortedDates.slice(0, 5) // top 5 วันที่ดีสุด
    }, 'ดึงผลสำเร็จ', 'DATE_MATCHING_FETCHED')

  } catch (err) {
    console.error(err)
    return sendError(res, 'เกิดข้อผิดพลาด', 'SERVER_ERROR', 500)
  }
}

// POST /api/votes/start-voting
export const startVoting = async (req: AuthRequest, res: Response) => {
  try {
    const { trip_id } = req.body
    const userId = req.user!.id

    const trip = await prisma.trip.findUnique({ where: { id: trip_id } })
    if (!trip) return sendError(res, 'ไม่พบทริป', 'TRIP_NOT_FOUND', 404)
    if (trip.ownerId !== userId) return sendError(res, 'เฉพาะเจ้าของทริปเท่านั้น', 'FORBIDDEN', 403)
    if (trip.status !== 'OPEN') return sendError(res, 'ทริปนี้ไม่อยู่ในสถานะ OPEN', 'INVALID_STATUS', 400)

    // เอา top dates มาบันทึกเป็น selected dates
    const allAvailabilities = await prisma.availability.findMany({
      where: { tripId: trip_id }
    })

    const dateCountMap: Record<string, number> = {}
    for (const avail of allAvailabilities) {
      for (const date of avail.dates) {
        dateCountMap[date] = (dateCountMap[date] || 0) + 1
      }
    }

    const topDates = Object.entries(dateCountMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)

    // บันทึก selected dates + เปลี่ยน status เป็น VOTING
    await prisma.$transaction([
      prisma.tripSelectedDate.deleteMany({ where: { tripId: trip_id } }),
      prisma.tripSelectedDate.createMany({
        data: topDates.map(([date, score]) => ({
          tripId: trip_id,
          date,
          score
        }))
      }),
      prisma.trip.update({
        where: { id: trip_id },
        data: { status: 'VOTING' }
      })
    ])

    const updatedTrip = await prisma.trip.findUnique({
      where: { id: trip_id },
      include: { selectedDates: true }
    })

    return sendSuccess(res, updatedTrip, 'เริ่มโหวตสำเร็จ', 'VOTING_STARTED')

  } catch (err) {
    console.error(err)
    return sendError(res, 'เกิดข้อผิดพลาด', 'SERVER_ERROR', 500)
  }
}

// ============================================================================
// STEP 2 — BUDGET
// ============================================================================

// GET /api/votes/:tripId/get-budget
export const getBudgetVoting = async (req: AuthRequest, res: Response) => {
  try {
    const tripId = req.params['tripId'] as string
    const userId = req.user!.id

    const member = await prisma.tripMember.findFirst({
      where: { tripId, userId, status: 'APPROVED' }
    })
    if (!member) return sendError(res, 'ไม่มีสิทธิ์', 'FORBIDDEN', 403)

    // ดึงโหวต budget ทั้งหมดของทริปนี้
    const votes = await prisma.budgetVote.findMany({
      where: { tripId },
      include: { user: { select: { id: true, name: true } } }
    })

    // โหวตของ user คนนี้
    const myVotes = votes.filter(v => v.userId === userId)

    // คำนวณค่าเฉลี่ยแต่ละหมวด
    const categories = ['accommodation', 'food', 'transport', 'activity']
    const summary = categories.map(cat => {
      const catVotes = votes.filter(v => v.category === cat)
      const avg = catVotes.length
        ? Math.round(catVotes.reduce((sum, v) => sum + v.amount, 0) / catVotes.length)
        : 0
      return { category: cat, average: avg, voteCount: catVotes.length }
    })

    const totalMembers = await prisma.tripMember.count({
      where: { tripId, status: 'APPROVED' }
    })

    return sendSuccess(res, {
      myVotes,
      summary,
      totalMembers,
      submittedCount: [...new Set(votes.map(v => v.userId))].length
    }, 'ดึงข้อมูล budget สำเร็จ', 'BUDGET_FETCHED')

  } catch (err) {
    console.error(err)
    return sendError(res, 'เกิดข้อผิดพลาด', 'SERVER_ERROR', 500)
  }
}

// POST /api/votes/:tripId/budget
export const updateBudget = async (req: AuthRequest, res: Response) => {
  try {
    const tripId = req.params['tripId'] as string
    const { category, amount } = req.body
    const userId = req.user!.id

    if (!category || amount === undefined) {
      return sendError(res, 'กรุณาส่ง category และ amount', 'MISSING_FIELDS', 400)
    }

    const validCategories = ['accommodation', 'food', 'transport', 'activity']
    if (!validCategories.includes(category)) {
      return sendError(res, 'category ไม่ถูกต้อง', 'INVALID_CATEGORY', 400)
    }

    const member = await prisma.tripMember.findFirst({
      where: { tripId, userId, status: 'APPROVED' }
    })
    if (!member) return sendError(res, 'ไม่มีสิทธิ์', 'FORBIDDEN', 403)

    const vote = await prisma.budgetVote.upsert({
      where: { tripId_userId_category: { tripId, userId, category } },
      update: { amount },
      create: { tripId, userId, category, amount }
    })

    return sendSuccess(res, vote, 'บันทึก budget สำเร็จ', 'BUDGET_SAVED')

  } catch (err) {
    console.error(err)
    return sendError(res, 'เกิดข้อผิดพลาด', 'SERVER_ERROR', 500)
  }
}

// ============================================================================
// STEP 3 — LOCATION
// ============================================================================

// GET /api/votes/:tripId/get-vote-place
export const getLocationVote = async (req: AuthRequest, res: Response) => {
  try {
    const tripId = req.params['tripId'] as string
    const userId = req.user!.id

    const member = await prisma.tripMember.findFirst({
      where: { tripId, userId, status: 'APPROVED' }
    })
    if (!member) return sendError(res, 'ไม่มีสิทธิ์', 'FORBIDDEN', 403)

    const votes = await prisma.locationVote.findMany({
      where: { tripId },
      include: { user: { select: { id: true, name: true } } }
    })

    const myVotes = votes.filter(v => v.userId === userId)

    // รวมคะแนนแต่ละ place
    const placeScoreMap: Record<string, number> = {}
    for (const vote of votes) {
      placeScoreMap[vote.place] = (placeScoreMap[vote.place] || 0) + vote.score
    }

    const locationVotesTotal = Object.entries(placeScoreMap)
      .map(([place, totalScore]) => ({ place, totalScore }))
      .sort((a, b) => b.totalScore - a.totalScore)

    const totalMembers = await prisma.tripMember.count({
      where: { tripId, status: 'APPROVED' }
    })

    return sendSuccess(res, {
      rows: votes,
      myVotes,
      locationVotesTotal,
      actualVote: [...new Set(votes.map(v => v.userId))].length,
      totalMembers
    }, 'ดึงข้อมูล location สำเร็จ', 'LOCATION_VOTES_FETCHED')

  } catch (err) {
    console.error(err)
    return sendError(res, 'เกิดข้อผิดพลาด', 'SERVER_ERROR', 500)
  }
}

// POST /api/votes/:tripId/vote-place
export const submitLocationVote = async (req: AuthRequest, res: Response) => {
  try {
    const tripId = req.params['tripId'] as string
    const { votes } = req.body  // [{ place: string, score: number }]
    const userId = req.user!.id

    if (!votes || !Array.isArray(votes)) {
      return sendError(res, 'กรุณาส่ง votes array', 'MISSING_FIELDS', 400)
    }

    const member = await prisma.tripMember.findFirst({
      where: { tripId, userId, status: 'APPROVED' }
    })
    if (!member) return sendError(res, 'ไม่มีสิทธิ์', 'FORBIDDEN', 403)

    // upsert ทุก place ที่โหวต
    const upsertOps = votes.map((v: { place: string; score: number }) =>
      prisma.locationVote.upsert({
        where: { tripId_userId_place: { tripId, userId, place: v.place } },
        update: { score: v.score },
        create: { tripId, userId, place: v.place, score: v.score }
      })
    )

    const results = await prisma.$transaction(upsertOps)

    // คำนวณ scores รวม
    const allVotes = await prisma.locationVote.findMany({ where: { tripId } })
    const scores: Record<string, number> = {}
    for (const vote of allVotes) {
      scores[vote.place] = (scores[vote.place] || 0) + vote.score
    }

    return sendSuccess(res, { results, scores }, 'โหวตสถานที่สำเร็จ', 'LOCATION_VOTED')

  } catch (err) {
    console.error(err)
    return sendError(res, 'เกิดข้อผิดพลาด', 'SERVER_ERROR', 500)
  }
}