import { WaterConditionsPageClient } from "@/components/WaterConditionsPageClient"

export const metadata = {
  title: "Điều kiện mặt nước & thời tiết | Nhật ký ngày đi câu",
  description: "Tra cứu điều kiện thời tiết, khí áp, gió và giờ đẹp để đi câu tại các địa điểm ở Việt Nam.",
}

export default function WaterConditionsPage() {
  return <WaterConditionsPageClient />
}
