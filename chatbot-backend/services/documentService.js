import { query } from './db.js'

export async function insertDocument({
  id,
  filename,
  filePath,
  source,
  approved,
  confidential,
  uploadedBy,
  departmentId,
}) {
  await query(
    `INSERT INTO documents
       (id, filename, file_path, source, approved, confidential, uploaded_by, department_id)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
    [id, filename, filePath, source, approved, confidential, uploadedBy, departmentId],
  )
}

export async function listDocuments({ uploadedBy, departmentId, includeArchived = false } = {}) {
  const conditions = []
  const params = []

  if (uploadedBy) {
    params.push(uploadedBy)
    conditions.push(`uploaded_by = $${params.length}`)
  }

  if (departmentId) {
    params.push(departmentId)
    conditions.push(`department_id = $${params.length}`)
  }

  conditions.push(`archived = ${includeArchived ? 'TRUE' : 'FALSE'}`)

  const result = await query(
    `SELECT d.id, d.filename, d.source, d.approved, d.confidential, d.embedding_version,
            d.status, d.chunks_indexed, d.error_message, d.uploaded_at, d.indexed_at,
            d.archived, d.archived_at, d.current_version, d.department_id,
            dep.name AS department_name, u.email AS uploaded_by_email
     FROM documents d
     LEFT JOIN departments dep ON dep.id = d.department_id
     LEFT JOIN admin_users u ON u.id = d.uploaded_by
     WHERE ${conditions.join(' AND ')}
     ORDER BY d.uploaded_at DESC`,
    params,
  )
  return result.rows
}

export async function setConfidential(id, confidential) {
  await query('UPDATE documents SET confidential = $1 WHERE id = $2', [
    confidential,
    id,
  ])
}

export async function setApproved(id, approved) {
  await query('UPDATE documents SET approved = $1 WHERE id = $2', [approved, id])
}

export async function setArchived(id, archived) {
  await query(
    `UPDATE documents
     SET archived = $1, archived_at = CASE WHEN $1 THEN now() ELSE NULL END
     WHERE id = $2`,
    [archived, id],
  )
}

export async function setDepartment(id, departmentId) {
  await query('UPDATE documents SET department_id = $1 WHERE id = $2', [
    departmentId,
    id,
  ])
}

export async function getDocument(id) {
  const result = await query('SELECT * FROM documents WHERE id = $1', [id])
  return result.rows[0] || null
}

export async function deleteDocument(id) {
  await query('DELETE FROM documents WHERE id = $1', [id])
}

export async function markQueued(id) {
  await query(
    `UPDATE documents
     SET status = 'queued', error_message = NULL
     WHERE id = $1`,
    [id],
  )
}

export async function replaceCurrentVersion({
  id,
  filename,
  filePath,
  source,
  approved,
  versionNumber,
}) {
  await query(
    `UPDATE documents
     SET filename = $1, file_path = $2, source = $3, approved = $4,
         current_version = $5, status = 'queued', error_message = NULL,
         chunks_indexed = NULL, indexed_at = NULL
     WHERE id = $6`,
    [filename, filePath, source, approved, versionNumber, id],
  )
}
