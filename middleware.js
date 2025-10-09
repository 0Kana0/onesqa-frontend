// middleware.js
import { NextResponse } from "next/server";
import { setCookie, getCookie, deleteCookie } from "cookies-next";

export function middleware(req) {
  const url = req.nextUrl;
  const pathname = url.pathname;
  const hasRefresh = !!req.cookies.get("refreshToken")?.value; // หรือดึงจาก storage ก็ได้
  console.log(hasRefresh);

  const isLogin = pathname === "/auth/login";
  const isPrivate = pathname.startsWith("/onesqa");

  // ยังไม่ล็อกอินแต่เข้าโซน private -> เด้งไป login
  if (isPrivate && !hasRefresh) {
    const to = new URL("/auth/login", req.url);
    // if (url.search) {
    //   to.searchParams.set("from", pathname + url.search);
    // } else {
    //   to.searchParams.set("from", pathname);
    // }
    return NextResponse.redirect(to);
  }

  // ล็อกอินแล้ว (มี refreshToken) แต่ยังอยู่หน้า login -> ไป dashboard
  if (isLogin && hasRefresh) {
    return NextResponse.redirect(new URL("/onesqa/dashboard", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/onesqa/:path*", "/auth/login"],
};
