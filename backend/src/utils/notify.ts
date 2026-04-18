import { prisma } from '../db/client'
import { NotificationType } from '@prisma/client'

export const createNotification = async (
  userId: string,
  type: NotificationType,
  message: string,
  tripId?: string
) => {
  try {
    return await prisma.notification.create({
      data: { userId, type, message, tripId }
    })
  } catch (err) {
    console.error('❌ createNotification error:', err)
  }
}