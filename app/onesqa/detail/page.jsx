"use client";

import React, { useState } from "react";
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Select,
  MenuItem,
  LinearProgress,
  Chip,
  TextField,
} from "@mui/material";
import UserInfoCard from "@/app/components/UserInfoCard";
import TokenLimitCard from "@/app/components/TokenLimitCard";
import TokenUsageCard from "@/app/components/TokenUsageCard";
import ActionBar from "@/app/components/ActionBar";

export default function DetailPage() {
  // mock data (จริง ๆ สามารถดึงจาก GraphQL ได้)
  const user = {
    id: 1,
    name: "นายสมพล อารุณศักดิ์กุล",
    position: "หัวหน้าภารกิจ",
    email: "sompol@onesqa.or.th",
    phone: "022163955",
    status: "active",
    role: "หัวหน้ากลุ่มงาน",
  };

  const users = [
    {
      id: 48095,
      name: "นายสมพล จารุรนท์ศักดิ์ฑูร",
      position: "หัวหน้าฝ่ายการกิจ",
      phone: "022163955",
      email: "sompol@onesqa.or.th",
      status: "ใช้งานอยู่",
      role: "หัวหน้าภารกิจ",
      chatgpt5Limit: 1000000,
      geminiLimit: 1000000,
      chatgpt5Used: 1500000,
      geminiUsed: 1500000,
      chatgpt5Max: 2000000,
      geminiMax: 2000000,
    },
  ];

  const [geminiTokens, setGeminiTokens] = useState(1000000);
  const [chatgptTokens, setChatgptTokens] = useState(1000000);
  const [viewMode, setViewMode] = useState("card"); // ✅ state อยู่ที่นี่

  const handleViewChange = (mode) => {
    setViewMode(mode);
    console.log("🟢 เปลี่ยนโหมดเป็น:", mode);
  };

  return (
    <Box sx={{ p: 3 }}>

        <Box
          sx={{
            position: "relative",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            gap: 3,
            flexWrap: "wrap",
            p: 3,
            overflow: "hidden", // ✅ กันไม่ให้เกินขอบ
            "&::before": {
              content: '""',
              position: "absolute",
              borderRadius: 3,
              top: 0,
              left: 0,
              width: "100%",
              height: "33%", // ✅ แสดงแค่ 1/3 ของพื้นที่
              bgcolor: "#3E8EF7",
              zIndex: 0,
            },
          }}
        >
          {/* 🔹 กล่องซ้าย */}
          <Box sx={{ flex: 1, position: "relative", zIndex: 1 }}>
            <UserInfoCard user={user} />
          </Box>

          {/* 🔹 กล่องขวา */}
          <Box
            sx={{
              flex: 1,
              minWidth: 250,
              display: "flex",
              flexDirection: "column",
              gap: 2,
              borderRadius: 3,
              boxShadow: "0 3px 10px rgba(0,0,0,0.05)",
              bgcolor: "white",
              p: 2,
              position: "relative",
              zIndex: 1,
            }}
          >
            <TokenUsageCard
              title="Gemini 2.5 Pro"
              used={1500000}
              total={2000000}
              today={2500}
              average={1800}
            />
            <TokenUsageCard
              title="ChatGPT 4o"
              used={1200000}
              total={2000000}
              today={3200}
              average={2500}
            />
          </Box>
        </Box>
    </Box>
  );
}
