import { Router } from 'express'
import { list, updateDepartment, updateRole } from '../controllers/adminUserController.js'

const router = Router()

router.get('/', list)
router.patch('/:id/role', updateRole)
router.patch('/:id/department', updateDepartment)

export default router
