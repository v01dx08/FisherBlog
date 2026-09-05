import "./globals.css";
import { ThemeProvider } from "@/components/ThemeProvider";

export const metadata = {
  applicationName: "Nhật ký ngày đi câu",
  title: {
    default: "Nhật ký ngày đi câu",
    template: "%s | Nhật ký ngày đi câu",
  },
  description: "Đăng bản gốc, ghi dấu thời gian SHA-256 và đối chiếu chuỗi phát hành nội dung của influencer câu cá Việt Nam.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "https://fishviet.vn"),
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "vi_VN",
    siteName: "Nhật ký ngày đi câu",
    title: "Nhật ký ngày đi câu",
    description: "Ghi nhận bản gốc, dấu thời gian và chuỗi phát hành nội dung câu cá.",
    url: "/",
  },
  twitter: {
    card: "summary_large_image",
    title: "Nhật ký ngày đi câu",
    description: "Ghi nhận bản gốc, dấu thời gian và chuỗi phát hành nội dung câu cá.",
  },
  robots: { index: true, follow: true },
  category: "social network",
  icons: {
    icon: [
      { url: "/fishviet-logo-192.png", type: "image/png", sizes: "192x192" },
      { url: "/fishviet-logo-512.png", type: "image/png", sizes: "512x512" },
    ],
    apple: "/fishviet-logo-192.png",
  },
};

export const viewport = {
  colorScheme: "light dark",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#edf4fb" },
    { media: "(prefers-color-scheme: dark)", color: "#061221" },
  ],
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="vi"
      suppressHydrationWarning
      className="h-full antialiased"
    >
      <body className="min-h-full flex flex-col" suppressHydrationWarning>
        <a href="#main-content" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[70] focus:rounded-full focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground">
          Bỏ qua đến nội dung chính
        </a>
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
