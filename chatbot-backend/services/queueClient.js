import amqp from 'amqplib'
import { randomUUID } from 'node:crypto'
import { config } from '../config/config.js'

const QUEUE_NAME = 'ingestion'
const TASK_NAME = 'app.tasks.ingest_document'

let channelPromise = null

async function getChannel() {
  if (!channelPromise) {
    channelPromise = (async () => {
      const connection = await amqp.connect(config.rabbitmqUrl)
      const channel = await connection.createChannel()
      await channel.assertQueue(QUEUE_NAME, { durable: true })
      return channel
    })()
  }
  return channelPromise
}

// Publishes a task using Celery's cross-language calling protocol (v2),
// so the Python celery worker picks it up without a Python producer.
// https://docs.celeryq.dev/en/stable/internals/protocol.html
export async function enqueueIngestion({
  documentId,
  filePath,
  source,
  approved,
  confidential,
}) {
  const channel = await getChannel()
  const taskId = randomUUID()

  const args = [documentId, filePath, source, approved, confidential]
  const kwargs = {}
  const embed = { callbacks: null, errbacks: null, chain: null, chord: null }
  const body = Buffer.from(JSON.stringify([args, kwargs, embed]))

  channel.sendToQueue(QUEUE_NAME, body, {
    contentType: 'application/json',
    contentEncoding: 'utf-8',
    correlationId: taskId,
    headers: {
      lang: 'js',
      task: TASK_NAME,
      id: taskId,
      root_id: taskId,
      parent_id: null,
      group: null,
      meth: null,
      shadow: null,
      eta: null,
      expires: null,
      retries: 0,
      timelimit: [null, null],
      argsrepr: JSON.stringify(args),
      kwargsrepr: JSON.stringify(kwargs),
      origin: 'chatbot-backend',
    },
  })

  return taskId
}
