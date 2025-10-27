// hooks/useRequireRole.js
"use client";

import { useEffect, useMemo } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "../app/context/AuthContext"; // ของคุณเอง

/**
 * ใช้ guard หน้าด้วย role
 * @param {Object} options
 * @param {string[]} options.roles รายชื่อ role ที่อนุญาต
 * @param {string} options.redirectTo path ที่จะส่งไปถ้าไม่ผ่านสิทธิ์
 * @param {(user:any)=>boolean} options.allowIf เงื่อนไข custom เพิ่มเติม (ออปชัน)
 * @returns {{ allowed:boolean, loading:boolean, user:any }}
 */
export function useRequireRole({
  roles = ["ผู้ดูแลระบบ"],
  redirectTo = "/onesqa/chat",
  allowIf,
} = {}) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, loading: authLoading } = useAuth?.() || { user: undefined, loading: false };

  // กำหนดสถานะ loading แบบกันเหนียว หาก context ไม่ส่ง loading มา
  const loading = typeof authLoading === "boolean" ? authLoading : typeof user === "undefined";

  const allowed = useMemo(() => {
    if (!user) return false;
    const roleName = user.role_name || user.role || user.roleName;
    const inList = roles.length ? roles.includes(roleName) : true;
    const custom = typeof allowIf === "function" ? allowIf(user) : true;
    return inList && custom;
  }, [user, roles, allowIf]);

  useEffect(() => {
    if (loading) return;
    if (!allowed) {
      router.replace(`${redirectTo}`);
    }
  }, [allowed, loading, redirectTo, router, pathname]);

  return { allowed, loading, user };
}
