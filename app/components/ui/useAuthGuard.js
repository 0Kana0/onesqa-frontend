// app/ui/useAuthGuard.js
"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

export function useRequireAuth() {
  const router = useRouter();
  const pathname = usePathname();
  const [ready, setReady] = useState(false);
  const [isAuthed, setAuthed] = useState(false);

  useEffect(() => {
    let u = null;
    try { u = localStorage.getItem("user"); } catch {}
    const ok = !!u;
    setAuthed(ok);
    setReady(true);
    if (!ok) {
      router.replace(`/auth/login`);
    }
  }, [router, pathname]);

  return { ready, isAuthed };
}

export function useRedirectIfAuthed() {
  const router = useRouter();
  useEffect(() => {
    try {
      const u = localStorage.getItem("user");
      if (u) router.replace("/onesqa/dashboard");
    } catch {}
  }, [router]);
}
