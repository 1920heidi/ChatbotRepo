const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001'

export async function sendMessage(sessionId, message) {
  const response = await fetch(`${API_BASE_URL}/api/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ message, sessionId }),
  })

  if (!response.ok) {
    const details = await response.text()
    throw new Error(`Chat request failed: ${details}`)
  }

  return response.json()
}
