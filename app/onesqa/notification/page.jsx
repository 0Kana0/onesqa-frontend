"use client";

import React, { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { Box, Button, Typography, useMediaQuery } from "@mui/material";
import NotificationsNoneIcon from "@mui/icons-material/NotificationsNone";
import SettingsIcon from "@mui/icons-material/Settings";
import { useTranslations } from "next-intl";
import NotificationCard from "@/app/components/NotificationCard";
import NotificationToggleCard from "@/app/components/NotificationToggleCard";

const NotificationPage = () => {
  const { user } = useAuth();

  const [selected, setSelected] = useState("Notification");

  const t = useTranslations("NotificationPage");
  const isMobile = useMediaQuery("(max-width:600px)"); // < md คือจอเล็ก
  const isTablet = useMediaQuery("(max-width:1200px)"); // < md คือจอเล็ก

  const [systemNotify, setSystemNotify] = useState(true);
  const [tokenNotify, setTokenNotify] = useState(false);

  const buttons = [
    {
      label: t("notification"),
      icon: <NotificationsNoneIcon />,
      value: "Notification",
    },
    { label: t("setting"), icon: <SettingsIcon />, value: "Setting" },
  ];

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
              <NotificationCard
                title="การใช้งาน Token เกินกำหนด"
                message="การใช้งาน Token อยู่ที่ 85% กรุณาติดตามการใช้งานอย่างใกล้ชิด"
                date="15/11/2567 14:30:00"
                status="warning"
                isRead={false} // 🔹 ยังไม่อ่าน
              />
              <NotificationCard
                title="การใช้งาน Token เกินกำหนด"
                message="การใช้งาน Token อยู่ที่ 85% กรุณาติดตามการใช้งานอย่างใกล้ชิด"
                date="15/11/2567 14:30:00"
                status="warning"
                isRead={false} // 🔹 ยังไม่อ่าน
              />
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
              <NotificationToggleCard
                title="การแจ้งเตือนระบบ"
                description="รับการแจ้งเตือนเกี่ยวกับสถานะระบบและการใช้งาน"
                checked={systemNotify}
                onChange={(e) => setSystemNotify(e.target.checked)}
              />

              <NotificationToggleCard
                title="การแจ้งเตือนทางอีเมล"
                description="ส่งการแจ้งเตือนไปยังอีเมลของคุณ"
                checked={tokenNotify}
                onChange={(e) => setTokenNotify(e.target.checked)}
              />
            </Box>
          </Box>
        );
      default:
        return null;
    }
  };

  return (
    <Box sx={{ p: isMobile ? 0 : 3 }}>
      {user?.role_name === "ผู้ดูแลระบบ" && (
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
