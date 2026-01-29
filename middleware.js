// middleware.js
import { NextResponse } from "next/server";
import { setCookie, getCookie, deleteCookie } from "cookies-next";

export function middleware(req) {
  const { pathname } = req.nextUrl;

  const refreshToken = req.cookies.get("refreshToken")?.value;
  const accessToken = req.cookies.get("accessToken")?.value; // 👈 token ที่มาจาก callback
  const hasAuth = !!refreshToken || !!accessToken;

  const isLogin = pathname === "/auth/login";
  const isPrivate = pathname.startsWith("/onesqa");

  // ยังไม่ล็อกอินแต่เข้าโซน private -> เด้งไป login
  if (isPrivate && !hasAuth) {
    return NextResponse.redirect(new URL("/auth/login", req.url));
  }

  // ล็อกอินแล้ว แต่ยังอยู่หน้า login -> ไป dashboard
  if (isLogin && hasAuth) {
    return NextResponse.redirect(new URL("/onesqa/dashboard", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/onesqa/:path*", "/auth/login"],
};
