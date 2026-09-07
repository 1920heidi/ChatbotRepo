import { randomUUID } from 'node:crypto'
import { query } from './db.js'

export async function insertVersion({
  documentId,
  versionNumber,
  filename,
  storedFilename,
  source,
  uploadedBy,
}) {
  await query(
    `INSERT INTO document_versions
       (id, document_id, version_number, filename, stored_filename, source, uploaded_by)
     VALUES ($1, $2, $3, $4, $5, $6, $7)`,
    [
      randomUUID(),
      documentId,
      versionNumber,
      filename,
      storedFilename,
      source,
      uploadedBy,
    ],
  )
}

export async function listVersions(documentId) {
  const result = await query(
    `SELECT v.id, v.version_number, v.filename, v.source, v.chunks_indexed,
            v.uploaded_by, v.uploaded_at, u.email AS uploaded_by_email
     FROM document_versions v
     LEFT JOIN admin_users u ON u.id = v.uploaded_by
     WHERE v.document_id = $1
     ORDER BY v.version_number DESC`,
    [documentId],
  )
  return result.rows
}

export async function getVersion(documentId, versionId) {
  const result = await query(
    `SELECT * FROM document_versions WHERE document_id = $1 AND id = $2`,
    [documentId, versionId],
  )
  return result.rows[0] || null
}
