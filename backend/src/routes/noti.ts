import { Router } from 'express'
import {
  getNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification
} from '../controllers/notiController'
import { authenticate } from '../middleware/auth'

const router = Router()

router.use(authenticate)

router.get('/get-noti',                    getNotifications)
router.patch('/:notificationId/read',      markAsRead)
router.patch('/read-all',                  markAllAsRead)
router.delete('/notifications/:notificationId', deleteNotification)

export default router