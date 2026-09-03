const { PrismaClient } = require("@prisma/client")
const bcrypt = require("bcryptjs")

const db = new PrismaClient()

async function main() {
  const username = process.env.ADMIN_USERNAME
  const email = process.env.ADMIN_EMAIL
  const password = process.env.ADMIN_PASSWORD
  const jwtSecret = process.env.JWT_SECRET

  if (!username || !email || !password || !jwtSecret) {
    throw new Error("ADMIN_USERNAME, ADMIN_EMAIL, ADMIN_PASSWORD and JWT_SECRET are required")
  }
  if (jwtSecret.length < 32) throw new Error("JWT_SECRET must contain at least 32 characters")
  if (password.length < 10 || !/[a-z]/.test(password) || !/[A-Z]/.test(password) || !/\d/.test(password)) {
    throw new Error("ADMIN_PASSWORD must contain 10+ characters, uppercase, lowercase and number")
  }

  const existing = await db.user.findFirst({ where: { role: "ADMIN" }, select: { id: true } })
  if (existing) return

  await db.user.create({
    data: {
      username,
      usernameNormalized: username.toLowerCase(),
      email: email.toLowerCase(),
      emailNormalized: email.toLowerCase(),
      password: await bcrypt.hash(password, 12),
      role: "ADMIN",
      displayName: "Ban Quản Trị FishViet",
      isProfileCompleted: true,
    },
  })
}

main()
  .finally(() => db.$disconnect())
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
