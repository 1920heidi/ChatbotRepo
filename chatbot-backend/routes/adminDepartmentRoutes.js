import { Router } from 'express'
import { create, list } from '../controllers/adminDepartmentController.js'

const router = Router()

router.get('/', list)
router.post('/', create)

export default router
