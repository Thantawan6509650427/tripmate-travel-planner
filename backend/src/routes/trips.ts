import { Router } from 'express'
import {
  getMyTrips,
  getTripDetail,
  createTrip,
  joinTrip,
  deleteTrip,
  removeMember,
  getPendingRequests,
  approveRequest,
  rejectRequest,
  getMembers,
  manualClose
} from '../controllers/tripController'
import { authenticate } from '../middleware/auth'

const router = Router()

// ทุก route ต้อง login ก่อน
router.use(authenticate)

router.get('/all-my-trips',              getMyTrips)
router.post('/add-trip',                 createTrip)
router.post('/request-join',             joinTrip)
router.get('/:tripId',                   getTripDetail)
router.delete('/:tripId',                deleteTrip)
router.get('/:tripId/get-members',       getMembers)
router.delete('/:tripId/members/:memberId', removeMember)
router.get('/:tripId/pending-requests',  getPendingRequests)
router.patch('/:tripId/approve/:userId', approveRequest)
router.patch('/:tripId/reject/:userId',  rejectRequest)
router.patch('/:tripId/manual-close',    manualClose)

export default router