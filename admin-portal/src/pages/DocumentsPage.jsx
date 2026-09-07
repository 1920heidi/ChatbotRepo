import { useCallback, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import {
  archiveDocument,
  deleteDocument,
  listDocuments,
  reindexDocument,
  replaceDocument,
  setDocumentApproved,
  setDocumentConfidential,
  uploadDocument,
} from '../api/documents.js'

const ACTIVE_STATUSES = new Set(['queued', 'processing'])

function reviewBadge(document) {
  if (document.status === 'failed') {
    return { text: 'Failed', tone: 'failed' }
  }
  if (document.status === 'queued') {
    return { text: 'Queued', tone: 'queued' }
  }
  if (document.status === 'processing') {
    return { text: 'Processing…', tone: 'processing' }
  }
  return document.approved
    ? { text: 'Approved', tone: 'indexed' }
    : { text: 'Pending review', tone: 'queued' }
}

export function DocumentsPage() {
  const { admin } = useAuth()
  const canManage = admin.role === 'reviewer' || admin.role === 'super_admin'
  const showOwnership = admin.role !== 'uploader'

  const [documents, setDocuments] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [file, setFile] = useState(null)
  const [source, setSource] = useState('')
  const [confidential, setConfidential] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef(null)

  const replaceInputRef = useRef(null)
  const [replacingId, setReplacingId] = useState(null)

  const refresh = useCallback(async () => {
    try {
      const { documents: rows } = await listDocuments()
      setDocuments(rows)
      setError('')
    } catch (fetchError) {
      setError(fetchError.message)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  useEffect(() => {
    const hasActiveDocument = documents.some((document) =>
      ACTIVE_STATUSES.has(document.status),
    )

    if (!hasActiveDocument) {
      return
    }

    const interval = window.setInterval(refresh, 3000)
    return () => window.clearInterval(interval)
  }, [documents, refresh])

  async function handleUpload(event) {
    event.preventDefault()

    if (!file) {
      return
    }

    setIsUploading(true)
    setError('')

    try {
      await uploadDocument(file, source.trim() || undefined, confidential)
      setFile(null)
      setSource('')
      setConfidential(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
      await refresh()
    } catch (uploadError) {
      setError(uploadError.message)
    } finally {
      setIsUploading(false)
    }
  }

  async function handleToggleConfidential(document) {
    try {
      await setDocumentConfidential(document.id, !document.confidential)
      await refresh()
    } catch (toggleError) {
      setError(toggleError.message)
    }
  }

  async function handleToggleApproved(document) {
    try {
      await setDocumentApproved(document.id, !document.approved)
      await refresh()
    } catch (toggleError) {
      setError(toggleError.message)
    }
  }

  async function handleDelete(id) {
    if (!window.confirm('Delete this document and its indexed content? This cannot be undone.')) {
      return
    }

    try {
      await deleteDocument(id)
      await refresh()
    } catch (deleteError) {
      setError(deleteError.message)
    }
  }

  async function handleReindex(id) {
    try {
      await reindexDocument(id)
      await refresh()
    } catch (reindexError) {
      setError(reindexError.message)
    }
  }

  async function handleArchive(id) {
    if (!window.confirm('Archive this document? It will stop appearing in chatbot answers until restored.')) {
      return
    }

    try {
      await archiveDocument(id)
      await refresh()
    } catch (archiveError) {
      setError(archiveError.message)
    }
  }

  function handleReplaceClick(id) {
    setReplacingId(id)
    replaceInputRef.current?.click()
  }

  async function handleReplaceFileChosen(event) {
    const chosenFile = event.target.files?.[0]
    event.target.value = ''

    if (!chosenFile || !replacingId) {
      return
    }

    try {
      await replaceDocument(replacingId, chosenFile)
      await refresh()
    } catch (replaceError) {
      setError(replaceError.message)
    } finally {
      setReplacingId(null)
    }
  }

  return (
    <div className="page">
      <h1>Knowledge base documents</h1>

      <form className="upload-form" onSubmit={handleUpload}>
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.doc,.docx,.txt,.md"
          onChange={(event) => setFile(event.target.files?.[0] || null)}
          required
        />
        <input
          type="text"
          placeholder="Source label (optional)"
          value={source}
          onChange={(event) => setSource(event.target.value)}
        />
        <label className="upload-form-checkbox">
          <input
            type="checkbox"
            checked={confidential}
            onChange={(event) => setConfidential(event.target.checked)}
          />
          Confidential
        </label>
        <button type="submit" disabled={isUploading || !file}>
          {isUploading ? 'Uploading…' : 'Upload'}
        </button>
      </form>

      <input
        ref={replaceInputRef}
        type="file"
        accept=".pdf,.doc,.docx,.txt,.md"
        className="hidden-file-input"
        onChange={handleReplaceFileChosen}
      />

      <p className="page-subtitle">
        {admin.role === 'uploader'
          ? 'Documents you upload are reviewed by your department before the chatbot can use them.'
          : 'Documents are reviewed before the chatbot can use them. Confidential documents stay in the knowledge base for admin management but are excluded from chatbot answers.'}
      </p>

      {error && <p className="page-error">{error}</p>}

      {isLoading ? (
        <p>Loading…</p>
      ) : (
        <div className="table-scroll">
          <table className="data-table">
            <thead>
              <tr>
                <th>Filename</th>
                <th>Source</th>
                <th>Review</th>
                <th>Confidential</th>
                {showOwnership && <th>Department</th>}
                {showOwnership && <th>Uploaded by</th>}
                <th>Chunks</th>
                <th>Uploaded</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {documents.map((document) => {
                const badge = reviewBadge(document)
                return (
                  <tr key={document.id}>
                    <td className="truncate" title={document.filename}>
                      {document.filename}
                    </td>
                    <td className="truncate" title={document.source}>
                      {document.source}
                    </td>
                    <td>
                      <span className={`status-badge status-badge--${badge.tone}`}>
                        {badge.text}
                      </span>
                      {document.status === 'failed' && document.error_message && (
                        <div className="status-error">{document.error_message}</div>
                      )}
                    </td>
                    <td>
                      {document.confidential && (
                        <span className="status-badge status-badge--confidential">
                          Confidential
                        </span>
                      )}
                    </td>
                    {showOwnership && <td>{document.department_name || '—'}</td>}
                    {showOwnership && <td>{document.uploaded_by_email || '—'}</td>}
                    <td>{document.chunks_indexed ?? '—'}</td>
                    <td>{new Date(document.uploaded_at).toLocaleString()}</td>
                    <td className="row-actions">
                      <Link to={`/documents/${document.id}/chunks`}>Sections</Link>
                      <Link to={`/documents/${document.id}/versions`}>
                        v{document.current_version}
                      </Link>
                      {canManage && (
                        <>
                          <button type="button" onClick={() => handleToggleApproved(document)}>
                            {document.approved ? 'Revoke approval' : 'Approve'}
                          </button>
                          <button type="button" onClick={() => handleReplaceClick(document.id)}>
                            Replace
                          </button>
                          <button type="button" onClick={() => handleToggleConfidential(document)}>
                            {document.confidential ? 'Unmark confidential' : 'Mark confidential'}
                          </button>
                          <button type="button" onClick={() => handleReindex(document.id)}>
                            Reindex
                          </button>
                          <button type="button" onClick={() => handleArchive(document.id)}>
                            Archive
                          </button>
                          <button type="button" onClick={() => handleDelete(document.id)}>
                            Delete
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                )
              })}
              {documents.length === 0 && (
                <tr>
                  <td colSpan={showOwnership ? 9 : 7} className="empty-row">
                    {admin.role === 'uploader'
                      ? "You haven't uploaded any documents yet."
                      : 'No documents in the knowledge base yet.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
