const ACTIVE_TTL_MS = 75_000
const STALE_AFTER_MS = 24 * 60 * 60 * 1000
const presenceByUser = new Map()

function cleanupPresence() {
  const staleBefore = Date.now() - STALE_AFTER_MS
  for (const [userId, entry] of presenceByUser.entries()) {
    if (entry.lastSeenAt <= staleBefore) presenceByUser.delete(userId)
  }
}

export function touchPresence(user) {
  if (!user?.id) return null
  cleanupPresence()
  const now = Date.now()
  const entry = {
    userId: user.id,
    lastSeenAt: now,
    expiresAt: now + ACTIVE_TTL_MS,
  }
  presenceByUser.set(user.id, entry)
  return getPresence(user.id)
}

export function getPresence(userId) {
  if (!userId) return { isOnline: false, lastSeenAt: null }
  cleanupPresence()
  const entry = presenceByUser.get(userId)
  if (!entry) return { isOnline: false, lastSeenAt: null }
  return {
    isOnline: entry.expiresAt > Date.now(),
    lastSeenAt: new Date(entry.lastSeenAt).toISOString(),
  }
}

export function decorateUserPresence(user) {
  if (!user) return user
  return {
    ...user,
    ...getPresence(user.id),
  }
}
