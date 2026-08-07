import { config } from '../config/config.js'

const SYSTEM_PROMPT = `
You are the Public Service Commission of Kenya digital assistant.

Rules:
1. Be polite, clear, and concise.
2. Do not invent PSC policies, vacancies, dates, contacts, or procedures.
3. If verified PSC information is unavailable, say so.
4. Do not request passwords, banking details, or unnecessary personal data.
`

export async function generateReply(message, history = []) {
  const safeHistory = history.slice(-10).map((item) => ({
    role: item.role === 'assistant' ? 'assistant' : 'user',
    content: String(item.content || ''),
  }))

  const response = await fetch(`${config.ollamaUrl}/api/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: config.model,
      stream: false,
      messages: [
        {
          role: 'system',
          content: SYSTEM_PROMPT,
        },
        ...safeHistory,
        {
          role: 'user',
          content: message,
        },
      ],
      options: {
        temperature: 0.2,
      },
    }),
  })

  if (!response.ok) {
    const details = await response.text()
    throw new Error(`Ollama error: ${details}`)
  }

  const data = await response.json()
  const reply = data.message?.content?.trim()

  if (!reply) {
    throw new Error('The LLM returned an empty response.')
  }

  return reply
}