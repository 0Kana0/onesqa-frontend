"use client";

import {
  useMediaQuery
} from "@mui/material";
import { useEffect, useState, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useQuery, useMutation } from "@apollo/client/react";
import { setCookie, deleteCookie } from "cookies-next";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "next-themes";
import { useTranslations } from 'next-intl';
import { useLanguage } from "@/app/context/LanguageContext";
import FullScreenLoading from "../../components/FullScreenLoading";
import { extractErrorMessage, showErrorAlert } from "@/util/errorAlert"; // ปรับ path ให้ตรงโปรเจกต์จริง
import { GET_ME } from "@/graphql/auth/queries";
import { REFRESH_TOKEN } from "@/graphql/auth/mutations";

const mapTheme = (value) => {
  const v = String(value ?? "").toUpperCase();
  if (v === "DARK") return "dark";
  if (v === "LIGHT") return "light";
  return value;
};

export default function AfterLoginPage() {
  const router = useRouter();
  const sp = useSearchParams();
  const redirectedRef = useRef(false);

  const { theme, setTheme } = useTheme();
  const { handleLanguageChange, locale } = useLanguage();
  const { accessTokenContext, userContext } = useAuth();

  const target = sp.get("target") || "/onesqa/chat";
  const safeTarget = target.startsWith("/onesqa/") ? target : "/onesqa/chat";

  const t = useTranslations('LoginPage');
  const tloginerror = useTranslations('LoginError');
  const tError = useTranslations('ErrorAlert');
  
  const isMobile = useMediaQuery("(max-width:600px)"); // < md คือจอเล็ก

  // ✅ Query GET_ME (เหมือนใน layout)
  const { data, loading, error, refetch } = useQuery(GET_ME, {
    fetchPolicy: "network-only",
  });

  // ✅ Mutation refreshToken (เผื่อเจอ Unauthorized)
  const [refreshToken] = useMutation(REFRESH_TOKEN);

  const [loadingScreen, setLoadingScreen] = useState(false);

  // ✅ ถ้า Unauthorized → ลอง refresh token แล้ว refetch me
  useEffect(() => {
    if (!error?.message?.includes("Unauthorized")) return;

    setLoadingScreen(true); // ✅ เปิด loading ทันที

    refreshToken()
      .then((res) => {
        const payload = res?.data?.refreshToken;
        if (payload?.user) {
          accessTokenContext(payload?.token || null);
          userContext(payload.user);
          handleLanguageChange(payload.user?.locale || "th");
          setTheme(mapTheme(payload.user?.color_mode) || "light");

          if (payload.user?.alert === true) {
            localStorage.setItem("alert", payload.user.alert);
          } else {
            localStorage.removeItem("alert");
          }

          if (payload?.token) {
            setCookie("accessToken", payload.token, {
              path: "/",
              maxAge: 60 * 15,
              sameSite: "lax",
              // secure: process.env.NODE_ENV === "production",
            });
          }

          return refetch();
        }

        // ถ้า refresh ได้แต่ไม่มี user ก็ให้ไป login
        throw new Error("Refresh token failed");
      })
      .catch(() => {
        deleteCookie("accessToken", { path: "/" });
        localStorage.removeItem("user");
        router.replace("/auth/login");
        router.refresh();
      });
  }, [error, refreshToken, refetch, router, handleLanguageChange, setTheme]);

  // ✅ ได้ me แล้ว → เก็บ user + redirect ไป safeTarget
  useEffect(() => {
    if (!data?.me) return;

    setLoadingScreen(true); // ✅ เปิด loading ทันที

    userContext(data.me);
    handleLanguageChange(data.me?.locale || "th");
    setTheme(mapTheme(data.me?.color_mode) || "light");

    if (data.me?.alert === true) {
      localStorage.setItem("alert", data.me.alert);
    } else {
      localStorage.removeItem("alert");
    }

    if (!redirectedRef.current) {
      redirectedRef.current = true;
      router.replace(safeTarget);
    }
  }, [data, router, safeTarget, handleLanguageChange, setTheme]);

  // ✅ error อื่น ๆ (ไม่ใช่ Unauthorized) จะพาไป login ได้เลย
  useEffect(() => {
    if (error && !error.message.includes("Unauthorized")) {
      router.replace("/auth/login");
      router.refresh();
    }
  }, [error, router]);

  return (
    <>
      {loadingScreen && <FullScreenLoading text={t('loading')} />}
    </>
  )
}
