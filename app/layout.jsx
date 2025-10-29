// app/layout.jsx (ไม่มี "use client")
import Providers from "./providers";

export default function RootLayout({ children }) {
  return (
    <html lang="th" suppressHydrationWarning> 
      <head>
        <meta name="disable-extension-injections" content="true" />
        <meta httpEquiv="Content-Security-Policy" content="script-src 'self' 'unsafe-inline'" />
      </head>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
