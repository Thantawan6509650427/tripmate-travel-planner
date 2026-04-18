import { Response } from 'express'
import { prisma } from '../db/client'
import { sendSuccess, sendError } from '../utils/response'
import { AuthRequest } from '../middleware/auth'

// GET /api/noti/get-noti
export const getNotifications = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id

    const notifications = await prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: {
        trip: { select: { id: true, name: true } }
      }
    })

    const unreadCount = notifications.filter(n => !n.isRead).length

    return sendSuccess(res, {
      notifications,
      unreadCount
    }, 'ดึง notifications สำเร็จ', 'NOTI_FETCHED')

  } catch (err) {
    console.error(err)
    return sendError(res, 'เกิดข้อผิดพลาด', 'SERVER_ERROR', 500)
  }
}

// PATCH /api/noti/:notificationId/read
export const markAsRead = async (req: AuthRequest, res: Response) => {
  try {
    const notificationId = req.params['notificationId'] as string
    const userId = req.user!.id

    const noti = await prisma.notification.findUnique({
      where: { id: notificationId }
    })

    if (!noti) return sendError(res, 'ไม่พบ notification', 'NOT_FOUND', 404)
    if (noti.userId !== userId) return sendError(res, 'ไม่มีสิทธิ์', 'FORBIDDEN', 403)

    const updated = await prisma.notification.update({
      where: { id: notificationId },
      data: { isRead: true }
    })

    return sendSuccess(res, updated, 'อ่านแล้ว', 'NOTI_READ')

  } catch (err) {
    console.error(err)
    return sendError(res, 'เกิดข้อผิดพลาด', 'SERVER_ERROR', 500)
  }
}

// PATCH /api/noti/read-all
export const markAllAsRead = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id

    await prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true }
    })

    return sendSuccess(res, null, 'อ่านทั้งหมดแล้ว', 'NOTI_ALL_READ')

  } catch (err) {
    console.error(err)
    return sendError(res, 'เกิดข้อผิดพลาด', 'SERVER_ERROR', 500)
  }
}

// DELETE /api/noti/notifications/:notificationId
export const deleteNotification = async (req: AuthRequest, res: Response) => {
  try {
    const notificationId = req.params['notificationId'] as string
    const userId = req.user!.id

    const noti = await prisma.notification.findUnique({
      where: { id: notificationId }
    })

    if (!noti) return sendError(res, 'ไม่พบ notification', 'NOT_FOUND', 404)
    if (noti.userId !== userId) return sendError(res, 'ไม่มีสิทธิ์', 'FORBIDDEN', 403)

    await prisma.notification.delete({
      where: { id: notificationId }
    })

    return sendSuccess(res, null, 'ลบสำเร็จ', 'NOTI_DELETED')

  } catch (err) {
    console.error(err)
    return sendError(res, 'เกิดข้อผิดพลาด', 'SERVER_ERROR', 500)
  }
}