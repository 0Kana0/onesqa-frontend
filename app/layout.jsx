// app/layout.jsx (ไม่มี "use client")
import Providers from "./providers";

export default function RootLayout({ children }) {
  return (
    <html lang="th" suppressHydrationWarning> 
      <body style={{ background: "#ffffff" }}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
