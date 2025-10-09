// app/auth/ClearAuthClient.jsx
"use client";

import { useEffect } from "react";
import { deleteCookie } from "cookies-next";

export default function ClearAuthClient() {
  useEffect(() => {
    try { localStorage.removeItem("user"); } catch {}
    // เผื่อกรณี accessToken ไม่ได้เป็น HttpOnly และยังหลงเหลือฝั่ง client
    try { deleteCookie("accessToken", { path: "/" }); } catch {}
  }, []);
  return null;
}
