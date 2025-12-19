"use client";

import React, { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { useQuery, useMutation } from "@apollo/client/react"; // ✅ ใช้จาก @apollo/client
import dayjs from "dayjs";
import { MY_NOTIFICATIONS } from "@/graphql/notification/queries";
import { GET_SETTINGS } from "@/graphql/setting/queries";
import { UPDATE_SETTING } from "@/graphql/setting/mutations";
import { useAuth } from "../../context/AuthContext";
import {
  Box,
  Button,
  Typography,
  CircularProgress,
  useMediaQuery,
  Alert,
} from "@mui/material";
import NotificationsNoneIcon from "@mui/icons-material/NotificationsNone";
import SettingsIcon from "@mui/icons-material/Settings";
import { useTranslations } from "next-intl";
import NotificationCard from "@/app/components/NotificationCard";
import NotificationToggleCard from "@/app/components/NotificationToggleCard";
import { toast } from "react-toastify";

const PAGE_SIZE = 4;

const NotificationPage = () => {
  const { user } = useAuth();
  const t = useTranslations("NotificationPage");
  const tInit = useTranslations("Init");
  const isMobile = useMediaQuery("(max-width:600px)");
  const isTablet = useMediaQuery("(max-width:1200px)");

  const [selected, setSelected] = useState("Notification");

  // ----- โหลด settings (เหมือนเดิม) -----
  const {
    data: settingsData,
    loading: settingsLoading,
    error: settingsError,
  } = useQuery(GET_SETTINGS, {
    fetchPolicy: "network-only",
  });

  // ----- โหลด notifications (cursor-based) -----
  const {
    data,
    loading,
    error,
    fetchMore,
    refetch,
    networkStatus,
  } = useQuery(MY_NOTIFICATIONS, {
    variables: { user_id: user?.id ?? "", first: PAGE_SIZE, after: null },
    skip: !user?.id,
    notifyOnNetworkStatusChange: true, // ให้รู้สถานะระหว่าง fetchMore/refetch
    fetchPolicy: "network-only",
  });

  console.log(data);

  const [updateSetting] = useMutation(UPDATE_SETTING);

  // รวม edges แบบ local state เพื่อควบคุม duplicate เองโดยไม่พึ่ง typePolicies
  const [edges, setEdges] = useState([]);
  const [endCursor, setEndCursor] = useState(null);
  const [hasNextPage, setHasNextPage] = useState(false);

  // เมื่อ data ชุดแรก/รีเฟรช เข้ามา → เซ็ตฐานใหม่
  useEffect(() => {
    const conn = data?.myNotifications;
    if (!conn) return;
    const incoming = conn.edges ?? [];
    const seen = new Set();
    const merged = [];
    for (const e of incoming) {
      if (!seen.has(e.cursor)) {
        seen.add(e.cursor);
        merged.push(e);
      }
    }
    setEdges(merged);
    setEndCursor(conn.pageInfo?.endCursor ?? null);
    setHasNextPage(Boolean(conn.pageInfo?.hasNextPage));
  }, [data?.myNotifications]);

  //ถ้า user เปลี่ยน → refetch
  useEffect(() => {
    if (user?.id) refetch({ user_id: user?.id, first: PAGE_SIZE, after: null });
  }, [user?.id, refetch]);

  useEffect(() => {
    // ปิด toast ที่กำลังแสดงอยู่ทั้งหมดทันทีเมื่อเข้าหน้านี้
    toast.dismiss();
  }, []);

  // โหลดหน้าเพิ่ม
  const loadMore = useCallback(async () => {
    if (!hasNextPage || !endCursor) return;
    const res = await fetchMore({
      variables: { user_id: user?.id, first: PAGE_SIZE, after: endCursor },
    });
    const conn = res?.data?.myNotifications;
    if (!conn) return;
    const incoming = conn.edges ?? [];
    // รวม/ลบซ้ำด้วย cursor
    setEdges((prev) => {
      const seen = new Set(prev.map((e) => e.cursor));
      const merged = [...prev];
      for (const e of incoming) {
        if (!seen.has(e.cursor)) {
          seen.add(e.cursor);
          merged.push(e);
        }
      }
      return merged;
    });
    setEndCursor(conn.pageInfo?.endCursor ?? null);
    setHasNextPage(Boolean(conn.pageInfo?.hasNextPage));
  }, [fetchMore, endCursor, hasNextPage, user?.id]);

  // IntersectionObserver sentinel
  const loaderRef = useRef(null);
  useEffect(() => {
    const el = loaderRef.current;
    if (!el) return;
    if (!hasNextPage) return;

    let locked = false;
    const io = new IntersectionObserver(async (entries) => {
      const entry = entries[0];
      if (entry.isIntersecting && !locked) {
        locked = true;
        try {
          await loadMore();
        } finally {
          // ปลดล็อกเล็กน้อยกันยิงซ้ำถี่
          setTimeout(() => (locked = false), 150);
        }
      }
    }, { root: null, rootMargin: "1px", threshold: 0 });

    io.observe(el);
    return () => io.disconnect();
  }, [hasNextPage, loadMore]);

  const items = useMemo(() => edges.map((e) => e.node), [edges]);

  if (settingsLoading)
    return (
      <Box sx={{ textAlign: "center", mt: 5 }}>
        <CircularProgress />
        <Typography>{tInit("loading")}...</Typography>
      </Box>
    );

  // ----- สถานะโหลด/ผิดพลาดรวมสองฝั่ง -----
  if (settingsError || error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">❌ {tInit("error")}</Alert>
      </Box>
    );
  }

  const buttons = [
    {
      label: t("notification"),
      icon: <NotificationsNoneIcon />,
      value: "Notification",
    },
    { label: t("setting"), icon: <SettingsIcon />, value: "Setting" },
  ];

  //console.log(settingsData?.settings);
  console.log(JSON.stringify(settingsData?.settings, null, 2));

  const renderContent = () => {
    switch (selected) {
      case "Notification":
        return (
          <Box
            sx={{
              border: "1px solid #E5E7EB",
              boxShadow: "0 3px 8px rgba(0,0,0,0.04)",
              borderRadius: 3,
              bgcolor: "background.paper",
              p: isMobile ? 1.5 : 3,
            }}
          >
            <Typography variant="h6" fontWeight={600}>
              {t("notititle1")}
            </Typography>
            <Typography variant="body1" sx={{ mt: 1 }} color="text.secondary">
              {t("notisubtitle1")}
            </Typography>

            <Box sx={{ mt: 2 }}>
              {items.map((n) => (
                <NotificationCard
                  key={n.id}
                  title={n.title}
                  message={n.message}
                  date={dayjs(n.createdAt).format("YYYY-MM-DD HH:mm:ss")}
                  status={n.type}
                />
              ))}

              {/* Loader / Sentinel */}
              <Box
                ref={loaderRef}
                sx={{ display: "flex", justifyContent: "center", py: 2 }}
              >
                {(loading) && (
                  <Box sx={{ textAlign: "center"}}>
                    <CircularProgress />
                    <Typography>{tInit("loading")}...</Typography>
                  </Box>
                )} 
                {!loading && items.length === 0 && (
                  <Typography variant="body2" sx={{ py: 3, textAlign: "center" }}>
                    {t("loading1")}
                  </Typography>
                )}
                {!hasNextPage && items.length > 0 && (
                  <Typography variant="caption" sx={{ opacity: 0.6 }}>
                    — {t("loading2")} —
                  </Typography>
                )}
              </Box>
            </Box>
          </Box>
        );
      case "Setting":
        return (
          <Box
            sx={{
              border: "1px solid #E5E7EB",
              boxShadow: "0 3px 8px rgba(0,0,0,0.04)",
              borderRadius: 3,
              bgcolor: "background.paper",
              p: isMobile ? 1.5 : 3,
            }}
          >
            <Typography variant="h6" fontWeight={600}>
              {t("systemtitle1")}
            </Typography>
            <Typography variant="body1" sx={{ mt: 1 }} color="text.secondary">
              {t("systemsubtitle1")}
            </Typography>

            <Box sx={{ mt: 2 }}>
              {settingsData?.settings?.map((setting) => (
                <NotificationToggleCard
                  key={setting.id}
                  title={setting.setting_name}
                  description={setting.setting_detail}
                  checked={setting.activity}
                  onChange={async (e) => {
                    const newValue = e.target.checked;
                    try {
                      await updateSetting({
                        variables: {
                          id: setting.id,
                          input: {
                            activity: newValue,
                          },
                        },
                      });
                      console.log(
                        `✅ Updated ${setting.setting_name} to ${newValue}`
                      );
                    } catch (err) {
                      console.error("❌ Error updating setting:", err);
                    }
                  }}
                />
              ))}
            </Box>
          </Box>
        );
      default:
        return null;
    }
  };

  return (
    <Box sx={{ p: isMobile ? 0 : 3 }}>
      {(user?.role_name === "ผู้ดูแลระบบ" || user?.role_name === "superadmin") && (
        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            flexDirection: isTablet ? "column" : "row", // ✅ สลับแนวตามจอ
            alignItems: isTablet ? "flex-start" : "center",
            gap: 1,
            p: 1,
            bgcolor: "background.paper",
            borderRadius: 3,
            border: "1px solid #E5E7EB",
            boxShadow: "0 3px 8px rgba(0,0,0,0.04)",
            mb: 2,
          }}
        >
          {buttons.map((btn) => {
            const isSelected = selected === btn.value;
            return (
              <Button
                key={btn.value}
                onClick={() => setSelected(btn.value)}
                startIcon={btn.icon}
                variant="contained"
                sx={{
                  flex: 1,
                  textTransform: "none",
                  borderRadius: 2,
                  px: 3,
                  py: 1.5,
                  width: isTablet ? "100%" : "none",
                  fontWeight: 600,
                  bgcolor: isSelected ? "#1976d2" : "#e3f2fd",
                  color: isSelected ? "#fff" : "#1976d2",
                  boxShadow: isSelected ? "0 2px 6px rgba(0,0,0,0.15)" : "none",
                  "&:hover": {
                    bgcolor: isSelected ? "#1565c0" : "#dbeafe",
                  },
                }}
              >
                {btn.label}
              </Button>
            );
          })}
        </Box>
      )}

      {/* เนื้อหาที่เปลี่ยนตามปุ่ม */}
      {renderContent()}
    </Box>
  );
};

export default NotificationPage;
