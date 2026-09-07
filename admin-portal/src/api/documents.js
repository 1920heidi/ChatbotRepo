import { adminFetch, getToken } from './client.js'

const API_BASE_URL = import.meta.env.VITE_ADMIN_API_URL || 'http://localhost:3001'

export function listDocuments(archived = false) {
  return adminFetch(`/api/admin/documents${archived ? '?archived=true' : ''}`)
}

async function uploadMultipart(url, formData) {
  const token = getToken()

  const response = await fetch(`${API_BASE_URL}${url}`, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: formData,
  })

  if (!response.ok) {
    const details = await response.text()
    throw new Error(details || 'Upload failed.')
  }

  return response.json()
}

export function uploadDocument(file, source, confidential) {
  const formData = new FormData()
  formData.append('file', file)
  if (source) {
    formData.append('source', source)
  }
  formData.append('confidential', confidential ? 'true' : 'false')

  return uploadMultipart('/api/admin/documents', formData)
}

export function replaceDocument(id, file, source) {
  const formData = new FormData()
  formData.append('file', file)
  if (source) {
    formData.append('source', source)
  }

  return uploadMultipart(`/api/admin/documents/${id}/versions`, formData)
}

export function deleteDocument(id) {
  return adminFetch(`/api/admin/documents/${id}`, { method: 'DELETE' })
}

export function reindexDocument(id) {
  return adminFetch(`/api/admin/documents/${id}/reindex`, { method: 'POST' })
}

export function archiveDocument(id) {
  return adminFetch(`/api/admin/documents/${id}/archive`, { method: 'POST' })
}

export function restoreDocument(id) {
  return adminFetch(`/api/admin/documents/${id}/restore`, { method: 'POST' })
}

export function setDocumentConfidential(id, confidential) {
  return adminFetch(`/api/admin/documents/${id}/confidential`, {
    method: 'PATCH',
    body: JSON.stringify({ confidential }),
  })
}

export function setDocumentApproved(id, approved) {
  return adminFetch(`/api/admin/documents/${id}/approved`, {
    method: 'PATCH',
    body: JSON.stringify({ approved }),
  })
}

export function setDocumentDepartment(id, departmentId) {
  return adminFetch(`/api/admin/documents/${id}/department`, {
    method: 'PATCH',
    body: JSON.stringify({ department_id: departmentId }),
  })
}

export function listChunks(id) {
  return adminFetch(`/api/admin/documents/${id}/chunks`)
}

export function setChunkConfidential(id, chunkId, confidential) {
  return adminFetch(
    `/api/admin/documents/${id}/chunks/${encodeURIComponent(chunkId)}/confidential`,
    {
      method: 'PATCH',
      body: JSON.stringify({ confidential }),
    },
  )
}

export function listVersions(id) {
  return adminFetch(`/api/admin/documents/${id}/versions`)
}

export async function downloadVersion(id, versionId, filename) {
  const token = getToken()

  const response = await fetch(
    `${API_BASE_URL}/api/admin/documents/${id}/versions/${versionId}/download`,
    { headers: token ? { Authorization: `Bearer ${token}` } : {} },
  )

  if (!response.ok) {
    throw new Error('Could not download that version.')
  }

  const blob = await response.blob()
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}
