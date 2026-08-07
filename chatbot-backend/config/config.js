import dotenv from 'dotenv'

dotenv.config()

export const config = {
  port: Number(process.env.PORT) || 3001,
  frontendUrl:
    process.env.FRONTEND_URL || 'http://localhost:5173',
  ollamaUrl:
    process.env.OLLAMA_URL || 'http://localhost:11434',
  model: process.env.MODEL || 'llama3.1:8b',
}