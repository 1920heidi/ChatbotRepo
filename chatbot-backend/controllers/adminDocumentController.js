import path from 'node:path'
import { randomUUID } from 'node:crypto'
import { config } from '../config/config.js'
import { enqueueIngestion } from '../services/queueClient.js'
import {
  deleteDocumentVectors,
  listDocumentChunks,
  updateChunkConfidentiality,
  updateDocumentApproval,
  updateDocumentConfidentiality,
} from '../services/ragClient.js'
import {
  deleteDocument,
  getDocument,
  insertDocument,
  listDocuments,
  markQueued,
  replaceCurrentVersion,
  setApproved as setApprovedRow,
  setArchived,
  setConfidential as setConfidentialRow,
  setDepartment as setDepartmentRow,
} from '../services/documentService.js'
import {
  getVersion,
  insertVersion,
  listVersions as listVersionsService,
} from '../services/documentVersionService.js'

// A reviewer can only manage/view documents in their own department;
// super admin isn't department-scoped; an uploader can only see their own.
function canViewDocument(admin, document) {
  if (admin.role === 'super_admin') return true
  if (admin.role === 'reviewer') return document.department_id === admin.department_id
  if (admin.role === 'uploader') return document.uploaded_by === admin.sub
  return false
}

// Reachable only by reviewer/super_admin (route-gated) — this adds the
// department scoping on top for reviewers.
function canManageDocument(admin, document) {
  if (admin.role === 'super_admin') return true
  return document.department_id === admin.department_id
}

function forbidden(response) {
  return response.status(403).json({ error: 'You do not have permission to do that.' })
}

export async function upload(request, response) {
  try {
    if (!request.file) {
      return response.status(400).json({
        error: 'A document file is required.',
      })
    }

    const { source = request.file.originalname, confidential = 'false' } = request.body
    const documentId = randomUUID()
    const workerFilePath = path.posix.join(
      config.workerUploadsDir,
      request.file.filename,
    )
    const isConfidential = confidential === 'true' || confidential === true

    // Approval and ownership are derived from the verified session, never
    // from client input: an uploader's documents start unapproved (pending
    // review); a reviewer/super admin's are auto-cleared.
    const isApproved = request.admin.role !== 'uploader'
    const uploadedBy = request.admin.sub
    const departmentId = request.admin.department_id || null

    await insertDocument({
      id: documentId,
      filename: request.file.originalname,
      filePath: workerFilePath,
      source,
      approved: isApproved,
      confidential: isConfidential,
      uploadedBy,
      departmentId,
    })

    await insertVersion({
      documentId,
      versionNumber: 1,
      filename: request.file.originalname,
      storedFilename: request.file.filename,
      source,
      uploadedBy,
    })

    await enqueueIngestion({
      documentId,
      filePath: workerFilePath,
      source,
      approved: isApproved,
      confidential: isConfidential,
    })

    return response.status(202).json({
      documentId,
      status: 'queued',
    })
  } catch (error) {
    console.error('Document upload failed:', error)

    return response.status(500).json({
      error: 'The document could not be queued for ingestion.',
    })
  }
}

export async function list(request, response) {
  try {
    const { role, sub, department_id: departmentId } = request.admin
    const includeArchived = request.query.archived === 'true'

    const filters = { includeArchived }
    if (role === 'uploader') {
      filters.uploadedBy = sub
    } else if (role === 'reviewer') {
      filters.departmentId = departmentId
    }

    const documents = await listDocuments(filters)

    return response.json({ documents })
  } catch (error) {
    console.error('Listing documents failed:', error)

    return response.status(500).json({ error: 'Could not list documents.' })
  }
}

export async function remove(request, response) {
  try {
    const document = await getDocument(request.params.id)

    if (!document) {
      return response.status(404).json({ error: 'Document not found.' })
    }

    if (!canManageDocument(request.admin, document)) {
      return forbidden(response)
    }

    await deleteDocumentVectors(document.id)
    await deleteDocument(document.id)

    return response.status(204).send()
  } catch (error) {
    console.error('Deleting document failed:', error)

    return response.status(500).json({ error: 'Could not delete the document.' })
  }
}

export async function reindex(request, response) {
  try {
    const document = await getDocument(request.params.id)

    if (!document) {
      return response.status(404).json({ error: 'Document not found.' })
    }

    if (!canManageDocument(request.admin, document)) {
      return forbidden(response)
    }

    await markQueued(document.id)

    await enqueueIngestion({
      documentId: document.id,
      filePath: document.file_path,
      source: document.source,
      approved: document.approved,
      confidential: document.confidential,
    })

    return response.status(202).json({ documentId: document.id, status: 'queued' })
  } catch (error) {
    console.error('Reindexing document failed:', error)

    return response.status(500).json({ error: 'Could not reindex the document.' })
  }
}

export async function replace(request, response) {
  try {
    if (!request.file) {
      return response.status(400).json({ error: 'A replacement file is required.' })
    }

    const document = await getDocument(request.params.id)

    if (!document) {
      return response.status(404).json({ error: 'Document not found.' })
    }

    if (!canManageDocument(request.admin, document)) {
      return forbidden(response)
    }

    const { source = request.file.originalname } = request.body
    const isApproved = request.admin.role !== 'uploader'
    const versionNumber = document.current_version + 1
    const workerFilePath = path.posix.join(
      config.workerUploadsDir,
      request.file.filename,
    )

    await insertVersion({
      documentId: document.id,
      versionNumber,
      filename: request.file.originalname,
      storedFilename: request.file.filename,
      source,
      uploadedBy: request.admin.sub,
    })

    await replaceCurrentVersion({
      id: document.id,
      filename: request.file.originalname,
      filePath: workerFilePath,
      source,
      approved: isApproved,
      versionNumber,
    })

    // The ingestion task already deletes a document's existing vectors
    // before upserting new ones, so re-enqueueing for the same document_id
    // cleanly replaces the old content — no explicit delete needed here.
    await enqueueIngestion({
      documentId: document.id,
      filePath: workerFilePath,
      source,
      approved: isApproved,
      confidential: document.confidential,
    })

    return response.status(202).json({
      documentId: document.id,
      status: 'queued',
      version: versionNumber,
    })
  } catch (error) {
    console.error('Replacing document failed:', error)

    return response.status(500).json({ error: 'Could not replace the document.' })
  }
}

export async function versions(request, response) {
  try {
    const document = await getDocument(request.params.id)

    if (!document) {
      return response.status(404).json({ error: 'Document not found.' })
    }

    if (!canViewDocument(request.admin, document)) {
      return forbidden(response)
    }

    const rows = await listVersionsService(document.id)

    return response.json({ versions: rows })
  } catch (error) {
    console.error('Listing document versions failed:', error)

    return response.status(500).json({ error: 'Could not list versions.' })
  }
}

export async function downloadVersion(request, response) {
  try {
    const document = await getDocument(request.params.id)

    if (!document) {
      return response.status(404).json({ error: 'Document not found.' })
    }

    if (!canViewDocument(request.admin, document)) {
      return forbidden(response)
    }

    const version = await getVersion(document.id, request.params.versionId)

    if (!version) {
      return response.status(404).json({ error: 'Version not found.' })
    }

    const filePath = path.join(config.uploadsDir, version.stored_filename)

    return response.download(filePath, version.filename)
  } catch (error) {
    console.error('Downloading document version failed:', error)

    return response.status(500).json({ error: 'Could not download the file.' })
  }
}

export async function archive(request, response) {
  try {
    const document = await getDocument(request.params.id)

    if (!document) {
      return response.status(404).json({ error: 'Document not found.' })
    }

    if (!canManageDocument(request.admin, document)) {
      return forbidden(response)
    }

    await deleteDocumentVectors(document.id)
    await setArchived(document.id, true)

    return response.json({ documentId: document.id, archived: true })
  } catch (error) {
    console.error('Archiving document failed:', error)

    return response.status(500).json({ error: 'Could not archive the document.' })
  }
}

export async function restore(request, response) {
  try {
    const document = await getDocument(request.params.id)

    if (!document) {
      return response.status(404).json({ error: 'Document not found.' })
    }

    if (!canManageDocument(request.admin, document)) {
      return forbidden(response)
    }

    await setArchived(document.id, false)
    await markQueued(document.id)

    await enqueueIngestion({
      documentId: document.id,
      filePath: document.file_path,
      source: document.source,
      approved: document.approved,
      confidential: document.confidential,
    })

    return response.status(202).json({ documentId: document.id, status: 'queued', archived: false })
  } catch (error) {
    console.error('Restoring document failed:', error)

    return response.status(500).json({ error: 'Could not restore the document.' })
  }
}

export async function setConfidential(request, response) {
  try {
    const document = await getDocument(request.params.id)

    if (!document) {
      return response.status(404).json({ error: 'Document not found.' })
    }

    if (!canManageDocument(request.admin, document)) {
      return forbidden(response)
    }

    const { confidential } = request.body

    if (typeof confidential !== 'boolean') {
      return response.status(400).json({ error: 'confidential must be a boolean.' })
    }

    await updateDocumentConfidentiality(document.id, confidential)
    await setConfidentialRow(document.id, confidential)

    return response.json({ documentId: document.id, confidential })
  } catch (error) {
    console.error('Updating document confidentiality failed:', error)

    return response.status(500).json({
      error: 'Could not update the document’s confidentiality.',
    })
  }
}

export async function setApproved(request, response) {
  try {
    const document = await getDocument(request.params.id)

    if (!document) {
      return response.status(404).json({ error: 'Document not found.' })
    }

    if (!canManageDocument(request.admin, document)) {
      return forbidden(response)
    }

    const { approved } = request.body

    if (typeof approved !== 'boolean') {
      return response.status(400).json({ error: 'approved must be a boolean.' })
    }

    await updateDocumentApproval(document.id, approved)
    await setApprovedRow(document.id, approved)

    return response.json({ documentId: document.id, approved })
  } catch (error) {
    console.error('Updating document approval failed:', error)

    return response.status(500).json({
      error: 'Could not update the document’s approval.',
    })
  }
}

export async function setDepartment(request, response) {
  try {
    const document = await getDocument(request.params.id)

    if (!document) {
      return response.status(404).json({ error: 'Document not found.' })
    }

    const { department_id: departmentId } = request.body

    await setDepartmentRow(document.id, departmentId || null)

    return response.json({ documentId: document.id, department_id: departmentId || null })
  } catch (error) {
    console.error('Updating document department failed:', error)

    return response.status(500).json({ error: 'Could not update the department.' })
  }
}

export async function chunks(request, response) {
  try {
    const document = await getDocument(request.params.id)

    if (!document) {
      return response.status(404).json({ error: 'Document not found.' })
    }

    if (!canViewDocument(request.admin, document)) {
      return forbidden(response)
    }

    const { chunks: rows } = await listDocumentChunks(document.id)

    return response.json({ chunks: rows })
  } catch (error) {
    console.error('Listing document chunks failed:', error)

    return response.status(500).json({ error: 'Could not list document chunks.' })
  }
}

export async function setChunkConfidential(request, response) {
  try {
    const document = await getDocument(request.params.id)

    if (!document) {
      return response.status(404).json({ error: 'Document not found.' })
    }

    if (!canManageDocument(request.admin, document)) {
      return forbidden(response)
    }

    const { confidential } = request.body

    if (typeof confidential !== 'boolean') {
      return response.status(400).json({ error: 'confidential must be a boolean.' })
    }

    const result = await updateChunkConfidentiality(
      request.params.id,
      request.params.chunkId,
      confidential,
    )

    return response.json(result)
  } catch (error) {
    console.error('Updating chunk confidentiality failed:', error)

    return response.status(500).json({
      error: 'Could not update the chunk’s confidentiality.',
    })
  }
}
