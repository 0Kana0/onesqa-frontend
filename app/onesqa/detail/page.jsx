"use client";

import React, { useState } from "react";
import {
  Box,
} from "@mui/material";
import UserInfoCard from "@/app/components/UserInfoCard";
import TokenUsageCard from "@/app/components/TokenUsageCard";

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
              bgcolor: "primary.main",
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
              bgcolor: "background.paper",
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
