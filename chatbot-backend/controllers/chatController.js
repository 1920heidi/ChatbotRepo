import { generateReply } from '../services/llmService.js'

export async function chat(request, response) {
  try {
    const { message, history = [] } = request.body

    if (typeof message !== 'string' || !message.trim()) {
      return response.status(400).json({
        error: 'A message is required.',
      })
    }

    const reply = await generateReply(
      message.trim(),
      Array.isArray(history) ? history : [],
    )

    return response.json({ reply })
  } catch (error) {
    console.error('Chat request failed:', error)

    return response.status(500).json({
      error: 'The chatbot could not generate a response.',
    })
  }
}