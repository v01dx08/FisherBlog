import { redirect } from "next/navigation"
import { getCurrentUser } from "@/lib/auth"
import { MessagesCallPageClient } from "@/components/MessagesCallPageClient"

export default async function MessagesCallPage() {
  const currentUser = await getCurrentUser()
  if (!currentUser) redirect("/login")

  return <MessagesCallPageClient currentUser={currentUser} />
}
