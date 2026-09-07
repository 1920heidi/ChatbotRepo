import { Router } from 'express'
import { createAdmin, login } from '../controllers/adminAuthController.js'
import { requireAdmin, requireRole } from '../middleware/authMiddleware.js'

const router = Router()

router.post('/login', login)
router.post('/admins', requireAdmin, requireRole('super_admin'), createAdmin)

export default router
