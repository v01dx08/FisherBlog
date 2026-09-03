import {
  Buildings,
  ClockCounterClockwise,
  Database,
  FileLock,
  Fingerprint,
  Fish,
  Gavel,
  LockKey,
  ShieldCheck,
  UserFocus,
  WarningCircle,
} from "@phosphor-icons/react/dist/ssr"
import Link from "next/link"
import { Header } from "@/components/Header"

export const metadata = {
  title: "Điều khoản, Quyền riêng tư & Bản quyền | FishViet",
  description: "Điều khoản sử dụng, chính sách dữ liệu cá nhân và quy trình tiếp nhận khiếu nại bản quyền của FishViet.vn.",
}

export const dynamic = "force-dynamic"

const effectiveDate = "03/09/2026"

const sections = [
  {
    title: "Vai trò của FishViet",
    icon: Fingerprint,
    paragraphs: [
      "FishViet là nền tảng công nghệ cho phép influencer và nhà sáng tạo tải nội dung gốc lên trước khi công bố tại nền tảng khác. Hệ thống ghi nhận tài khoản đăng tải, thời điểm máy chủ tiếp nhận, dấu vân tay SHA-256 và dữ liệu liên quan để hỗ trợ chứng minh lịch sử tồn tại của nội dung.",
      "Bản ghi FishViet là một nguồn chứng cứ kỹ thuật. Bản ghi không tự tạo ra quyền tác giả, không thay thế Giấy chứng nhận đăng ký quyền tác giả, công chứng, giám định, chữ ký số hoặc dịch vụ chứng thực thời gian được cấp phép. Giá trị chứng minh cuối cùng do nền tảng tiếp nhận khiếu nại, cơ quan có thẩm quyền hoặc tòa án đánh giá.",
    ],
  },
  {
    title: "Quyền sở hữu và giấy phép sử dụng",
    icon: ShieldCheck,
    paragraphs: [
      "Người dùng giữ quyền sở hữu đối với nội dung hợp pháp do mình tạo. Khi tải nội dung lên, người dùng cấp cho FishViet giấy phép không độc quyền, có thể thu hồi theo phạm vi pháp luật cho phép, để lưu trữ, sao lưu, tạo bản xem trước, hiển thị theo chế độ riêng tư đã chọn và xử lý nội dung nhằm vận hành dịch vụ.",
      "Người dùng cam kết có đủ quyền đối với hình ảnh, video, âm thanh, nhãn hiệu, khuôn mặt và dữ liệu xuất hiện trong nội dung. Không được tải nội dung sao chép, nội dung xâm phạm đời tư, bí mật kinh doanh hoặc quyền của bên thứ ba.",
      "FishViet không sử dụng nội dung riêng tư để quảng cáo, huấn luyện mô hình AI hoặc bán cho bên thứ ba nếu chưa có đồng ý riêng, rõ ràng của chủ thể quyền.",
    ],
  },
  {
    title: "Bản ghi chứng cứ nội dung",
    icon: ClockCounterClockwise,
    paragraphs: [
      "Mỗi lần xuất bản có thể tạo dấu SHA-256 gắn với nội dung, tệp, tác giả, thời điểm và giá trị ngẫu nhiên chống trùng. Dấu này giúp phát hiện thay đổi và đối chiếu bản ghi đã lưu tại FishViet.",
      "FishViet chỉ xác nhận hệ thống đã tiếp nhận phiên bản nội dung tại thời điểm ghi nhận. FishViet không mặc nhiên xác nhận người tải lên là tác giả đầu tiên, nội dung hoàn toàn nguyên gốc hoặc không có tranh chấp trước đó.",
      "Người dùng nên giữ tệp gốc, metadata thiết bị, project nguồn, hợp đồng sản xuất, email trao đổi và cân nhắc đăng ký quyền tác giả khi nội dung có giá trị thương mại cao.",
    ],
  },
  {
    title: "Dữ liệu FishViet thu thập",
    icon: Database,
    paragraphs: [
      "Dữ liệu tài khoản gồm tên đăng nhập, email, tên hiển thị, mật khẩu đã băm, vai trò, trạng thái và liên kết kênh mạng xã hội. FishViet không lưu mật khẩu dạng rõ.",
      "Dữ liệu nội dung gồm bài viết, hình ảnh, video, bình luận, tin nhắn, chế độ hiển thị, loài cá, cân nặng, điểm câu, dấu SHA-256 và thời điểm ghi nhận.",
      "Dữ liệu kỹ thuật có thể gồm địa chỉ IP, thông tin phiên đăng nhập, nhật ký bảo mật, thiết bị/trình duyệt, lỗi hệ thống và lịch sử thao tác quản trị. Dữ liệu vị trí chỉ được xử lý khi người dùng chủ động cung cấp.",
    ],
  },
  {
    title: "Mục đích và phạm vi xử lý",
    icon: UserFocus,
    paragraphs: [
      "FishViet xử lý dữ liệu để xác thực tài khoản, vận hành bảng tin, lưu bản gốc, tạo chứng cứ kỹ thuật, hỗ trợ khiếu nại bản quyền, phòng chống gian lận, bảo mật hệ thống, thực hiện nghĩa vụ pháp lý và cải thiện tính ổn định của dịch vụ.",
      "Dữ liệu chỉ được truy cập bởi nhân sự hoặc nhà cung cấp cần thiết cho mục đích nêu trên, theo nguyên tắc phân quyền tối thiểu. FishViet không bán dữ liệu cá nhân.",
      "Nếu cần xử lý cho mục đích mới không tương thích, FishViet sẽ thông báo và xin đồng ý khi pháp luật yêu cầu.",
    ],
  },
  {
    title: "Chia sẻ, lưu trữ và chuyển dữ liệu",
    icon: FileLock,
    paragraphs: [
      "FishViet có thể sử dụng nhà cung cấp hạ tầng, lưu trữ, sao lưu, email, bảo mật và phân tích lỗi. Các bên này chỉ được xử lý dữ liệu theo chỉ dẫn và nghĩa vụ bảo mật phù hợp.",
      "Dữ liệu có thể được cung cấp khi có yêu cầu hợp pháp của cơ quan có thẩm quyền, để bảo vệ quyền và an toàn của người dùng, hoặc để xử lý khiếu nại xâm phạm quyền sở hữu trí tuệ.",
      "Nếu dữ liệu được chuyển ra ngoài Việt Nam, đơn vị vận hành phải thực hiện hồ sơ, đánh giá tác động và biện pháp bảo vệ theo quy định hiện hành trước khi chuyển.",
    ],
  },
  {
    title: "Thời hạn lưu giữ và xóa dữ liệu",
    icon: LockKey,
    paragraphs: [
      "Dữ liệu được giữ trong thời gian tài khoản hoạt động và thêm khoảng thời gian cần thiết cho sao lưu, an toàn hệ thống, giải quyết tranh chấp hoặc nghĩa vụ pháp lý. Thời hạn cụ thể phụ thuộc loại dữ liệu và mục đích xử lý.",
      "Khi bài viết hoặc tài khoản bị xóa, bản công khai sẽ bị gỡ theo quy trình kỹ thuật. FishViet có thể giữ tối thiểu nhật ký kiểm toán, dấu băm và thông tin cần thiết để điều tra lạm dụng hoặc bảo vệ yêu cầu pháp lý; phần lưu giữ này không được dùng để tái xuất bản nội dung.",
      "Người dùng có thể yêu cầu truy cập, sửa, rút lại đồng ý, hạn chế xử lý hoặc xóa dữ liệu. Một số yêu cầu có thể bị giới hạn khi FishViet phải lưu dữ liệu theo luật hoặc để bảo vệ quyền hợp pháp trong tranh chấp.",
    ],
  },
  {
    title: "Bảo mật và sự cố dữ liệu",
    icon: ShieldCheck,
    paragraphs: [
      "FishViet áp dụng kiểm soát truy cập, băm mật khẩu, cookie phiên an toàn, giới hạn đăng nhập, kiểm tra tệp tải lên, nhật ký quản trị, sao lưu và mã hóa đường truyền HTTPS khi triển khai chính thức.",
      "Không hệ thống nào an toàn tuyệt đối. Khi xảy ra sự cố có nguy cơ ảnh hưởng quyền của chủ thể dữ liệu, FishViet sẽ cô lập sự cố, đánh giá phạm vi, lưu bằng chứng và thực hiện thông báo theo thời hạn luật định.",
      "Người dùng phải bảo vệ mật khẩu, không chia sẻ tài khoản và báo ngay khi nghi ngờ truy cập trái phép.",
    ],
  },
  {
    title: "Khiếu nại bản quyền và phản hồi",
    icon: Gavel,
    paragraphs: [
      "Thông báo vi phạm cần nêu thông tin người gửi, tác phẩm được bảo hộ, URL/nội dung bị khiếu nại, căn cứ quyền sở hữu, tài liệu đối chiếu và cam kết thông tin trung thực. FishViet có thể yêu cầu bổ sung dữ liệu trước khi xử lý.",
      "FishViet có thể tạm ẩn nội dung trong thời gian xác minh, chuyển thông báo cho người đăng và tiếp nhận phản hồi. Tài khoản tái phạm hoặc cố ý gửi khiếu nại sai có thể bị hạn chế hay đình chỉ.",
      "Gửi yêu cầu bản quyền tới legal@fishviet.vn. Yêu cầu về dữ liệu cá nhân gửi tới privacy@fishviet.vn. Người gửi không nên cung cấp giấy tờ định danh vượt quá phạm vi cần thiết.",
    ],
  },
]

export default function LegalPage() {
  const operatorName = process.env.NEXT_PUBLIC_LEGAL_ENTITY_NAME || "Đơn vị vận hành FishViet"
  const operatorAddress = process.env.NEXT_PUBLIC_LEGAL_ENTITY_ADDRESS
  const operatorTaxId = process.env.NEXT_PUBLIC_LEGAL_ENTITY_TAX_ID

  return (
    <div className="min-h-[100dvh] bg-background pb-20 pt-16">
      <Header />

      <main id="main-content" className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 sm:py-12">
        <section className="water-panel overflow-hidden rounded-3xl p-6 sm:p-10">
          <div className="flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
            <div className="max-w-3xl">
              <span className="inline-flex items-center gap-2 rounded-full bg-primary/12 px-3 py-1.5 text-xs font-bold text-primary">
                <Fish size={16} weight="duotone" /> FishViet.vn
              </span>
              <h1 className="mt-5 text-3xl font-extrabold tracking-[-0.045em] sm:text-5xl">Điều khoản, quyền riêng tư và bảo vệ nội dung</h1>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-muted-foreground sm:text-base">
                Quy định cách FishViet tiếp nhận bản gốc, tạo dấu chứng cứ kỹ thuật và bảo vệ dữ liệu của nhà sáng tạo trước khi nội dung được phát hành rộng rãi.
              </p>
            </div>
            <div className="shrink-0 text-sm text-muted-foreground">
              <p className="font-bold text-foreground">Hiệu lực</p>
              <p>{effectiveDate}</p>
            </div>
          </div>
        </section>

        <section className="mt-5 flex gap-3 rounded-2xl border border-amber-400/25 bg-amber-400/8 p-4 text-sm leading-6 text-foreground/85">
          <WarningCircle size={22} weight="duotone" className="mt-0.5 shrink-0 text-amber-500" />
          <p><strong>Thông tin quan trọng:</strong> FishViet cung cấp bản ghi chứng cứ kỹ thuật, không phải cơ quan đăng ký quyền tác giả, văn phòng công chứng, tổ chức giám định hoặc nhà cung cấp dịch vụ chứng thực thời gian được cấp phép.</p>
        </section>

        <div className="mt-8 grid gap-4">
          {sections.map((section) => (
            <section key={section.title} className="social-card p-5 sm:p-7">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/12 text-primary">
                  <section.icon size={21} weight="duotone" />
                </span>
                <h2 className="text-lg font-bold tracking-[-0.02em]">{section.title}</h2>
              </div>
              <div className="mt-5 space-y-4 pl-0 sm:pl-[52px]">
                {section.paragraphs.map((paragraph) => <p key={paragraph} className="text-sm leading-7 text-muted-foreground">{paragraph}</p>)}
              </div>
            </section>
          ))}
        </div>

        <section className="social-card mt-4 p-5 sm:p-7">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/12 text-primary"><Buildings size={21} weight="duotone" /></span>
            <h2 className="text-lg font-bold">Đơn vị vận hành và liên hệ</h2>
          </div>
          <dl className="mt-5 grid gap-4 text-sm sm:grid-cols-2 sm:pl-[52px]">
            <div><dt className="text-muted-foreground">Đơn vị vận hành</dt><dd className="mt-1 font-semibold">{operatorName}</dd></div>
            {operatorTaxId && <div><dt className="text-muted-foreground">Mã số doanh nghiệp/thuế</dt><dd className="mt-1 font-semibold">{operatorTaxId}</dd></div>}
            {operatorAddress && <div className="sm:col-span-2"><dt className="text-muted-foreground">Địa chỉ</dt><dd className="mt-1 font-semibold">{operatorAddress}</dd></div>}
            <div><dt className="text-muted-foreground">Bản quyền</dt><dd className="mt-1 font-semibold">legal@fishviet.vn</dd></div>
            <div><dt className="text-muted-foreground">Dữ liệu cá nhân</dt><dd className="mt-1 font-semibold">privacy@fishviet.vn</dd></div>
          </dl>
        </section>

        <p className="mx-auto mt-8 max-w-3xl text-center text-xs leading-6 text-muted-foreground">
          Chính sách tham chiếu pháp luật Việt Nam về sở hữu trí tuệ, giao dịch điện tử, an toàn thông tin, cung cấp dịch vụ trên mạng và bảo vệ dữ liệu cá nhân. Nội dung này không thay thế tư vấn pháp lý cho trường hợp cụ thể.
        </p>
        <div className="mt-5 text-center"><Link href="/" className="text-sm font-bold text-primary hover:underline">Quay lại bảng tin FishViet</Link></div>
      </main>
    </div>
  )
}
