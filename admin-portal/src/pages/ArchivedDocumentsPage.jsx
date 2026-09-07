import { useCallback, useEffect, useState } from 'react'
import { deleteDocument, listDocuments, restoreDocument } from '../api/documents.js'

export function ArchivedDocumentsPage() {
  const [documents, setDocuments] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  const refresh = useCallback(async () => {
    try {
      const { documents: rows } = await listDocuments(true)
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

  async function handleRestore(id) {
    try {
      await restoreDocument(id)
      await refresh()
    } catch (restoreError) {
      setError(restoreError.message)
    }
  }

  async function handleDelete(id) {
    if (!window.confirm('Permanently delete this archived document? This cannot be undone.')) {
      return
    }

    try {
      await deleteDocument(id)
      await refresh()
    } catch (deleteError) {
      setError(deleteError.message)
    }
  }

  return (
    <div className="page">
      <h1>Archived documents</h1>
      <p className="page-subtitle">
        Archived documents are hidden from the chatbot but kept here in case you need
        to bring them back.
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
                <th>Department</th>
                <th>Archived</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {documents.map((document) => (
                <tr key={document.id}>
                  <td className="truncate" title={document.filename}>
                    {document.filename}
                  </td>
                  <td className="truncate" title={document.source}>
                    {document.source}
                  </td>
                  <td>{document.department_name || '—'}</td>
                  <td>
                    {document.archived_at
                      ? new Date(document.archived_at).toLocaleString()
                      : '—'}
                  </td>
                  <td className="row-actions">
                    <button type="button" onClick={() => handleRestore(document.id)}>
                      Restore
                    </button>
                    <button type="button" onClick={() => handleDelete(document.id)}>
                      Delete permanently
                    </button>
                  </td>
                </tr>
              ))}
              {documents.length === 0 && (
                <tr>
                  <td colSpan={5} className="empty-row">
                    No archived documents.
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
