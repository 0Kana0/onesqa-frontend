"use client";

import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  CircularProgress,
  useMediaQuery,
} from "@mui/material";
import { useQuery, useMutation } from "@apollo/client/react";
import { GET_USER } from "@/graphql/user/queries";
import UserInfoCard from "@/app/components/UserInfoCard";
import TokenUsageCard from "@/app/components/TokenUsageCard";
import { useAuth } from "@/app/context/AuthContext";

export default function DetailPage() {
  // mock data (จริง ๆ สามารถดึงจาก GraphQL ได้)
  const isMobile = useMediaQuery("(max-width:600px)"); // < md คือจอเล็ก
  const isTablet = useMediaQuery("(max-width:1200px)"); // < md คือจอเล็ก

  const { user } = useAuth();

  const {
    data: userData,
    loading: userLoading,
    error: userError,
  } = useQuery(GET_USER, {
    variables: {
      id: user?.id || 1,
    },
  });

  const [userCard, setUserCard] = useState([]);

  // const userCard = {
  //   id: 1,
  //   name: "นายสมพล อารุณศักดิ์กุล",
  //   position: "หัวหน้าภารกิจ",
  //   email: "sompol@onesqa.or.th",
  //   phone: "022163955",
  //   status: "active",
  //   role: "หัวหน้ากลุ่มงาน",
  // };

  // ✅ useEffect
  useEffect(() => {
    if (userData?.user) {
      const users = Array.isArray(userData.user)
        ? userData.user
        : [userData.user]; // ✅ ถ้าเป็น object เดียว แปลงให้เป็น array

      const formattedData = users.map((user) => ({
        id: user.id,
        username: user.username,
        name: `${user.firstname || ""} ${user.lastname || ""}`.trim() || "-",
        email: user.email || "-",
        phone: user.phone || "-",
        position: user.position || "-",
        group: user.group_name || "-",
        status: user.ai_access ? "ใช้งานอยู่" : "ไม่ใช้งาน",
        colorMode: user.color_mode || "LIGHT",
        aiModels:
          user.user_ai?.map((ai) => ({
            ai_id: ai.ai_id, // ✅ เพิ่ม ai_id ไว้ใช้งานตอน update
            model: ai.ai?.model_name || "-",
            token: ai.token_count || 0,
            token_all: ai.token_all || 0,
            today: ai.today || 0,
            average: ai.average || 0,
          })) || [],
        chatgpt5Used: 1500000,
        geminiUsed: 150000,
        chatgpt5Max: 2000000,
        geminiMax: 2000000,
      }));

      setUserCard(formattedData); // ✅ เก็บเป็น array เสมอ
    }
  }, [userData]);

  console.log(userCard);

  if (userLoading)
    return (
      <Box sx={{ textAlign: "center", mt: 5 }}>
        <CircularProgress />
        <Typography>กำลังโหลดข้อมูล...</Typography>
      </Box>
    );

  if (userError)
    return (
      <Typography color="error" sx={{ mt: 5 }}>
        ❌ เกิดข้อผิดพลาดในการโหลดข้อมูล
      </Typography>
    );

  return (
    <Box sx={{ p: isMobile ? 0 : 3 }}>
      <Box
        sx={{
          position: "relative",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          gap: 3,
          flexWrap: "wrap",
          p: isMobile ? 0 : 3,
          overflow: "hidden", // ✅ กันไม่ให้เกินขอบ
          "&::before": {
            content: '""',
            position: "absolute",
            borderRadius: 3,
            top: 0,
            left: 0,
            width: "100%",
            height: "33%", // ✅ แสดงแค่ 1/3 ของพื้นที่
            bgcolor: isMobile ? "none" : "primary.main",
            zIndex: 0,
          },
        }}
      >
        {/* 🔹 กล่องซ้าย */}
        <Box sx={{ flex: 1, position: "relative", zIndex: 1 }}>
          <UserInfoCard user={userCard[0]} />
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
            p: isMobile ? 1 : 2,
            position: "relative",
            zIndex: 1,
          }}
        >
          {userCard[0]?.aiModels?.map((ai, index) => (
            <TokenUsageCard
              key={index}
              title={
                ai.model === "gpt-4o"
                  ? "ChatGPT 4o"
                  : ai.model === "gemini-2.5-pro"
                  ? "Gemini 2.5 Pro"
                  : ai.model
              }
              remain={ai.token}
              total={ai.token_all}
              today={ai.today}
              average={ai.average}
            />
          ))}
        </Box>
      </Box>
    </Box>
  );
}
