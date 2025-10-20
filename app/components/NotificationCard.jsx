"use client";
import React from "react";
import { Box, Typography, Chip, Stack, useMediaQuery } from "@mui/material";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import InfoIcon from "@mui/icons-material/Info";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import { useTranslations } from "next-intl";

export default function NotificationCard({
  title,
  message,
  date,
  status = "warning", // warning | info | success
  isRead = false, // true = เปิดอ่านแล้ว, false = ยังไม่ได้อ่าน
}) {
  const t = useTranslations("ReportPage");
  const isMobile = useMediaQuery("(max-width:600px)"); // < md คือจอเล็ก
  const isTablet = useMediaQuery("(max-width:1200px)"); // < md คือจอเล็ก

  const getStatusColor = () => {
    switch (status) {
      case "WARNING":
        return { color: "#FF9500", bg: "#FFF3E0", icon: <WarningAmberIcon /> };
      case "INFO":
        return { color: "#0288D1", bg: "#E1F5FE", icon: <InfoIcon /> };
      case "SUCCESS":
        return { color: "#2E7D32", bg: "#E8F5E9", icon: <CheckCircleIcon /> };
      default:
        return { color: "#616161", bg: "#F5F5F5", icon: <InfoIcon /> };
    }
  };

  const { color, bg, icon } = getStatusColor();

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        //bgcolor: isRead ? "#FAFAFA" : bg, // ✅ อ่านแล้วสีเทาอ่อน, ยังไม่อ่านสีตาม status
        bgcolor: "primary.notification", // ✅ อ่านแล้วสีเทาอ่อน, ยังไม่อ่านสีตาม status
        borderRadius: 2,
        p: 2,
        mb: 1.5,
        boxShadow: "none",
        border: `1px solid #BBDEFB`,
        //transition: "0.2s",
      }}
    >
      <Box
        sx={{
          display: "flex",
          flexDirection: isMobile ? "column" : "row", // ✅ สลับแนวตามจอ
          alignItems: isMobile ? "flex-start" : "center",
          gap: 2,
        }}
      >
        <Box sx={{  display: "flex", gap: 2 }}>
          <Box sx={{ color }}>{icon}</Box>
          <Typography
            variant="subtitle1"
            fontWeight="bold"
            color="text.primary"
          >
            {title}
          </Typography>
        </Box>
        <Chip
          label={status.toUpperCase()}
          size="small"
          sx={{
            ml: 1,
            bgcolor: color,
            color: "#fff",
            fontWeight: "bold",
            height: 22,
          }}
        />
      </Box>

      <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
        {message}
      </Typography>

      <Stack direction="row" alignItems="center" spacing={0.5} sx={{ mt: 1 }}>
        <AccessTimeIcon sx={{ fontSize: 16, color: "#9E9E9E" }} />
        <Typography variant="caption" color="#9E9E9E">
          {date}
        </Typography>
      </Stack>
    </Box>
  );
}
