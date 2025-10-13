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
  useMediaQuery
} from "@mui/material";
import { useParams } from "next/navigation";
import UserInfoCard from "@/app/components/UserInfoCard";
import TokenLimitCard from "@/app/components/TokenLimitCard";
import TokenUsageCard from "@/app/components/TokenUsageCard";
import ActionBar from "@/app/components/ActionBar";
import { useTranslations } from 'next-intl';

export default function UserDetailPage() {
  const params = useParams();
  const { id } = params;
  const t = useTranslations('UserDetailPage');

  const isMobile = useMediaQuery("(max-width:600px)"); // < md คือจอเล็ก

  // mock data (จริง ๆ สามารถดึงจาก GraphQL ได้)
  const user = {
    id,
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
      geminiUsed: 150000,
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
    <Box sx={{ p: isMobile ? 0 : 3 }}>
      <ActionBar
        onSubmit={() => console.log("⬇️ ส่งออกไฟล์ Excel")}
        onClearData={() => console.log("⬇️ ส่งออกไฟล์ Excel")}
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
              p: isMobile ? 1 : 2,
              position: "relative",
              zIndex: 1,
            }}
          >
            <TokenLimitCard
              title="Gemini 2.5 Pro"
              label={t("label1")}
              value={geminiTokens}
              onChange={setGeminiTokens}
            />
            <TokenLimitCard
              title="ChatGPT 4o"
              label={t("label1")}
              value={chatgptTokens}
              onChange={setChatgptTokens}
            />
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
            width: "100%",
            overflowX: "auto", // ✅ เลื่อนแนวนอนได้
            overflowY: "hidden",
            maxWidth: "90vw", // ✅ จำกัดไม่ให้เกินหน้าจอ
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
                  <TableCell>
                    <b>ChatGPT5</b>
                  </TableCell>
                  <TableCell>
                    <b>Gemini 2.5 Pro</b>
                  </TableCell>
                  <TableCell>
                    <b>ChatGPT5</b>
                  </TableCell>
                  <TableCell>
                    <b>Gemini 2.5 Pro</b>
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id} hover>
                    <TableCell>{user.id}</TableCell>
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
                        label={user.role}
                        sx={{
                          bgcolor:
                            user.role === "ผู้ดูแลระบบ"
                              ? "#FCE4EC"
                              : user.role === "ผู้ประเมินภายนอก"
                              ? "#E3F2FD"
                              : "#FFF3E0",
                          color:
                            user.role === "ผู้ดูแลระบบ"
                              ? "#D81B60"
                              : user.role === "ผู้ประเมินภายนอก"
                              ? "#1976D2"
                              : "#F57C00",
                          fontWeight: 500,
                        }}
                      />
                    </TableCell>

                    {/* ChatGPT5 limit */}
                    <TableCell>
                      <TextField
                        type="number"
                        value={user.chatgptTokens || 0}
                        inputProps={{ style: { textAlign: "right" } }}
                        fullWidth
                        sx={{
                          "& .MuiOutlinedInput-root": { borderRadius: 2 },
                          "& input": { color: "#757575", fontWeight: 500 },
                        }}
                      />
                    </TableCell>

                    {/* Gemini limit */}
                    <TableCell>
                      <TextField
                        type="number"
                        value={user.geminiTokens || 0}
                        inputProps={{ style: { textAlign: "right" } }}
                        fullWidth
                        sx={{
                          "& .MuiOutlinedInput-root": { borderRadius: 2 },
                          "& input": { color: "#757575", fontWeight: 500 },
                        }}
                      />
                    </TableCell>

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
                                (user.chatgpt5Used / user.chatgpt5Max) * 100 >=
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
                                  : (user.geminiUsed / user.geminiMax) * 100 >=
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
      )}
    </Box>
  );
}
