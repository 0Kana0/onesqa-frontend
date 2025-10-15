// app/onesqa/layout.jsx
"use client";

import { useRequireAuth } from "../components/ui/useAuthGuard";
import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useQuery, useMutation } from "@apollo/client/react";
import { setCookie, deleteCookie } from "cookies-next";
import { Box, CssBaseline, Container, useMediaQuery } from "@mui/material";
import { GET_ME } from "@/graphql/auth/queries";
import { REFRESH_TOKEN } from "@/graphql/auth/mutations";
import Header from "../components/layout/Header";
import Sidebar from "../components/layout/Sidebar";
import Footer from "../components/layout/Footer";

export default function PrivateLayout({ children }) {
  const { ready, isAuthed } = useRequireAuth();
  const pathname = usePathname();
  const router = useRouter();

  const isMobile = useMediaQuery("(max-width:600px)"); // < md คือจอเล็ก
  const isTablet = useMediaQuery("(max-width:1200px)"); // < md คือจอเล็ก

  // ✅ Query GET_ME
  const { data, loading, error, refetch } = useQuery(GET_ME, {
    fetchPolicy: "network-only",
  });

  // ✅ Mutation refreshToken
  const [refreshToken] = useMutation(REFRESH_TOKEN);

  // ✅ refetch ทุกครั้งที่ path ภายใต้ /onesqa เปลี่ยน
  useEffect(() => {
    if (pathname.startsWith("/onesqa")) {
      refetch();
    }
  }, [pathname, refetch]);

  // ✅ จัดการ Unauthorized ด้วย effect
  useEffect(() => {
    if (error?.message?.includes("Unauthorized")) {
      refreshToken()
        .then((res) => {
          const payload = res?.data?.refreshToken;
          if (payload?.user) {
            localStorage.setItem("user", JSON.stringify(payload.user));
            setCookie("accessToken", payload.token, {
              path: "/",
              maxAge: 60 * 15,
              sameSite: "lax",
              // secure: process.env.NODE_ENV === "production",
            });
            refetch();
          }
        })
        .catch(() => {
          deleteCookie("accessToken", { path: "/" });
          localStorage.removeItem("user");
          router.push("/auth/login");
        });
    }
  }, [error, refreshToken, refetch, router]);

  // ✅ เก็บ user ทุกครั้งที่ data เปลี่ยน
  useEffect(() => {
    if (data?.me) {
      localStorage.setItem("user", JSON.stringify(data.me));
    }
  }, [data]);

  // ✅ กันไว้ตอนยังตรวจสอบ login อยู่
  if (!ready || !isAuthed) return null;

  //if (loading) return <p>Loading user...</p>;
  if (error && !error.message.includes("Unauthorized")) {
    return <p>Error: {error.message}</p>;
  }

  // ✅ Layout UI (ใช้ MUI)
  if (isTablet) {
    return (
      <Box
        sx={{
          display: "flex",
          minHeight: "100vh",
          bgcolor: "background.default",
        }}
      >
        <CssBaseline />
        <Box sx={{ display: "flex", flexDirection: "column", flexGrow: 1 }}>
          {/* Header */}
          <Header />
          <Sidebar />

          {/* Content */}
          <Box component="main" sx={{ flexGrow: 1, py: 3 }}>
            <Container maxWidth="xl">{children}</Container>
          </Box>

          {/* Footer */}
          <Footer />
        </Box>
      </Box>
    );
  } else {
    return (
      <Box
        sx={{
          display: "flex",
          minHeight: "100vh",
          bgcolor: "background.default",
        }}
      >
        <CssBaseline />

        {/* Sidebar — ถ้ามี */}
        <Sidebar />

        <Box sx={{ display: "flex", flexDirection: "column", flexGrow: 1 }}>
          {/* Header */}
          <Header />

          {/* Content */}
          <Box component="main" sx={{ flexGrow: 1, py: 3 }}>
            <Container maxWidth="xl">{children}</Container>
          </Box>

          {/* Footer */}
          <Footer />
        </Box>
      </Box>
    );
  }
}
