import { createHmac } from "node:crypto"

const DEFAULT_STUN_URLS = ["stun:stun.l.google.com:19302", "stun:global.stun.twilio.com:3478"]

function splitList(value) {
  return String(value || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean)
}

function buildTurnServer() {
  const urls = splitList(process.env.TURN_URLS)
  if (!urls.length) return null

  const staticUsername = process.env.TURN_USERNAME
  const staticCredential = process.env.TURN_CREDENTIAL
  if (staticUsername && staticCredential) {
    return { urls, username: staticUsername, credential: staticCredential }
  }

  const secret = process.env.TURN_SHARED_SECRET
  if (!secret) return null

  const ttlSeconds = Number(process.env.TURN_TTL_SECONDS || 3600)
  const expiresAt = Math.floor(Date.now() / 1000) + Math.max(60, ttlSeconds)
  const username = `${expiresAt}:fishviet`
  const credential = createHmac("sha1", secret).update(username).digest("base64")
  return { urls, username, credential }
}

export function getIceServerConfig() {
  const stunUrls = splitList(process.env.STUN_URLS)
  const iceServers = [{ urls: stunUrls.length ? stunUrls : DEFAULT_STUN_URLS }]
  const turnServer = buildTurnServer()
  if (turnServer) iceServers.push(turnServer)
  return {
    iceServers,
    ttlSeconds: Number(process.env.TURN_TTL_SECONDS || 3600),
    hasTurn: Boolean(turnServer),
  }
}
