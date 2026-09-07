import { useCallback, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { downloadVersion, listVersions } from '../api/documents.js'

export function DocumentVersionsPage() {
  const { id } = useParams()
  const [versions, setVersions] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  const refresh = useCallback(async () => {
    try {
      const { versions: rows } = await listVersions(id)
      setVersions(rows)
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

  async function handleDownload(version) {
    try {
      await downloadVersion(id, version.id, version.filename)
    } catch (downloadError) {
      setError(downloadError.message)
    }
  }

  return (
    <div className="page">
      <Link to="/documents" className="back-link">
        ← Back to documents
      </Link>

      <h1>Version history</h1>
      <p className="page-subtitle">
        Every past version of this document stays downloadable, even after it&apos;s
        been replaced.
      </p>

      {error && <p className="page-error">{error}</p>}

      {isLoading ? (
        <p>Loading…</p>
      ) : (
        <div className="table-scroll">
          <table className="data-table">
            <thead>
              <tr>
                <th>Version</th>
                <th>Filename</th>
                <th>Source</th>
                <th>Uploaded by</th>
                <th>Date</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {versions.map((version, index) => (
                <tr key={version.id}>
                  <td>
                    v{version.version_number}
                    {index === 0 && <span className="version-current"> · current</span>}
                  </td>
                  <td className="truncate" title={version.filename}>
                    {version.filename}
                  </td>
                  <td className="truncate" title={version.source}>
                    {version.source}
                  </td>
                  <td>{version.uploaded_by_email || '—'}</td>
                  <td>{new Date(version.uploaded_at).toLocaleString()}</td>
                  <td className="row-actions">
                    <button type="button" onClick={() => handleDownload(version)}>
                      Download
                    </button>
                  </td>
                </tr>
              ))}
              {versions.length === 0 && (
                <tr>
                  <td colSpan={6} className="empty-row">
                    No versions found.
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
