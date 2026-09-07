import dotenv from 'dotenv'

dotenv.config()

export const config = {
  port: Number(process.env.PORT) || 3001,
  frontendUrl:
    process.env.FRONTEND_URL || 'http://localhost:5173',
  adminPortalUrl:
    process.env.ADMIN_PORTAL_URL || 'http://localhost:5175',
  ragServiceUrl:
    process.env.RAG_SERVICE_URL || 'http://localhost:8000',
  rabbitmqUrl:
    process.env.RABBITMQ_URL || 'amqp://guest:guest@localhost:5672//',
  uploadsDir: process.env.UPLOADS_DIR || 'uploads',
  // Path to the shared uploads volume as the ingestion-worker container
  // sees it, which differs from this service's own local uploadsDir.
  workerUploadsDir: process.env.WORKER_UPLOADS_DIR || 'uploads',
  databaseUrl:
    process.env.DATABASE_URL ||
    'postgresql://psc:psc_dev_password@localhost:5432/psc_chatbot',
  jwtSecret: process.env.JWT_SECRET || 'dev-only-insecure-secret',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '8h',
}