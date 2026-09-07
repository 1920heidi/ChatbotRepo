import { getSessionMessages, listSessions } from '../services/conversationService.js'

export async function list(request, response) {
  try {
    const sessions = await listSessions()

    return response.json({ sessions })
  } catch (error) {
    console.error('Listing conversations failed:', error)

    return response.status(500).json({ error: 'Could not list conversations.' })
  }
}

export async function detail(request, response) {
  try {
    const messages = await getSessionMessages(request.params.sessionId)

    return response.json({ messages })
  } catch (error) {
    console.error('Loading conversation failed:', error)

    return response.status(500).json({ error: 'Could not load the conversation.' })
  }
}
