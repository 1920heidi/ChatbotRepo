import express from 'express'
import cors from 'cors'
import { config } from './config/config.js'
import chatRoutes from './routes/chatRoutes.js'
import adminAuthRoutes from './routes/adminAuthRoutes.js'
import adminDocumentRoutes from './routes/adminDocumentRoutes.js'
import adminConversationRoutes from './routes/adminConversationRoutes.js'
import adminUserRoutes from './routes/adminUserRoutes.js'
import adminDepartmentRoutes from './routes/adminDepartmentRoutes.js'
import { requireAdmin, requireRole } from './middleware/authMiddleware.js'

const app = express()

const allowedOrigins = [config.frontendUrl, config.adminPortalUrl]

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true)
      }

      return callback(new Error('Not allowed by CORS'))
    },
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
app.use('/api/admin/auth', adminAuthRoutes)
app.use('/api/admin/documents', requireAdmin, adminDocumentRoutes)
app.use('/api/admin/conversations', requireAdmin, adminConversationRoutes)
app.use('/api/admin/users', requireAdmin, requireRole('super_admin'), adminUserRoutes)
app.use('/api/admin/departments', requireAdmin, requireRole('super_admin'), adminDepartmentRoutes)

app.listen(config.port, () => {
  console.log(
    `PSC chatbot backend running on http://localhost:${config.port}`,
  )
})