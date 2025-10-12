"use client";

import { Box, Typography, LinearProgress } from "@mui/material";
import { useTranslations } from 'next-intl';

export default function TokenUsageDashboardBar({
  title = "การใช้งาน Tokens",
  subtitle = "ติดตามการใช้งาน Tokens ประจำเดือน",
  used = 500, // หน่วย M
  total = 2000, // หน่วย M
}) {
  const t = useTranslations('TokenUsageDashboardBar');
  const remaining = total - used;
  const percent = Math.min((used / total) * 100, 100);

  // 🎨 กำหนดสีตามระดับการใช้งาน
  let progressColor = "#3E8EF7"; // 🔵 ปกติ
  if (percent >= 70 && percent <= 85) {
    progressColor = "#FFA726"; // 🟠 เตือน
  } else if (percent > 85) {
    progressColor = "#E53935"; // 🔴 เตือนมาก
  }

  return (
    <Box>
      {/* หัวข้อ */}
      <Typography variant="h6" fontWeight="bold">
        {title}
      </Typography>
      <Typography variant="body2" color="text.secondary" mb={2}>
        {subtitle}
      </Typography>

      {/* 🔹 ข้อความบน progress bar */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          mb: 0.5,
        }}
      >
        <Typography variant="body2" color="text.primary">
          {t('used')}: {used.toLocaleString()} M Tokens
        </Typography>
        <Typography variant="body2" color="text.primary">
          {t('remaining')}: {remaining.toLocaleString()} M Tokens
        </Typography>
      </Box>

      {/* 🔹 Progress Bar */}
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

      {/* 🔹 ค่าด้านล่าง */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          mt: 0.5,
        }}
      >
        <Typography variant="body2" color="text.primary">
          0
        </Typography>
        <Typography variant="body2" color="text.primary">
          {total.toLocaleString()} M Tokens
        </Typography>
      </Box>
    </Box>
  );
}
