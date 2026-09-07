import { askRag } from '../services/ragClient.js'
import { logTurn } from '../services/conversationService.js'

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export async function chat(request, response) {
  try {
    const { message, sessionId } = request.body

    if (typeof message !== 'string' || !message.trim()) {
      return response.status(400).json({
        error: 'A message is required.',
      })
    }

    const trimmedMessage = message.trim()
    const { answer, sources } = await askRag(trimmedMessage)

    if (typeof sessionId === 'string' && UUID_PATTERN.test(sessionId)) {
      // Logging must never break the citizen-facing reply.
      logTurn({
        sessionId,
        userMessage: trimmedMessage,
        botReply: answer,
        sources,
      }).catch((error) => {
        console.error('Logging conversation turn failed:', error)
      })
    }

    return response.json({ reply: answer, sources })
  } catch (error) {
    console.error('Chat request failed:', error)

    return response.status(500).json({
      error: 'The chatbot could not generate a response.',
    })
  }
}