import express from 'express'
import cors from 'cors'
import { config } from './config/config.js'
import chatRoutes from './routes/chatRoutes.js'

const app = express()

app.use(
  cors({
    origin: config.frontendUrl,
  }),
)

app.use(express.json({ limit: '1mb' }))

app.get('/', (request, response) => {
  response.json({
    system: 'PSC AI Chatbot',
    status: 'Running',
  })
})

app.use('/api/chat', chatRoutes)

app.listen(config.port, () => {
  console.log(
    `PSC chatbot backend running on http://localhost:${config.port}`,
  )
})