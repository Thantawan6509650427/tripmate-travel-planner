import { Response } from 'express'
import { prisma } from '../db/client'
import { sendSuccess, sendError } from '../utils/response'
import { AuthRequest } from '../middleware/auth'
import { randomBytes } from 'crypto'

const generateInviteCode = () => randomBytes(4).toString('hex').toUpperCase()

// GET /api/trips/all-my-trips
export const getMyTrips = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id

    const memberships = await prisma.tripMember.findMany({
      where: { userId, status: 'APPROVED' },
      include: {
        trip: {
          include: {
            owner: { select: { id: true, name: true, avatar: true } },
            members: {
              where: { status: 'APPROVED' },
              include: { user: { select: { id: true, name: true, avatar: true } } }
            }
          }
        }
      }
    })

    const trips = memberships.map(m => m.trip)
    return sendSuccess(res, { trips }, 'ดึงข้อมูลทริปสำเร็จ', 'TRIPS_FETCHED')

  } catch (err) {
    return sendError(res, 'เกิดข้อผิดพลาด', 'SERVER_ERROR', 500)
  }
}

// GET /api/trips/:tripId
export const getTripDetail = async (req: AuthRequest, res: Response) => {
  try {
    const tripId = req.params['tripId'] as string
    const userId = req.user!.id

    const member = await prisma.tripMember.findFirst({
      where: { tripId, userId, status: 'APPROVED' }
    })
    if (!member) return sendError(res, 'ไม่มีสิทธิ์เข้าถึง', 'FORBIDDEN', 403)

    const trip = await prisma.trip.findUnique({
      where: { id: tripId },
      include: {
        owner: { select: { id: true, name: true, avatar: true } },
        members: {
          where: { status: 'APPROVED' },
          include: { user: { select: { id: true, name: true, avatar: true } } }
        },
        selectedDates: true
      }
    })

    if (!trip) return sendError(res, 'ไม่พบทริป', 'TRIP_NOT_FOUND', 404)
    return sendSuccess(res, trip, 'ดึงข้อมูลสำเร็จ', 'TRIP_FETCHED')

  } catch (err) {
    return sendError(res, 'เกิดข้อผิดพลาด', 'SERVER_ERROR', 500)
  }
}

// POST /api/trips/add-trip
export const createTrip = async (req: AuthRequest, res: Response) => {
  try {
    const { name, description } = req.body
    const userId = req.user!.id

    if (!name) return sendError(res, 'กรุณาใส่ชื่อทริป', 'MISSING_FIELDS', 400)

    const trip = await prisma.trip.create({
      data: {
        name,
        description,
        inviteCode: generateInviteCode(),
        ownerId: userId,
        members: {
          create: { userId, role: 'OWNER', status: 'APPROVED' }
        }
      }
    })

    return sendSuccess(res, { trip }, 'สร้างทริปสำเร็จ', 'TRIP_CREATED', 201)

  } catch (err) {
    return sendError(res, 'เกิดข้อผิดพลาด', 'SERVER_ERROR', 500)
  }
}

// POST /api/trips/request-join
export const joinTrip = async (req: AuthRequest, res: Response) => {
  try {
    const { invite_code } = req.body
    const userId = req.user!.id

    const trip = await prisma.trip.findUnique({ where: { inviteCode: invite_code } })
    if (!trip) return sendError(res, 'ไม่พบทริป', 'TRIP_NOT_FOUND', 404)
    if (trip.status === 'CLOSED') return sendError(res, 'ทริปนี้ปิดแล้ว', 'TRIP_CLOSED', 400)

    const existing = await prisma.tripMember.findFirst({
      where: { tripId: trip.id, userId }
    })
    if (existing) return sendError(res, 'คุณอยู่ในทริปนี้แล้ว', 'ALREADY_MEMBER', 409)

    const member = await prisma.tripMember.create({
      data: { tripId: trip.id, userId, role: 'MEMBER', status: 'PENDING' }
    })

    return sendSuccess(res, { trip, member }, 'ส่งคำขอเข้าร่วมแล้ว', 'JOIN_REQUESTED', 201)

  } catch (err) {
    return sendError(res, 'เกิดข้อผิดพลาด', 'SERVER_ERROR', 500)
  }
}

// DELETE /api/trips/:tripId
export const deleteTrip = async (req: AuthRequest, res: Response) => {
  try {
    const tripId = req.params['tripId'] as string
    const userId = req.user!.id

    const trip = await prisma.trip.findUnique({ where: { id: tripId } })
    if (!trip) return sendError(res, 'ไม่พบทริป', 'TRIP_NOT_FOUND', 404)
    if (trip.ownerId !== userId) return sendError(res, 'เฉพาะเจ้าของทริปเท่านั้น', 'FORBIDDEN', 403)

    await prisma.trip.delete({ where: { id: tripId } })
    return sendSuccess(res, null, 'ลบทริปสำเร็จ', 'TRIP_DELETED')

  } catch (err) {
    return sendError(res, 'เกิดข้อผิดพลาด', 'SERVER_ERROR', 500)
  }
}

// DELETE /api/trips/:tripId/members/:memberId
export const removeMember = async (req: AuthRequest, res: Response) => {
  try {
    const tripId  = req.params['tripId']   as string
    const memberId = req.params['memberId'] as string
    const userId  = req.user!.id

    const trip = await prisma.trip.findUnique({ where: { id: tripId } })
    if (!trip) return sendError(res, 'ไม่พบทริป', 'TRIP_NOT_FOUND', 404)
    if (trip.ownerId !== userId) return sendError(res, 'เฉพาะเจ้าของทริปเท่านั้น', 'FORBIDDEN', 403)

    await prisma.tripMember.deleteMany({ where: { tripId, userId: memberId } })
    return sendSuccess(res, null, 'นำสมาชิกออกสำเร็จ', 'MEMBER_REMOVED')

  } catch (err) {
    return sendError(res, 'เกิดข้อผิดพลาด', 'SERVER_ERROR', 500)
  }
}

// GET /api/trips/:tripId/get-members
export const getMembers = async (req: AuthRequest, res: Response) => {
  try {
    const tripId = req.params['tripId'] as string

    const members = await prisma.tripMember.findMany({
      where: { tripId, status: 'APPROVED' },
      include: { user: { select: { id: true, name: true, email: true, avatar: true } } }
    })

    return sendSuccess(res, members, 'ดึงสมาชิกสำเร็จ', 'MEMBERS_FETCHED')

  } catch (err) {
    return sendError(res, 'เกิดข้อผิดพลาด', 'SERVER_ERROR', 500)
  }
}

// GET /api/trips/:tripId/pending-requests
export const getPendingRequests = async (req: AuthRequest, res: Response) => {
  try {
    const tripId = req.params['tripId'] as string
    const userId = req.user!.id

    const trip = await prisma.trip.findUnique({ where: { id: tripId } })
    if (!trip) return sendError(res, 'ไม่พบทริป', 'TRIP_NOT_FOUND', 404)
    if (trip.ownerId !== userId) return sendError(res, 'เฉพาะเจ้าของทริปเท่านั้น', 'FORBIDDEN', 403)

    const requests = await prisma.tripMember.findMany({
      where: { tripId, status: 'PENDING' },
      include: { user: { select: { id: true, name: true, email: true, avatar: true } } }
    })

    return sendSuccess(res, requests, 'ดึงคำขอสำเร็จ', 'PENDING_FETCHED')

  } catch (err) {
    return sendError(res, 'เกิดข้อผิดพลาด', 'SERVER_ERROR', 500)
  }
}

// PATCH /api/trips/:tripId/approve/:userId
export const approveRequest = async (req: AuthRequest, res: Response) => {
  try {
    const tripId   = req.params['tripId'] as string
    const targetId = req.params['userId'] as string
    const userId   = req.user!.id

    const trip = await prisma.trip.findUnique({ where: { id: tripId } })
    if (!trip || trip.ownerId !== userId) return sendError(res, 'ไม่มีสิทธิ์', 'FORBIDDEN', 403)

    await prisma.tripMember.updateMany({
      where: { tripId, userId: targetId },
      data: { status: 'APPROVED' }
    })

    return sendSuccess(res, null, 'อนุมัติสำเร็จ', 'REQUEST_APPROVED')

  } catch (err) {
    return sendError(res, 'เกิดข้อผิดพลาด', 'SERVER_ERROR', 500)
  }
}

// PATCH /api/trips/:tripId/reject/:userId
export const rejectRequest = async (req: AuthRequest, res: Response) => {
  try {
    const tripId   = req.params['tripId'] as string
    const targetId = req.params['userId'] as string
    const userId   = req.user!.id

    const trip = await prisma.trip.findUnique({ where: { id: tripId } })
    if (!trip || trip.ownerId !== userId) return sendError(res, 'ไม่มีสิทธิ์', 'FORBIDDEN', 403)

    await prisma.tripMember.updateMany({
      where: { tripId, userId: targetId },
      data: { status: 'REJECTED' }
    })

    return sendSuccess(res, null, 'ปฏิเสธสำเร็จ', 'REQUEST_REJECTED')

  } catch (err) {
    return sendError(res, 'เกิดข้อผิดพลาด', 'SERVER_ERROR', 500)
  }
}

// PATCH /api/trips/:tripId/manual-close
export const manualClose = async (req: AuthRequest, res: Response) => {
  try {
    const tripId = req.params['tripId'] as string
    const userId = req.user!.id

    const trip = await prisma.trip.findUnique({ where: { id: tripId } })
    if (!trip) return sendError(res, 'ไม่พบทริป', 'TRIP_NOT_FOUND', 404)
    if (trip.ownerId !== userId) return sendError(res, 'เฉพาะเจ้าของทริปเท่านั้น', 'FORBIDDEN', 403)

    const updated = await prisma.trip.update({
      where: { id: tripId },
      data: { status: 'CLOSED' }
    })

    return sendSuccess(res, updated, 'ปิดทริปสำเร็จ', 'TRIP_CLOSED')

  } catch (err) {
    return sendError(res, 'เกิดข้อผิดพลาด', 'SERVER_ERROR', 500)
  }
}