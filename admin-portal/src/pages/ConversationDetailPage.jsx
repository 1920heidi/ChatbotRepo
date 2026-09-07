import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { getConversation } from '../api/conversations.js'

export function ConversationDetailPage() {
  const { sessionId } = useParams()
  const [messages, setMessages] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    getConversation(sessionId)
      .then(({ messages: rows }) => setMessages(rows))
      .catch((fetchError) => setError(fetchError.message))
      .finally(() => setIsLoading(false))
  }, [sessionId])

  return (
    <div className="page">
      <Link to="/conversations" className="back-link">
        ← Back to conversations
      </Link>

      <h1>Conversation {sessionId.slice(0, 8)}…</h1>

      {error && <p className="page-error">{error}</p>}

      {isLoading ? (
        <p>Loading…</p>
      ) : (
        <div className="transcript">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`transcript-row transcript-row--${message.sender}`}
            >
              <div className="transcript-bubble">
                <p>{message.text}</p>
                <span className="transcript-time">
                  {new Date(message.created_at).toLocaleString()}
                </span>
              </div>
            </div>
          ))}
          {messages.length === 0 && <p>No messages in this conversation.</p>}
        </div>
      )}
    </div>
  )
}
