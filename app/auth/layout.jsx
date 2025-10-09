// app/auth/layout.jsx  (Server Component ได้ แต่แทรก Client component ข้างใน)
import ClearAuthClient from "./ClearAuthClient";

export default function AuthLayout({ children }) {
  return (
    <div>
      <ClearAuthClient />
      {children}
    </div>
  );
}
