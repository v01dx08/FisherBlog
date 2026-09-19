const TYPING_TTL_MS = 4_500
const typingByConversation = new Map()

function cleanupTyping(conversationId) {
  const users = typingByConversation.get(conversationId)
  if (!users) return
  const now = Date.now()
  for (const [userId, entry] of users.entries()) {
    if (entry.expiresAt <= now) users.delete(userId)
  }
  if (users.size === 0) typingByConversation.delete(conversationId)
}

export function setTyping(conversationId, user) {
  cleanupTyping(conversationId)
  const users = typingByConversation.get(conversationId) || new Map()
  users.set(user.id, {
    userId: user.id,
    username: user.username,
    displayName: user.displayName,
    avatarUrl: user.avatarUrl,
    expiresAt: Date.now() + TYPING_TTL_MS,
  })
  typingByConversation.set(conversationId, users)
}

export function getTypingUsers(conversationId, viewerId) {
  cleanupTyping(conversationId)
  const users = typingByConversation.get(conversationId)
  if (!users) return []
  return Array.from(users.values())
    .filter((entry) => entry.userId !== viewerId)
    .map(({ expiresAt, ...entry }) => entry)
}
