"use client";

import React, { useState } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  LinearProgress,
  Switch,
  TextField,
  useMediaQuery,
} from "@mui/material";
import { useTranslations } from 'next-intl';
import { formatTokens } from "@/util/formatTokens";

export default function TokenUsageCardSetting({
  title = "Gemini 2.5 Pro",
  remain = 1500000000,
  total = 2000000000,
  today = 2500,
  average = 1800,
  enabled = false,
  onToggle = () => {},
  onLimitChange = () => {},
  defaultLimit = 1000000,
}) {
  const t = useTranslations('TokenUsageCardSetting');
  const isMobile = useMediaQuery("(max-width:600px)"); // < md คือจอเล็ก
  const isTablet = useMediaQuery("(max-width:1200px)"); // < md คือจอเล็ก

  const formatComma = (n) => {
    if (n === null || n === undefined || n === "") return "";
    const x = Number(String(n).replace(/,/g, ""));
    return Number.isFinite(x) ? x.toLocaleString("en-US") : "";
  };

  const parseCommaToNumber = (s) => {
    const raw = String(s ?? "").replace(/,/g, "").trim();
    if (raw === "") return 0;
    const n = Number(raw);
    return Number.isFinite(n) ? n : 0;
  };

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
    <Card
      elevation={0}
      sx={{
        borderRadius: 3,
        border: "1px solid #e0e0e0",
        p: isMobile ? 1.5 : 2,
      }}
    >
      {/* 🔹 หัวข้อ + ปุ่มเปิด/ปิด */}
      <Box display="flex" justifyContent="space-between" alignItems="center">
        <Typography variant="h6" fontWeight={700}>
          {title}
        </Typography>
        <Switch checked={enabled} onChange={onToggle} />
      </Box>

      <CardContent sx={{ p: 0, pt: 1 }}>
        {/* 🔹 ฟิลด์กรอกข้อมูล Tokens */}
        <Typography variant="subtitle2" color="text.secondary">
          {t('settoken')}
        </Typography>
        <TextField
          type="text"
          fullWidth
          size="small"
          variant="outlined"
          value={formatComma(defaultLimit)}
          onChange={(e) => {
            const raw = e.target.value;

            // ✅ อนุญาตเฉพาะตัวเลขและ comma
            if (!/^[0-9,]*$/.test(raw)) return;

            onLimitChange(parseCommaToNumber(raw)); // ✅ ส่งเป็น number ให้ parent
          }}
          inputProps={{
            inputMode: "numeric",
            style: { textAlign: "right" },
          }}
          sx={{
            mt: 0.5,
            mb: 1.5,
            "& .MuiInputBase-input": { textAlign: "right" },
          }}
        />

        {/* 🔹 แถบการใช้งาน */}
        <Box display="flex" justifyContent="space-between">
          <Typography variant="body2" fontWeight={600}>
            {t('remaining')}
          </Typography>
          <Typography variant="body2">
            {formatTokens(remain, isMobile)} / {formatTokens(total, isMobile)} Tokens
          </Typography>
        </Box>

        <LinearProgress
          variant="determinate"
          value={percent}
          sx={{
            height: 8,
            borderRadius: 5,
            my: 1,
            bgcolor: "#e3f2fd",
            "& .MuiLinearProgress-bar": { bgcolor: progressColor },
          }}
        />

        {/* 🔹 วันนี้ / เฉลี่ยต่อวัน */}
        <Box display="flex" justifyContent="space-between">
          <Box>
            <Typography variant="body2" color="text.secondary">
              {t('today')}
            </Typography>
            <Typography variant="body2" fontWeight={600}>
              {formatTokens(today, isMobile)} Tokens
            </Typography>
          </Box>

          <Box textAlign="right">
            <Typography variant="body2" color="text.secondary">
              {t('average')}
            </Typography>
            <Typography variant="body2" fontWeight={600}>
              {formatTokens(average, isMobile)} Tokens
            </Typography>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
}
