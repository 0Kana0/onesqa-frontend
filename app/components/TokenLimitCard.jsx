"use client";

import React from "react";
import { Card, CardContent, Typography, Box, TextField } from "@mui/material";

export default function TokenLimitCard({
  title = "Gemini 2.5 Pro",
  label = "กำหนด Tokens ให้ผู้ใช้งาน",
  value = 1000000,
  onChange,
  min = 0,
  max = 10000000,
  step = 1000,
}) {
  return (
    <Box
      sx={{
        border: "1px solid #E5E7EB",
        boxShadow: "0 3px 8px rgba(0,0,0,0.04)",
        borderRadius: 4,
        p: 2,
      }}
    >
      {/* 🔹 หัวข้อ */}
      <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
        {title}
      </Typography>

      {/* 🔹 คำอธิบาย */}
      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
        {label}
      </Typography>

      {/* 🔹 ช่องกรอกตัวเลข */}
      <Box>
        <TextField
          type="number"
          value={value}
          onChange={(e) => onChange?.(Number(e.target.value))}
          inputProps={{
            min,
            max,
            step,
            style: { textAlign: "right" },
          }}
          fullWidth
          sx={{
            "& .MuiOutlinedInput-root": {
              borderRadius: 2,
            },
            "& input": {
              color: "#757575",
              fontWeight: 500,
            },
          }}
        />
      </Box>
    </Box>
  );
}
