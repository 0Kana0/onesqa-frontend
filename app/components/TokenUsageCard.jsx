"use client";

import React from "react";
import { Box, Typography, LinearProgress, Paper } from "@mui/material";

export default function TokenUsageCard({
  title = "Gemini 2.5 Pro",
  used = 1500000,
  total = 2000000,
  today = 2500,
  average = 1800,
}) {
  // ✅ คำนวณเปอร์เซ็นต์การใช้งาน
  const percent = Math.min((used / total) * 100, 100);

  return (
    <Box
      elevation={2}
      sx={{
        borderRadius: 3,
        display: "flex",
        flexDirection: "column",
        border: "1px solid #E5E7EB",
        boxShadow: "0 3px 8px rgba(0,0,0,0.04)",
        p: 2,
        gap: 1.2,
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
          ใช้งานแล้ว
        </Typography>
        <Typography fontWeight="bold" fontSize={14}>
          {used.toLocaleString()} / {total.toLocaleString()} Tokens
        </Typography>
      </Box>

      {/* 🔹 แถบแสดงเปอร์เซ็นต์ */}
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
            วันนี้
          </Typography>
          <Typography fontWeight="bold">
            {today.toLocaleString()} Tokens
          </Typography>
        </Box>
        <Box>
          <Typography color="text.secondary" fontSize={14}>
            เฉลี่ยต่อวัน
          </Typography>
          <Typography fontWeight="bold">
            {average.toLocaleString()} Tokens
          </Typography>
        </Box>
      </Box>
    </Box>
  );
}
