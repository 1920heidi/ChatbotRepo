import { useCallback, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { listChunks, setChunkConfidential } from '../api/documents.js'

export function DocumentChunksPage() {
  const { id } = useParams()
  const { admin } = useAuth()
  const canManage = admin.role === 'reviewer' || admin.role === 'super_admin'
  const [chunks, setChunks] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  const refresh = useCallback(async () => {
    try {
      const { chunks: rows } = await listChunks(id)
      setChunks(rows)
      setError('')
    } catch (fetchError) {
      setError(fetchError.message)
    } finally {
      setIsLoading(false)
    }
  }, [id])

  useEffect(() => {
    refresh()
  }, [refresh])

  async function handleToggle(chunk) {
    try {
      await setChunkConfidential(id, chunk.chunk_id, !chunk.confidential)
      await refresh()
    } catch (toggleError) {
      setError(toggleError.message)
    }
  }

  return (
    <div className="page">
      <Link to="/documents" className="back-link">
        ← Back to documents
      </Link>

      <h1>Document sections</h1>
      <p className="page-subtitle">
        Mark individual sections as usable by the chatbot, even within an
        otherwise confidential document. Reindexing resets every section back
        to the document&apos;s overall confidential setting.
      </p>

      {error && <p className="page-error">{error}</p>}

      {isLoading ? (
        <p>Loading…</p>
      ) : (
        <div className="chunk-list">
          {chunks.map((chunk, index) => (
            <div key={chunk.chunk_id} className="chunk-card">
              <div className="chunk-card-header">
                <span className="chunk-card-index">Section {index + 1}</span>
                <span
                  className={`status-badge ${
                    chunk.confidential
                      ? 'status-badge--confidential'
                      : 'status-badge--indexed'
                  }`}
                >
                  {chunk.confidential ? 'Confidential' : 'Usable by chatbot'}
                </span>
                {canManage && (
                  <button type="button" onClick={() => handleToggle(chunk)}>
                    {chunk.confidential ? 'Allow chatbot to use this' : 'Mark confidential'}
                  </button>
                )}
              </div>
              <p className="chunk-card-text">{chunk.text}</p>
            </div>
          ))}
          {chunks.length === 0 && <p>No sections found for this document.</p>}
        </div>
      )}
    </div>
  )
}
