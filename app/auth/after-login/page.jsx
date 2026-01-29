"use client";

import {
  useMediaQuery
} from "@mui/material";
import { useEffect, useState, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useQuery, useMutation } from "@apollo/client/react";
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
  
  const isMobile = useMediaQuery("(max-width:600px)"); // < md คือจอเล็ก

  // ✅ Query GET_ME (เหมือนใน layout)
  const { data, loading, error, refetch } = useQuery(GET_ME, {
    fetchPolicy: "network-only",
  });

  // ✅ Mutation refreshToken (เผื่อเจอ Unauthorized)
  const [refreshToken] = useMutation(REFRESH_TOKEN);

  const [loadingScreen, setLoadingScreen] = useState(false);

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
