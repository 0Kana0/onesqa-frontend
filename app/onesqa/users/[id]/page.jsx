"use client";

import React, { useState, useEffect } from "react";
import { useQuery, useMutation } from "@apollo/client/react";
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
  CircularProgress,
  useMediaQuery,
} from "@mui/material";
import { GET_USER } from "@/graphql/user/queries";
import { UPDATE_USER } from "@/graphql/user/mutations";
import { useParams } from "next/navigation";
import UserInfoCard from "@/app/components/UserInfoCard";
import TokenLimitCard from "@/app/components/TokenLimitCard";
import TokenUsageCard from "@/app/components/TokenUsageCard";
import ActionBar from "@/app/components/ActionBar";
import { useTranslations } from "next-intl";
import { useSidebar } from "../../../context/SidebarContext"; // ✅ ใช้ context

export default function UserDetailPage() {
  const params = useParams();
  const { id } = params;
  const t = useTranslations("UserDetailPage");
  const { open, toggle } = useSidebar(); // ✅ ดึงจาก Context

  const isMobile = useMediaQuery("(max-width:600px)"); // < md คือจอเล็ก
  const isTablet = useMediaQuery("(max-width:1200px)"); // < md คือจอเล็ก

  const [viewMode, setViewMode] = useState("card"); // ✅ state อยู่ที่นี่

  const {
    data: userData,
    loading: userLoading,
    error: userError,
  } = useQuery(GET_USER, {
    variables: {
      id: id,
    },
  });

  console.log(userData?.user);

  const [updateUser] = useMutation(UPDATE_USER);

  // mock data (จริง ๆ สามารถดึงจาก GraphQL ได้)
  // const [userCard, setUserCard] = useState([
  //   {
  //     id,
  //     name: "นายสมพล อารุณศักดิ์กุล",
  //     position: "หัวหน้าภารกิจ",
  //     email: "sompol@onesqa.or.th",
  //     phone: "022163955",
  //     status: "active",
  //     role: "หัวหน้ากลุ่มงาน",
  //   },
  // ]);
  const [userCardTable, setUserCardTable] = useState([]);
  const [resetTrigger, setResetTrigger] = useState(0); // ✅ ตัวแปร trigger

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
            active: ai.activity,
          })) || [],
        chatgpt5Used: 1500000,
        geminiUsed: 150000,
        chatgpt5Max: 2000000,
        geminiMax: 2000000,
      }));

      setUserCardTable(formattedData); // ✅ เก็บเป็น array เสมอ
    }
  }, [userData, resetTrigger]);

  console.log(userCardTable);

  // const userTable = [
  //   {
  //     id: 48095,
  //     name: "นายสมพล จารุรนท์ศักดิ์ฑูร",
  //     position: "หัวหน้าฝ่ายการกิจ",
  //     phone: "022163955",
  //     email: "sompol@onesqa.or.th",
  //     status: "ใช้งานอยู่",
  //     role: "หัวหน้าภารกิจ",
  //     chatgpt5Limit: 1000000,
  //     geminiLimit: 1000000,
  //     chatgpt5Used: 1500000,
  //     geminiUsed: 150000,
  //     chatgpt5Max: 2000000,
  //     geminiMax: 2000000,
  //   },
  // ];

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

  const handleViewChange = (mode) => {
    setViewMode(mode);
    console.log("🟢 เปลี่ยนโหมดเป็น:", mode);
  };

  // ✅ ฟังก์ชันแยก: handleTokenChange
  const handleTokenChange = (userIndex, aiIndex, newValue) => {
    setUserCardTable((prev) => {
      if (!prev || !Array.isArray(prev)) return prev; // safety guard

      // clone array ทั้งหมดของ userCardTable
      const updated = [...prev];

      // clone user ที่เราจะแก้ไข
      const targetUser = { ...updated[userIndex] };

      // clone aiModels ของ user นั้น
      const aiModels = [...targetUser.aiModels];

      // แก้ไขค่า token ของโมเดลที่เลือก
      aiModels[aiIndex] = {
        ...aiModels[aiIndex],
        token: newValue,
      };

      // เซ็ต aiModels กลับเข้า user
      targetUser.aiModels = aiModels;

      // เซ็ต user กลับเข้า array เดิม
      updated[userIndex] = targetUser;

      return updated; // ✅ React จะ re-render ด้วย state ใหม่
    });
  };

  const handleReset = () => {
    setResetTrigger((prev) => prev + 1); // ✅ trigger ให้ useEffect ทำงานใหม่
  };

  const handleSubmit = async () => {
    try {
      // ✅ แปลง aiModels ใน userCardTable ให้ตรงกับ input schema
      const formattedAiInput =
        userCardTable[0]?.aiModels?.map((ai) => ({
          ai_id: ai.ai_id, // 👈 แปลง model name → ai_id ที่ backend ใช้
          token_count: ai.token,
          activity: ai.active,
        })) || [];

      // ✅ เรียก mutation ไป backend
      const { data } = await updateUser({
        variables: {
          id, // ต้องตรงกับ schema
          input: {
            user_ai: formattedAiInput, // เปลี่ยนเฉพาะ field นี้
          },
        },
      });

      console.log("✅ Update success:", data.updateUser);
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <Box sx={{ p: isMobile ? 0 : 3 }}>
      <ActionBar
        onSubmit={() => handleSubmit()}
        onClearData={() => handleReset()}
        viewMode={viewMode}
        onViewChange={handleViewChange}
      />
      {viewMode === "card" ? (
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
            <UserInfoCard user={userCardTable[0]} />
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
            {userCardTable[0]?.aiModels?.map((ai, index) => (
              <TokenLimitCard
                key={index}
                title={
                  ai.model === "gpt-4o"
                    ? "ChatGPT 4o"
                    : ai.model === "gemini-2.5-pro"
                    ? "Gemini 2.5 Pro"
                    : ai.model
                }
                label={t("label1")}
                value={ai.token}
                onChange={(newValue) => handleTokenChange(0, index, newValue)} // ✅ ใช้ฟังก์ชันแยก
              />
            ))}
          </Box>

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
      ) : (
        <Box
          sx={{
            border: "1px solid #E5E7EB",
            boxShadow: "0 3px 8px rgba(0,0,0,0.04)",
            borderRadius: 3,
            p: isMobile ? 1.5 : 2,
            mb: 2,
            bgcolor: "background.paper",
          }}
        >
          <Box
            sx={{
              width: "100%",
              overflowX: "auto", // ✅ เลื่อนแนวนอนได้
              overflowY: "hidden",
              maxWidth: isMobile ? "80vw" : isTablet ? "85vw" : !open ? "85vw" : "70vw", // ✅ จำกัดไม่ให้เกินหน้าจอ
            }}
          >
            <TableContainer
              component={Paper}
              sx={{
                mt: 3,
                borderRadius: 2,
                display: "inline-block", // ✅ ป้องกันตารางยืดเกิน container
              }}
            >
              <Table stickyHeader>
                {/* ✅ ให้หัวตารางค้างไว้เมื่อเลื่อน */}
                <TableHead>
                  <TableRow>
                    <TableCell>
                      <b>{t("tablecell1")}</b>
                    </TableCell>
                    <TableCell>
                      <b>{t("tablecell2")}</b>
                    </TableCell>
                    <TableCell>
                      <b>{t("tablecell3")}</b>
                    </TableCell>
                    <TableCell>
                      <b>{t("tablecell4")}</b>
                    </TableCell>
                    <TableCell>
                      <b>{t("tablecell5")}</b>
                    </TableCell>
                    <TableCell>
                      <b>{t("tablecell6")}</b>
                    </TableCell>
                    {/* ✅ สร้างหัวคอลัมน์ตาม aiModels */}
                    {Array.from(
                      new Set(
                        userCardTable
                          .flatMap((u) => u.aiModels?.map((ai) => ai.model) || [])
                      )
                    ).map((modelName) => (
                      <TableCell key={modelName}>
                        <b>
                          {modelName === "gpt-4o"
                            ? "ChatGPT 4o"
                            : modelName === "gemini-2.5-pro"
                            ? "Gemini 2.5 Pro"
                            : modelName}
                        </b>
                      </TableCell>
                    ))}
                    {/* ✅ สร้างหัวคอลัมน์ตาม aiModels */}
                    {Array.from(
                      new Set(
                        userCardTable
                          .flatMap((u) => u.aiModels?.map((ai) => ai.model) || [])
                      )
                    ).map((modelName) => (
                      <TableCell key={modelName}>
                        <b>
                          {modelName === "gpt-4o"
                            ? "ChatGPT 4o"
                            : modelName === "gemini-2.5-pro"
                            ? "Gemini 2.5 Pro"
                            : modelName}
                        </b>
                      </TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {userCardTable.map((user) => (
                    <TableRow key={user.id} hover>
                      <TableCell>{user.username}</TableCell>
                      <TableCell>
                        <Typography>{user.name}</Typography>
                        <Typography variant="body2" color="text.secondary">
                          {user.email}
                        </Typography>
                      </TableCell>
                      <TableCell>{user.position}</TableCell>
                      <TableCell>{user.phone}</TableCell>

                      <TableCell>
                        <Chip
                          label={user.status}
                          sx={{
                            bgcolor:
                              user.status === "ใช้งานอยู่"
                                ? "#E6F7E6"
                                : "#E0E0E0",
                            color:
                              user.status === "ใช้งานอยู่" ? "green" : "gray",
                            fontWeight: 500,
                          }}
                        />
                      </TableCell>

                      <TableCell>
                        <Chip
                          label={user.group}
                          size="small"
                          sx={{
                            bgcolor: "#ECEFF1",
                            color: "#37474F",
                            fontWeight: 500,
                          }}
                        />
                      </TableCell>

                      {/* ✅ วนลูปช่อง Token limit จาก aiModels */}
                      {user.aiModels.map((ai, aiIndex) => (
                        <TableCell key={ai.model}>
                          <Typography variant="subtitle2" color="text.secondary">
                            {t("label1")}
                          </Typography>
                          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                            <TextField
                              type="number"
                              value={ai.token || 0}
                              inputProps={{ step:1000, style: { textAlign: "right" } }}
                              fullWidth
                              sx={{
                                "& .MuiOutlinedInput-root": { borderRadius: 2 },
                                "& input": { color: "#757575", fontWeight: 500 },
                                width: "180px",
                              }}
                              onChange={(e) =>
                                handleTokenChange(0, aiIndex, Number(e.target.value))
                              } // ✅ เรียกฟังก์ชันอัปเดต state
                            />
                          </Box>
                        </TableCell>
                      ))}  

                      {/* Progress ChatGPT5 */}
                      <TableCell>
                        <Box sx={{ width: 150 }}>
                          <Typography variant="body2" sx={{ mb: 0.5 }}>
                            {user.chatgpt5Used.toLocaleString()} /
                            {user.chatgpt5Max.toLocaleString()} Tokens
                          </Typography>
                          <LinearProgress
                            variant="determinate"
                            value={(user.chatgpt5Used / user.chatgpt5Max) * 100}
                            sx={{
                              bgcolor: "#e3f2fd",
                              "& .MuiLinearProgress-bar": {
                                bgcolor:
                                  (user.chatgpt5Used / user.chatgpt5Max) *
                                    100 >=
                                  86
                                    ? "#E53935" // สีแดงเมื่อเปอร์เซ็นต์ >= 86%
                                    : (user.chatgpt5Used / user.chatgpt5Max) *
                                        100 >=
                                      70
                                    ? "#FFA726" // สีส้มเมื่อเปอร์เซ็นต์อยู่ในช่วง 70% - 85%
                                    : "#3E8EF7", // สีฟ้าตามปกติ
                              },
                            }}
                          />
                        </Box>
                      </TableCell>

                      {/* Progress Gemini */}
                      <TableCell>
                        <Box sx={{ width: 150 }}>
                          <Typography variant="body2" sx={{ mb: 0.5 }}>
                            {user.geminiUsed.toLocaleString()} /
                            {user.geminiMax.toLocaleString()} Tokens
                          </Typography>
                          <LinearProgress
                            variant="determinate"
                            value={(user.geminiUsed / user.geminiMax) * 100}
                            sx={{
                              bgcolor: "#e3f2fd",
                              "& .MuiLinearProgress-bar": {
                                bgcolor:
                                  (user.geminiUsed / user.geminiMax) * 100 >= 86
                                    ? "#E53935" // สีแดงเมื่อเปอร์เซ็นต์ >= 86%
                                    : (user.geminiUsed / user.geminiMax) *
                                        100 >=
                                      70
                                    ? "#FFA726" // สีส้มเมื่อเปอร์เซ็นต์อยู่ในช่วง 70% - 85%
                                    : "#3E8EF7", // สีฟ้าตามปกติ
                              },
                            }}
                          />
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        </Box>
      )}
    </Box>
  );
}
