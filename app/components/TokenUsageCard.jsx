"use client";

import React from "react";
import { Box, Typography, LinearProgress, useMediaQuery } from "@mui/material";
import { useTranslations } from "next-intl";
import { formatTokens } from "@/util/formatTokens";

export default function TokenUsageCard({
  title = "Gemini 2.5 Pro",
  remain = 1500000000,
  total = 2000000000,
  today = 2500,
  average = 1800,
  always = false
}) {
  const t = useTranslations("TokenUsageCard");
  const isMobile = useMediaQuery("(max-width:600px)"); // < md คือจอเล็ก
  const isTablet = useMediaQuery("(max-width:1200px)"); // < md คือจอเล็ก

  // ✅ คำนวณเปอร์เซ็นต์การใช้งาน
  const percent = Math.min((remain / total) * 100, 100);

  // 🎨 กำหนดสีตามระดับการใช้งาน
  let progressColor = "#3E8EF7"; // 🔵 ปกติ
  if (percent >= 15 && percent <= 30) {
    progressColor = "#FFA726"; // 🟠 เตือน
  } else if (percent < 15) {
    progressColor = "#E53935"; // 🔴 เตือนมาก
  }

  return (
    <Box
      elevation={2}
      sx={{
        borderRadius: 3,
        display: "flex",
        flexDirection: "column",
        border: "1px solid #E5E7EB",
        boxShadow: "0 3px 8px rgba(0,0,0,0.04)",
        p: isMobile ? 1.5 : 2,
        gap: 1.2,
        bgcolor: "background.paper",
      }}
    >
      {/* 🔹 ชื่อโมเดล */}
      <Typography variant="subtitle1" fontWeight="bold">
        {title}
      </Typography>

      {/* 🔹 แสดงการใช้งานแล้ว */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Typography color="text.secondary" fontSize={14}>
          {t('remaining')}
        </Typography>
        <Typography fontWeight="bold" fontSize={14}>
          {formatTokens(remain, isMobile, always)} / {formatTokens(total, isMobile, always)} Tokens        
        </Typography>
      </Box>

      {/* 🔹 แถบแสดงเปอร์เซ็นต์ */}
      <LinearProgress
        variant="determinate"
        value={percent}
        sx={{
          height: 10,
          borderRadius: 5,
          backgroundColor: "#e3f2fd",
          "& .MuiLinearProgress-bar": {
            backgroundColor: progressColor,
          },
        }}
      />

      {/* 🔹 ข้อมูลเพิ่มเติม */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          mt: 1,
        }}
      >
        <Box>
          <Typography color="text.secondary" fontSize={14}>
            {t('today')}
          </Typography>
          <Typography fontWeight="bold">
            {formatTokens(today, isMobile, always)} Tokens
          </Typography>
        </Box>
        <Box>
          <Typography color="text.secondary" fontSize={14}>
            {t('average')}
          </Typography>
          <Typography fontWeight="bold">
            {formatTokens(average, isMobile, always)} Tokens
          </Typography>
        </Box>
      </Box>
    </Box>
  );
}
