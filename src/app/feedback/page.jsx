import { FeedbackPageClient } from "@/components/FeedbackPageClient"
import { getCurrentUser } from "@/lib/auth"

export const metadata = {
  title: "Góp ý cải thiện FishViet | Nhật ký ngày đi câu",
  description: "Gửi góp ý, báo lỗi hoặc đề xuất tính năng để FishViet trở nên tốt hơn cho cộng đồng cần thủ.",
}

export default async function FeedbackPage() {
  const currentUser = await getCurrentUser()
  return <FeedbackPageClient currentUser={currentUser} />
}
