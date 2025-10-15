"use client";
import React from "react";
import { Box, Typography, Switch } from "@mui/material";

export default function NotificationToggleCard({
  title,
  description,
  checked,
  onChange,
}) {
  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        bgcolor: "primary.notification", // ✅ อ่านแล้วสีเทาอ่อน, ยังไม่อ่านสีตาม status
        borderRadius: 2,
        p: 2,
        mb: 1.5,
        border: `1px solid #BBDEFB`,
        //transition: "0.2s ease",
      }}
    >
      {/* ฝั่งซ้าย: ข้อความ */}
      <Box>
        <Typography variant="subtitle1" fontWeight="bold" color="text.primary">
          {title}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {description}
        </Typography>
      </Box>

      {/* ฝั่งขวา: สวิตช์ */}
      <Switch
        checked={checked}
        onChange={onChange}
        color="primary"
        sx={{
          "& .MuiSwitch-switchBase.Mui-checked": {
            color: "#1976D2",
          },
          "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track": {
            backgroundColor: "#90CAF9",
          },
        }}
      />
    </Box>
  );
}
