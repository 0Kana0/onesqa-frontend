// app/providers/AuthRedirectLoadingProvider.jsx
"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import FullScreenLoading from "./components/FullScreenLoading";

export default function AuthRedirectLoadingProvider({ children }) {
  const th = useTranslations("Header");
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onShow = (e) => {
      setOpen(true);
    };
    const onHide = () => setOpen(false);

    window.addEventListener("auth:redirect-loading:show", onShow);
    window.addEventListener("auth:redirect-loading:hide", onHide);

    return () => {
      window.removeEventListener("auth:redirect-loading:show", onShow);
      window.removeEventListener("auth:redirect-loading:hide", onHide);
    };
  }, []);

  return (
    <>
      {children}
      {open && <FullScreenLoading text={th("tokenloading")} />}
    </>
  );
}
