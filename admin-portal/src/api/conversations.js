import { adminFetch } from './client.js'

export function listConversations() {
  return adminFetch('/api/admin/conversations')
}

export function getConversation(sessionId) {
  return adminFetch(`/api/admin/conversations/${sessionId}`)
}
