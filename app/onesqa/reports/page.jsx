"use client";

import React, { useState, useEffect } from "react";
import { NetworkStatus } from "@apollo/client";
import { useMutation, useQuery, useApolloClient } from "@apollo/client/react";
import { GET_AIS } from "@/graphql/ai/queries";
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Select,
  MenuItem,
  Pagination,
  TextField,
  Avatar,
  Stack,
  Divider,
  CircularProgress,
  useMediaQuery,
} from "@mui/material";
import UserTableToolbar from "@/app/components/UserTableToolbar";
import TokenUsageCard from "@/app/components/TokenUsageCard";
import { useTranslations } from "next-intl";
import { exportReportsToExcel } from "@/util/exportToExcel";
import { useRequireRole } from "@/hook/useRequireRole";

const ReportPage = () => {
  const client = useApolloClient();
  const t = useTranslations("ReportPage");
  const tInit = useTranslations("Init");
  const isMobile = useMediaQuery("(max-width:600px)"); // < md คือจอเล็ก
  const isTablet = useMediaQuery("(max-width:1200px)"); // < md คือจอเล็ก

  const [aiFilter, setAiFilter] = useState("การใช้งาน AI Chatbot");
  const [quickRange, setQuickRange] = useState("เลือกช่วงเวลา");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [page, setPage] = useState(1);
  const rowsPerPage = 5; // ✅ แสดง 5 แถวต่อหน้า

  const reportRows = [
    {
      date: "2025-10-04",
      user: "นายสมชาย ใจดี",
      position: "เทคโนโลยีสารสนเทศ",
      chats: 15,
      tokens: 2500,
    },
    {
      date: "2025-10-05",
      user: "นางสาวมาลี สวยงาม",
      position: "การประเมินคุณภาพ",
      chats: 8,
      tokens: 1200,
    },
    {
      date: "2025-10-06",
      user: "นายวิชัย เก่งมาก",
      position: "การประเมินคุณภาพ",
      chats: 12,
      tokens: 1800,
    },
    {
      date: "2025-10-07",
      user: "นายวิชัย เก่งมาก",
      position: "การประเมินคุณภาพ",
      chats: 12,
      tokens: 1800,
    },
    {
      date: "2025-10-08",
      user: "นายวิชัย เก่งมาก",
      position: "การประเมินคุณภาพ",
      chats: 12,
      tokens: 1800,
    },
    {
      date: "2025-10-09",
      user: "นายวิชัย เก่งมาก",
      position: "การประเมินคุณภาพ",
      chats: 12,
      tokens: 1800,
    },
  ];
  const [totalCount, setTotalCount] = useState(0)

  const topUsers = [
    {
      rank: 1,
      name: "นางสาวรกมล สุมนเตมิย์",
      chats: 45,
      tokens: 7200,
      color: "#FFD1D1",
    },
    {
      rank: 2,
      name: "นางสาวสุภาพร ศิริฉัตร",
      chats: 32,
      tokens: 5100,
      color: "#FFEDB7",
    },
    {
      rank: 3,
      name: "นายสมชาย ใจดี",
      chats: 28,
      tokens: 4300,
      color: "#FFF6D4",
    },
    {
      rank: 4,
      name: "นางสาวมาลี สวยงาม",
      chats: 24,
      tokens: 4110,
      color: "#F9F9F9",
    },
    {
      rank: 5,
      name: "นายวิชัย เก่งมาก",
      chats: 20,
      tokens: 3800,
      color: "#F9F9F9",
    },
  ];

  const {
    data: aisData,
    loading: aisLoading,
    error: aisError,
  } = useQuery(GET_AIS, {
    fetchPolicy: "network-only",
  });

  const { allowed, loading, user } = useRequireRole({
    roles: ["ผู้ดูแลระบบ"],
    redirectTo: "/onesqa/chat",
  });
  
  if (loading) return null;     // หรือใส่ Skeleton ก็ได้
  if (!allowed) return null;    // ระหว่างกำลัง redirect กันไม่ให้แสดงหน้า

  if (aisLoading)
    return (
      <Box sx={{ textAlign: "center", mt: 5 }}>
        <CircularProgress />
        <Typography>{tInit("loading")}...</Typography>
      </Box>
    );

  if (aisError)
    return (
      <Typography color="error" sx={{ mt: 5 }}>
        ❌ {tInit("error")}
      </Typography>
    );

  console.log(aisData?.ais);

  // utils ช่วยคำนวณขอบเขตวันให้ครอบคลุมทั้งวัน
  const startOfDay = (d) => {
    const x = new Date(d);
    x.setHours(0, 0, 0, 0);
    return x;
  };
  const endOfDay = (d) => {
    const x = new Date(d);
    x.setHours(23, 59, 59, 999);
    return x;
  };

  // แปลงค่าดรอปดาวน์เป็นช่วงวัน
  const getRangeFromQuick = (range) => {
    const now = new Date();
    switch (range) {
      case "วันนี้": {
        return { start: startOfDay(now), end: endOfDay(now) };
      }
      case "7วันย้อนหลัง": {
        const s7 = new Date(now);
        s7.setDate(now.getDate() - 6); // รวมวันนี้ = 7 วัน
        return { start: startOfDay(s7), end: endOfDay(now) };
      }
      case "1เดือนย้อนหลัง": {
        const s30 = new Date(now);
        s30.setDate(now.getDate() - 29); // รวมวันนี้ ~30 วัน
        return { start: startOfDay(s30), end: endOfDay(now) };
      }
      default:
        return { start: null, end: null };
    }
  };

  // 🔹 ฟังก์ชันกรองข้อมูล
  // const filteredUsers = reportRows.filter((user) => {
  //   const userDate = new Date(user.date);

  //   // ช่วงเวลาจากดรอปดาวน์
  //   const quick = getRangeFromQuick(quickRange);

  //   // ถ้ามี startDate/endDate ที่เลือกเอง ให้มาก่อน; ไม่งั้นใช้ quick range
  //   const effectiveStart = startDate
  //     ? startOfDay(new Date(startDate))
  //     : quick.start;
  //   const effectiveEnd = endDate ? endOfDay(new Date(endDate)) : quick.end;

  //   const isAfterStart = effectiveStart ? userDate >= effectiveStart : true;
  //   const isBeforeEnd = effectiveEnd ? userDate <= effectiveEnd : true;

  //   return isAfterStart && isBeforeEnd;
  // });

  // ✅ เมื่อเปลี่ยนหน้า
  const handleChangePage = (event, value) => {
    setPage(value);
  };

  // ปุ่มล้างตัวกรองทั้งหมด
  const handleClearFilters = () => {
    setAiFilter("การใช้งาน AI Chatbot"); // กลับไปค่าหมวดหมู่เริ่มต้น
    setQuickRange("เลือกช่วงเวลา"); // รีเซ็ตดรอปดาวน์ช่วงเวลา
    setStartDate(""); // ล้างวันที่เริ่ม
    setEndDate(""); // ล้างวันที่สิ้นสุด
    setPage(1);
    console.log("🧹 ล้างตัวกรองเรียบร้อย");
  };

  const handleExportExcel = () => {
    exportReportsToExcel(reportRows);
  };

  return (
    <Box sx={{ p: isMobile ? 0 : 3 }}>
      <UserTableToolbar
        onRefresh={() => console.log("🔄 เชื่อมต่อข้อมูลผู้ใช้งาน")}
        onExport={() => handleExportExcel()}
        onClearFilters={handleClearFilters}
      />

      {/* 🧩 ส่วนกรองข้อมูล */}
      <Box
        sx={{
          border: "1px solid #E5E7EB",
          boxShadow: "0 3px 8px rgba(0,0,0,0.04)",
          borderRadius: 4,
          p: isMobile ? 1.5 : 2,
          bgcolor: "background.paper",
          mb: 2,
        }}
      >
        <Typography variant="h6" fontWeight="bold" sx={{ mb: 1 }}>
          {t("filter1")}
        </Typography>
        {/* 🔹 ส่วนค้นหาและกรองข้อมูล */}
        <Box
          sx={{
            display: "flex",
            flexDirection: isTablet ? "column" : "row", // ✅ สลับแนวตามจอ
            alignItems: isTablet ? "flex-start" : "center",
            gap: 2,
          }}
        >
          {/* <Select
            value={aiFilter}
            onChange={(e) => setAiFilter(e.target.value)}
            size="small"
            sx={{ width: isTablet ? "100%" : "none", flex: 1 }}
          >
            <MenuItem value="การใช้งาน AI Chatbot">
              การใช้งาน AI Chatbot
            </MenuItem>
            {/* <MenuItem value="ผู้ดูแลระบบ">ผู้ดูแลระบบ</MenuItem>
            <MenuItem value="เจ้าหน้าที่">เจ้าหน้าที่</MenuItem>
            <MenuItem value="ผู้ประเมินภายนอก">ผู้ประเมินภายนอก</MenuItem>
          </Select> */}

          <Select
            value={quickRange}
            onChange={(e) => {
              setQuickRange(e.target.value)
              setPage(1)
            }}
            size="small"
            sx={{ width: isTablet ? "100%" : "none", flex: 1 }}
          >
            <MenuItem value="เลือกช่วงเวลา">เลือกช่วงเวลา</MenuItem>
            <MenuItem value="วันนี้">วันนี้</MenuItem>
            <MenuItem value="7วันย้อนหลัง">7วันย้อนหลัง</MenuItem>
            <MenuItem value="1เดือนย้อนหลัง">1เดือนย้อนหลัง</MenuItem>
          </Select>

          {/* วันที่เริ่มต้น */}
          <TextField
            label={t("startDate")}
            type="date"
            value={startDate}
            onChange={(e) => {
              setStartDate(e.target.value)
              setPage(1)
            }}
            size="small"
            sx={{ width: isTablet ? "100%" : 200 }}
            InputLabelProps={{ shrink: true }}
          />

          {/* วันที่สิ้นสุด */}
          <TextField
            label={t("endDate")}
            type="date"
            value={endDate}
            onChange={(e) => {
              setEndDate(e.target.value)
              setPage(1)
            }}
            size="small"
            sx={{ width: isTablet ? "100%" : 200 }}
            InputLabelProps={{ shrink: true }}
          />
        </Box>
      </Box>

      {/* 🧾 ตารางข้อมูล */}
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
        <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5 }}>
          {t("title1")}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          {t("subtitle1")}
        </Typography>

        <Box
          sx={{
            width: "100%",
            overflowX: "auto", // ✅ เลื่อนแนวนอนได้
            overflowY: "hidden",
            maxWidth: isMobile ? "80vw" : isTablet ? "85vw" : "90vw", // ✅ จำกัดไม่ให้เกินหน้าจอ
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
              <TableHead sx={{ bgcolor: "background.default" }}>
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
                  <TableCell align="center">
                    <b>{t("tablecell4")}</b>
                  </TableCell>
                  <TableCell align="right">
                    <b>{t("tablecell5")}</b>
                  </TableCell>
                </TableRow>
              </TableHead>

              <TableBody>
                {reportRows.map((row, index) => (
                  <TableRow key={index} hover>
                    <TableCell>
                      {new Date(row.date).toLocaleDateString("en-GB", {
                        day: "numeric",
                        month: "numeric",
                        year: "numeric",
                      })}
                    </TableCell>
                    <TableCell>{row.user}</TableCell>
                    <TableCell>{row.position}</TableCell>
                    <TableCell align="center">{row.chats}</TableCell>
                    <TableCell align="right">
                      {row.tokens.toLocaleString()}
                    </TableCell>
                  </TableRow>
                ))}

                {/* ถ้าไม่มีข้อมูล */}
                {reportRows.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                      ไม่พบข้อมูล
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>

          {/* 📄 Pagination */}
          <Box
            sx={{
              display: "flex",
              justifyContent: "flex-end",
              alignItems: "center",
              mt: 2,
            }}
          >
            <Pagination
              count={Math.ceil(totalCount / rowsPerPage)}
              page={page}
              onChange={handleChangePage}
              color="primary"
            />
          </Box>
        </Box>
      </Box>

      <Box
        sx={{
          display: "flex",
          flexDirection: isTablet ? "column" : "row", // ✅ สลับแนวตามจอ
          alignItems: isTablet ? "flex-start" : "center",
        }}
      >
        <Box
          sx={{
            border: "1px solid #E5E7EB",
            boxShadow: "0 3px 8px rgba(0,0,0,0.05)",
            borderRadius: 4,
            p: isMobile ? 1.5 : 3,
            width: isTablet ? "100%" : "none",
            bgcolor: "background.paper",
            flex: 1,
          }}
        >
          {/* หัวข้อ */}
          <Typography variant="h6" fontWeight="bold">
            {t("title2")}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {t("subtitle2")}
          </Typography>

          {/* ลิสต์ผู้ใช้งาน */}
          <Stack spacing={1.5}>
            {topUsers.map((user) => (
              <Box
                key={user.rank}
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  p: 1.5,
                  borderRadius: 3,
                  bgcolor: "primary.minor",
                  border: "1px solid #F0F0F0",
                }}
              >
                {/* ด้านซ้าย: อันดับ + ชื่อ */}
                <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                  <Avatar
                    sx={{
                      bgcolor: user.color,
                      color: "#000",
                      fontWeight: "bold",
                      border: "1px solid #ddd",
                      width: 36,
                      height: 36,
                    }}
                  >
                    {user.rank}
                  </Avatar>
                  <Box>
                    <Typography fontWeight="bold">{user.name}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {user.chats} {t("conversations")}
                    </Typography>
                  </Box>
                </Box>

                {/* ด้านขวา: Tokens */}
                <Box textAlign="right">
                  <Typography fontWeight="bold">
                    {user.tokens.toLocaleString()}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Tokens
                  </Typography>
                </Box>
              </Box>
            ))}
          </Stack>
        </Box>

        <Box
          sx={{
            p: isMobile ? 1.5 : 3,
            width: isTablet ? "100%" : "none",
            bgcolor: "background.default",
            flex: 1,
          }}
        >
          {/* หัวข้อ */}
          <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>
            {t("title3")}
          </Typography>

          <Box
            sx={{
              display: "flex", // ใช้ flex layout
              flexDirection: "column", // ✅ เรียงในแนวตั้ง
              gap: 2, // ✅ ระยะห่างระหว่างการ์ด (theme.spacing * 2 = 16px)
            }}
          >
            {aisData?.ais?.map((ai) => (
              <TokenUsageCard
                key={ai.id}
                title={
                  ai.model_name === "gpt-4o"
                    ? "ChatGPT 4o"
                    : ai.model_name === "gemini-2.5-pro"
                    ? "Gemini 2.5 Pro"
                    : ai.model_name
                }
                remain={ai.token_count}
                total={ai.token_all}
                today={ai.today}
                average={ai.average}
              />
            ))}
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default ReportPage;
