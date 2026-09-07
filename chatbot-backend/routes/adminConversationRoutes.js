import { Router } from 'express'
import { detail, list } from '../controllers/adminConversationController.js'
import { requireRole } from '../middleware/authMiddleware.js'

const router = Router()
const reviewerOnly = requireRole('reviewer', 'super_admin')

router.get('/', reviewerOnly, list)
router.get('/:sessionId', reviewerOnly, detail)

export default router
