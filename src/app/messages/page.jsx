import { redirect } from "next/navigation"
import { MessagesPageClient } from "@/components/MessagesPageClient"
import { getCurrentUser } from "@/lib/auth"

export default async function MessagesPage() {
  const currentUser = await getCurrentUser()
  if (!currentUser) redirect("/login")

  return <MessagesPageClient currentUser={currentUser} />
}
