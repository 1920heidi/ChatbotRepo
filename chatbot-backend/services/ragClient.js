import { config } from '../config/config.js'

export async function askRag(question) {
  const response = await fetch(`${config.ragServiceUrl}/api/query`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ question }),
  })

  if (!response.ok) {
    const details = await response.text()
    throw new Error(`rag-service error: ${details}`)
  }

  return response.json()
}

export async function deleteDocumentVectors(documentId) {
  const response = await fetch(
    `${config.ragServiceUrl}/api/documents/${documentId}`,
    { method: 'DELETE' },
  )

  if (!response.ok) {
    const details = await response.text()
    throw new Error(`rag-service error: ${details}`)
  }

  return response.json()
}

export async function updateDocumentConfidentiality(documentId, confidential) {
  const response = await fetch(
    `${config.ragServiceUrl}/api/documents/${documentId}/confidential`,
    {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ confidential }),
    },
  )

  if (!response.ok) {
    const details = await response.text()
    throw new Error(`rag-service error: ${details}`)
  }

  return response.json()
}

export async function updateDocumentApproval(documentId, approved) {
  const response = await fetch(
    `${config.ragServiceUrl}/api/documents/${documentId}/approved`,
    {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ approved }),
    },
  )

  if (!response.ok) {
    const details = await response.text()
    throw new Error(`rag-service error: ${details}`)
  }

  return response.json()
}

export async function listDocumentChunks(documentId) {
  const response = await fetch(
    `${config.ragServiceUrl}/api/documents/${documentId}/chunks`,
  )

  if (!response.ok) {
    const details = await response.text()
    throw new Error(`rag-service error: ${details}`)
  }

  return response.json()
}

export async function updateChunkConfidentiality(documentId, chunkId, confidential) {
  const response = await fetch(
    `${config.ragServiceUrl}/api/documents/${documentId}/chunks/${chunkId}/confidential`,
    {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ confidential }),
    },
  )

  if (!response.ok) {
    const details = await response.text()
    throw new Error(`rag-service error: ${details}`)
  }

  return response.json()
}
