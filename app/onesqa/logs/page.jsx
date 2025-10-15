"use client";

import React, { useState } from "react";
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
  Button,
  Switch,
  useMediaQuery,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import UserTableToolbar from "@/app/components/UserTableToolbar";
import Swal from "sweetalert2";
import { useTheme } from "next-themes";
import { useTranslations } from "next-intl";

const LogPage = () => {
  const t = useTranslations("LogPage");
  const tDelete = useTranslations("DeleteAlert"); // สำหรับข้อความลบ

  const isMobile = useMediaQuery("(max-width:600px)"); // < md คือจอเล็ก
  const isTablet = useMediaQuery("(max-width:1200px)"); // < md คือจอเล็ก

  const [logFilter, setLogFilter] = useState("หัวข้อการ Logs แก้ไข");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [page, setPage] = useState(1);
  const rowsPerPage = 5; // ✅ แสดง 5 แถวต่อหน้า
  const { theme } = useTheme();

  const [logRows, setLogRows] = useState([
    {
      time: "2024-01-15 14:30:25",
      name: "นายสมชาย ใจดี",
      topic: "กำหนดแนวทางการตั้งคำถาม",
      old: "มาตรฐานการประเมินคุณภาพภายนอกคืออะไร?",
      new: "เกณฑ์การให้คะแนนการประเมินเป็นอย่างไร?",
    },
    {
      time: "2024-01-15 14:25:10",
      name: "นางสาวมาลี สวยมาก",
      topic: "กำหนด Tokens ผู้ใช้งาน (นายสมชาย ใจดี)",
      old: "50,000 (ChatGPT 4o)",
      new: "100,000 (ChatGPT 4o)",
    },
    {
      time: "2024-01-15 14:15:30",
      name: "นายวิชัย เก่งมาก",
      topic: "กำหนด AI Access",
      old: "ไม่อนุญาต",
      new: "อนุญาต",
    },
    {
      time: "2024-01-15 14:15:30",
      name: "นายวิชัย เก่งมาก",
      topic: "ตั้งค่าการแจ้งเตือน",
      old: (
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <span>การแจ้งเตือนระบบ</span>
          <Switch checked disabled />
        </Box>
      ),
      new: (
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <span>การแจ้งเตือนระบบ</span>
          <Switch disabled />
        </Box>
      ),
    },
  ]);

  // 🔹 ฟังก์ชันกรองข้อมูล
  const filteredUsers = logRows.filter((user) => {
    const matchesLog =
      logFilter === "หัวข้อการ Logs แก้ไข" || user.topic.includes(logFilter);

    // --- แปลงวันที่ใน record ---
    const userDate = new Date(user.time);

    // --- ถ้ามี startDate / endDate ให้กรองตามนั้น ---
    const isAfterStart = startDate ? userDate >= new Date(startDate) : true;
    const isBeforeEnd = endDate ? userDate <= new Date(endDate) : true;

    // ✅ เงื่อนไขรวมทั้งหมด (สามารถเพิ่ม filter อื่นได้)
    return isAfterStart && isBeforeEnd && matchesLog;
  });

  // ✅ แบ่งข้อมูลตามหน้า
  const paginatedUsers = filteredUsers.slice(
    (page - 1) * rowsPerPage,
    page * rowsPerPage
  );

  // ✅ เมื่อเปลี่ยนหน้า
  const handleChangePage = (event, value) => {
    setPage(value);
  };

  // ปุ่มล้างตัวกรองทั้งหมด
  const handleClearFilters = () => {
    setLogFilter("หัวข้อการ Logs แก้ไข"); // กลับไปค่าหมวดหมู่เริ่มต้น
    setStartDate(""); // ล้างวันที่เริ่ม
    setEndDate(""); // ล้างวันที่สิ้นสุด
    console.log("🧹 ล้างตัวกรองเรียบร้อย");
  };

  // ✅ ฟังก์ชันลบทั้งหมดพร้อม SweetAlert2
  const handleDeleteAll = () => {
    if (theme === "dark") {
      Swal.fire({
        title: tDelete("title1"),
        text: tDelete("text1"),
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#d33", // สีแดงสำหรับปุ่มยืนยัน
        cancelButtonColor: "#3E8EF7",
        confirmButtonText: tDelete("confirm"),
        cancelButtonText: tDelete("cancel"),
        background: "#2F2F30", // สีพื้นหลังดำ
        color: "#fff", // สีข้อความเป็นขาว
        titleColor: "#fff", // สี title เป็นขาว
        textColor: "#fff", // สี text เป็นขาว
      }).then((result) => {
        if (result.isConfirmed) {
          setLogRows([]); // ✅ ลบข้อมูลทั้งหมด
          Swal.fire({
            title: tDelete("title2"),
            text: tDelete("text2"),
            icon: "success",
            confirmButtonColor: "#3E8EF7",
            background: "#2F2F30", // สีพื้นหลังดำ
            color: "#fff", // สีข้อความเป็นขาว
            titleColor: "#fff", // สี title เป็นขาว
            textColor: "#fff", // สี text เป็นขาว
          });
        }
      });
    } else {
      Swal.fire({
        title: tDelete("title1"),
        text: tDelete("text1"),
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#d33", // สีแดงสำหรับปุ่มยืนยัน
        cancelButtonColor: "#3E8EF7",
        confirmButtonText: tDelete("confirm"),
        cancelButtonText: tDelete("cancel"),
      }).then((result) => {
        if (result.isConfirmed) {
          setLogRows([]); // ✅ ลบข้อมูลทั้งหมด
          Swal.fire({
            title: tDelete("title2"),
            text: tDelete("text2"),
            icon: "success",
            confirmButtonColor: "#3E8EF7",
          });
        }
      });
    }
  };

  return (
    <div>
      <Box sx={{ p: isMobile ? 0 : 3 }}>
        <UserTableToolbar
          onRefresh={() => console.log("🔄 เชื่อมต่อข้อมูลผู้ใช้งาน")}
          onExport={() => console.log("⬇️ ส่งออกไฟล์ Excel")}
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
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {t("filter2")}
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
            <Select
              value={logFilter}
              onChange={(e) => setLogFilter(e.target.value)}
              size="small"
              sx={{ width: isTablet ? "100%" : "none", flex: 1 }}
            >
              <MenuItem value="หัวข้อการ Logs แก้ไข">
                หัวข้อการ Logs แก้ไข
              </MenuItem>
              <MenuItem value="กำหนดแนวทางการตั้งคำถาม">
                กำหนดแนวทางการตั้งคำถาม
              </MenuItem>
              <MenuItem value="กำหนด Tokens ผู้ใช้งาน ">
                กำหนด Tokens ผู้ใช้งาน
              </MenuItem>
              <MenuItem value="กำหนด AI Access">กำหนด AI Access</MenuItem>
              <MenuItem value="ตั้งค่าการแจ้งเตือน">
                ตั้งค่าการแจ้งเตือน
              </MenuItem>
            </Select>

            {/* วันที่เริ่มต้น */}
            <TextField
              label={t("startDate")}
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              size="small"
              sx={{ width: isTablet ? "100%" : 200 }}
              InputLabelProps={{ shrink: true }}
            />

            {/* วันที่สิ้นสุด */}
            <TextField
              label={t("endDate")}
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              size="small"
              sx={{ width: isTablet ? "100%" : 200 }}
              InputLabelProps={{ shrink: true }}
            />
          </Box>
        </Box>

        <Box
          elevation={1}
          sx={{
            border: "1px solid #E5E7EB",
            boxShadow: "0 3px 8px rgba(0,0,0,0.04)",
            borderRadius: 3,
            p: isMobile ? 1.5 : 2,
            bgcolor: "background.paper",
          }}
        >
          {/* Header */}
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              flexDirection: isTablet ? "column" : "row", // ✅ สลับแนวตามจอ
              alignItems: isTablet ? "flex-start" : "center",
              mb: 2,
              gap: 1,
            }}
          >
            <Box>
              <Typography variant="h6" fontWeight={700}>
                {t("table1")}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {t("table2")}
              </Typography>
            </Box>
            <Button
              variant="contained"
              color="error"
              startIcon={<DeleteIcon />}
              sx={{ width: isTablet ? "100%" : "none", borderRadius: 2 }}
              onClick={() => handleDeleteAll()}
            >
              {t("button1")}
            </Button>
          </Box>

          {/* Table */}
          <Box
            sx={{
              width: "100%",
              overflowX: "auto", // ✅ เลื่อนแนวนอนได้
              overflowY: "hidden",
              maxWidth: isMobile ? "80vw" : isTablet ? "85vw" : "90vw", // ✅ จำกัดไม่ให้เกินหน้าจอ
            }}
          >
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow sx={{ bgcolor: "background.default" }}>
                    <TableCell sx={{ fontWeight: 600 }}>
                      {t("tablecell1")}
                    </TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>
                      {t("tablecell2")}
                    </TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>
                      {t("tablecell3")}
                    </TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>
                      {t("tablecell4")}
                    </TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>
                      {t("tablecell5")}
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {paginatedUsers.map((row, i) => (
                    <TableRow key={i}>
                      <TableCell>{row.time}</TableCell>
                      <TableCell>{row.name}</TableCell>
                      <TableCell>{row.topic}</TableCell>
                      <TableCell>{row.old}</TableCell>
                      <TableCell>{row.new}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            {/* Footer */}
            <Box
              sx={{
                display: "flex",
                justifyContent: "flex-end",
                alignItems: "center",
                mt: 2,
              }}
            >
              <Pagination
                count={Math.ceil(filteredUsers.length / rowsPerPage)}
                page={page}
                onChange={handleChangePage}
                color="primary"
              />
            </Box>
          </Box>
        </Box>
      </Box>
    </div>
  );
};

export default LogPage;
