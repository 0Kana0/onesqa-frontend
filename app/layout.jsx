// app/layout.jsx (ห้ามมี "use client")
import Providers from "./providers";

export const metadata = {
  title: {
    default: "ระบบสารสนเทศเพื่อการประเมินคุณภาพภายนอก (AQA)",
    //template: "%s | ชื่อเว็บไซต์ของคุณ",
  },
  //description: "คำอธิบายเว็บไซต์",
  icons: {
    icon: "/images/logo.png",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="th" suppressHydrationWarning>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
