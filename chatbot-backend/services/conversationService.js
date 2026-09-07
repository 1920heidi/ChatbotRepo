import { query } from './db.js'

export async function logTurn({ sessionId, userMessage, botReply, sources }) {
  await query(
    `INSERT INTO conversation_sessions (id)
     VALUES ($1)
     ON CONFLICT (id) DO UPDATE SET last_seen_at = now()`,
    [sessionId],
  )

  await query(
    `INSERT INTO conversation_messages (session_id, sender, text)
     VALUES ($1, 'user', $2)`,
    [sessionId, userMessage],
  )

  await query(
    `INSERT INTO conversation_messages (session_id, sender, text, sources)
     VALUES ($1, 'bot', $2, $3)`,
    [sessionId, botReply, JSON.stringify(sources || [])],
  )
}

export async function listSessions() {
  const result = await query(
    `SELECT s.id, s.created_at, s.last_seen_at,
            (SELECT text FROM conversation_messages m
             WHERE m.session_id = s.id
             ORDER BY m.created_at DESC LIMIT 1) AS last_message
     FROM conversation_sessions s
     ORDER BY s.last_seen_at DESC`,
  )
  return result.rows
}

export async function getSessionMessages(sessionId) {
  const result = await query(
    `SELECT id, sender, text, sources, created_at
     FROM conversation_messages
     WHERE session_id = $1
     ORDER BY created_at ASC`,
    [sessionId],
  )
  return result.rows
}
