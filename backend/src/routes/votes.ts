import { Router } from 'express'
import {
  submitAvailability,
  getDateMatchingResult,
  startVoting,
  getBudgetVoting,
  updateBudget,
  getLocationVote,
  submitLocationVote
} from '../controllers/voteController'
import { authenticate } from '../middleware/auth'

const router = Router()

router.use(authenticate)

// Step 1 — Date
router.post('/availability',                    submitAvailability)
router.get('/:tripId/date-matching-result',     getDateMatchingResult)
router.post('/start-voting',                    startVoting)

// Step 2 — Budget
router.get('/:tripId/get-budget',               getBudgetVoting)
router.post('/:tripId/budget',                  updateBudget)

// Step 3 — Location
router.get('/:tripId/get-vote-place',           getLocationVote)
router.post('/:tripId/vote-place',              submitLocationVote)

export default router