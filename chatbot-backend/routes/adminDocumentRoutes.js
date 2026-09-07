import path from 'node:path'
import { randomUUID } from 'node:crypto'
import { Router } from 'express'
import multer from 'multer'
import { config } from '../config/config.js'
import { requireRole } from '../middleware/authMiddleware.js'
import {
  archive,
  chunks,
  downloadVersion,
  list,
  remove,
  reindex,
  replace,
  restore,
  setChunkConfidential,
  setConfidential,
  setApproved,
  setDepartment,
  upload,
  versions,
} from '../controllers/adminDocumentController.js'

const storage = multer.diskStorage({
  destination: config.uploadsDir,
  // multer's default filenames drop the extension, which the ingestion
  // worker relies on to pick an extractor (.pdf vs .docx vs .txt).
  filename: (request, file, callback) => {
    callback(null, `${randomUUID()}${path.extname(file.originalname)}`)
  },
})

const multerUpload = multer({ storage })

const manageOnly = requireRole('reviewer', 'super_admin')

const router = Router()

// Any authenticated role — visibility/ownership is scoped inside the
// controller (an uploader only sees/uploads their own, a reviewer only
// their department's, super admin sees everything).
router.get('/', list)
router.post('/', multerUpload.single('file'), upload)
router.get('/:id/chunks', chunks)
router.get('/:id/versions', versions)
router.get('/:id/versions/:versionId/download', downloadVersion)

// Reviewer / super admin only.
router.delete('/:id', manageOnly, remove)
router.post('/:id/reindex', manageOnly, reindex)
router.post('/:id/versions', manageOnly, multerUpload.single('file'), replace)
router.post('/:id/archive', manageOnly, archive)
router.post('/:id/restore', manageOnly, restore)
router.patch('/:id/confidential', manageOnly, setConfidential)
router.patch('/:id/approved', manageOnly, setApproved)
router.patch('/:id/chunks/:chunkId/confidential', manageOnly, setChunkConfidential)

// Super admin only.
router.patch('/:id/department', requireRole('super_admin'), setDepartment)

export default router
