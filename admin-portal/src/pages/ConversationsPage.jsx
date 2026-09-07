import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { listConversations } from '../api/conversations.js'

export function ConversationsPage() {
  const [sessions, setSessions] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    listConversations()
      .then(({ sessions: rows }) => setSessions(rows))
      .catch((fetchError) => setError(fetchError.message))
      .finally(() => setIsLoading(false))
  }, [])

  return (
    <div className="page">
      <h1>Conversations</h1>
      <p className="page-subtitle">
        In-widget chat sessions only — WhatsApp handoff messages aren&apos;t visible
        to PSC&apos;s backend and can&apos;t be logged here.
      </p>

      {error && <p className="page-error">{error}</p>}

      {isLoading ? (
        <p>Loading…</p>
      ) : (
        <div className="table-scroll">
          <table className="data-table">
            <thead>
              <tr>
                <th>Session</th>
                <th>Last message</th>
                <th>Last activity</th>
              </tr>
            </thead>
            <tbody>
              {sessions.map((session) => (
                <tr key={session.id}>
                  <td>
                    <Link to={`/conversations/${session.id}`}>
                      {session.id.slice(0, 8)}…
                    </Link>
                  </td>
                  <td className="truncate">{session.last_message || '—'}</td>
                  <td>{new Date(session.last_seen_at).toLocaleString()}</td>
                </tr>
              ))}
              {sessions.length === 0 && (
                <tr>
                  <td colSpan={3} className="empty-row">
                    No conversations logged yet.
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
