import { SignJWT, jwtVerify } from "jose"

export const COOKIE_NAME = "fisher_session"
const ISSUER = "fishviet"
const AUDIENCE = "fishviet-web"
function getSecretKey() {
  const value = process.env.JWT_SECRET
  if (process.env.NODE_ENV === "production" && (!value || value.length < 32)) {
    throw new Error("JWT_SECRET must contain at least 32 characters in production")
  }
  return new TextEncoder().encode(value || "development-only-secret-change-before-deploy")
}

export async function signToken(user) {
  return new SignJWT({
    username: user.username,
    role: user.role,
    version: user.sessionVersion,
  })
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setSubject(user.id)
    .setIssuer(ISSUER)
    .setAudience(AUDIENCE)
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(getSecretKey())
}

export async function verifyToken(token) {
  try {
    const { payload } = await jwtVerify(token, getSecretKey(), {
      algorithms: ["HS256"],
      issuer: ISSUER,
      audience: AUDIENCE,
    })
    return payload
  } catch {
    return null
  }
}
