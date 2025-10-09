"use client";

import { Box, Typography, LinearProgress } from "@mui/material";

export default function TokenUsageDashboardBar({
  title = "การใช้งาน Tokens",
  subtitle = "ติดตามการใช้งาน Tokens ประจำเดือน",
  used = 500, // หน่วย M
  total = 2000, // หน่วย M
}) {
  const remaining = total - used;
  const percent = Math.min((used / total) * 100, 100);

  return (
    <Box>
      {/* หัวข้อ */}
      <Typography variant="h6" fontWeight="bold">
        {title}
      </Typography>
      <Typography variant="body2" color="text.secondary" mb={2}>
        {subtitle}
      </Typography>

      {/* ข้อความบน progress bar */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          mb: 0.5,
        }}
      >
        <Typography variant="body2" color="text.primary">
          ใช้งานแล้ว: {used.toLocaleString()} M Tokens
        </Typography>
        <Typography variant="body2" color="text.primary">
          คงเหลือ: {remaining.toLocaleString()} M Tokens
        </Typography>
      </Box>

      {/* Progress Bar */}
      <LinearProgress
        variant="determinate"
        value={percent}
        sx={{
          height: 10,
          borderRadius: 5,
          backgroundColor: "#E3F2FD",
          "& .MuiLinearProgress-bar": {
            backgroundColor: "#3E8EF7",
          },
        }}
      />

      {/* ค่าด้านล่าง */}
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
