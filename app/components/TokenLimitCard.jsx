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
  const formatComma = (n) => {
    if (n === null || n === undefined || n === "") return "";
    const x = Number(String(n).replace(/,/g, ""));
    if (!Number.isFinite(x)) return "";
    return x.toLocaleString("en-US");
  };

  const parseComma = (s) => {
    const raw = String(s ?? "").replace(/,/g, "").trim();
    if (raw === "" || raw === "-" ) return "";
    const n = Number(raw);
    return Number.isFinite(n) ? n : "";
  };

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
          type="text"
          value={formatComma(value)}
          onChange={(e) => {
            const raw = e.target.value;

            // ✅ อนุญาตเฉพาะตัวเลขกับ comma
            if (!/^[0-9,]*$/.test(raw)) return;

            const n = parseComma(raw);
            onChange?.(n === "" ? 0 : n); // หรือส่ง "" ก็ได้ถ้าคุณอยากให้ว่างได้
          }}
          inputProps={{
            inputMode: "numeric",   // มือถือขึ้น keypad ตัวเลข
            style: { textAlign: "right" },
          }}
          fullWidth
          sx={{
            "& .MuiOutlinedInput-root": { borderRadius: 2 },
            "& input": { color: "#757575", fontWeight: 500 },
          }}
        />
      </Box>
    </Box>
  );
}
