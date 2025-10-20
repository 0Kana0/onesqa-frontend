"use client";

import React, { useState, useEffect } from "react";
import { useMutation, useQuery } from "@apollo/client/react";
import { GET_LOGS } from "@/graphql/log/queries";
import { DELETE_LOGS } from "@/graphql/log/mutations";
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
  CircularProgress,
  useMediaQuery,
} from "@mui/material";
import dayjs from "dayjs"; // ✅ เพิ่มบรรทัดนี้
import DeleteIcon from "@mui/icons-material/Delete";
import UserTableToolbar from "@/app/components/UserTableToolbar";
import Swal from "sweetalert2";
import { useTheme } from "next-themes";
import { useTranslations } from "next-intl";
import { exportLogsToExcel } from "@/util/exportToExcel";

const LogPage = () => {
  const t = useTranslations("LogPage");
  const tInit = useTranslations("Init");
  const tDelete = useTranslations("DeleteAlert"); // สำหรับข้อความลบ

  const isMobile = useMediaQuery("(max-width:600px)"); // < md คือจอเล็ก
  const isTablet = useMediaQuery("(max-width:1200px)"); // < md คือจอเล็ก

  const {
    data: logsData,
    loading: logsLoading,
    error: logsError,
  } = useQuery(GET_LOGS);

  const [deleteLogs] = useMutation(DELETE_LOGS);

  const [logFilter, setLogFilter] = useState("หัวข้อการ Logs แก้ไข");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [page, setPage] = useState(1);
  const rowsPerPage = 5; // ✅ แสดง 5 แถวต่อหน้า
  const { theme } = useTheme();

  const [logRows, setLogRows] = useState([
    // {
    //   time: "2024-01-15 14:30:25",
    //   name: "นายสมชาย ใจดี",
    //   topic: "กำหนดแนวทางการตั้งคำถาม",
    //   old: "มาตรฐานการประเมินคุณภาพภายนอกคืออะไร?",
    //   new: "เกณฑ์การให้คะแนนการประเมินเป็นอย่างไร?",
    // },
    // {
    //   time: "2024-01-15 14:25:10",
    //   name: "นางสาวมาลี สวยมาก",
    //   topic: "กำหนด Tokens ผู้ใช้งาน (นายสมชาย ใจดี)",
    //   old: "50,000 (ChatGPT 4o)",
    //   new: "100,000 (ChatGPT 4o)",
    // },
    // {
    //   time: "2024-01-15 14:15:30",
    //   name: "นายวิชัย เก่งมาก",
    //   topic: "กำหนด AI Access",
    //   old: "ไม่อนุญาต",
    //   new: "อนุญาต",
    // },
    // {
    //   time: "2024-01-15 14:15:30",
    //   name: "นายวิชัย เก่งมาก",
    //   topic: "ตั้งค่าการแจ้งเตือน",
    //   old: (
    //     <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
    //       <span>การแจ้งเตือนระบบ</span>
    //       <Switch checked disabled />
    //     </Box>
    //   ),
    //   new: (
    //     <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
    //       <span>การแจ้งเตือนระบบ</span>
    //       <Switch disabled />
    //     </Box>
    //   ),
    // },
  ]);

  useEffect(() => {
    if (!logsData?.logs.length) return;

    const transformed = logsData.logs.map((log) => {
      const formattedTime = dayjs(log.createdAt).format("YYYY-MM-DD HH:mm:ss");

      // แปลง log_type เป็น topic
      let topic = "";
      if (log.log_type === "PROMPT") topic = "กำหนดแนวทางการตั้งคำถาม";
      else if (log.log_type === "ALERT") topic = "ตั้งค่าการแจ้งเตือน";
      else if (log.log_type === "MODEL") topic = "ตั้งค่า Model";
      else topic = log.log_type;

      // แปลง old/new
      let oldValue = log.old_data;
      let newValue = log.new_data;

      // ถ้าเป็น ALERT ให้แสดงเป็น Switch
      if (log.log_type === "ALERT") {
        oldValue = (
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <span>{log.old_data}</span>
            <Switch checked={!!log.old_status} disabled />
          </Box>
        );
        newValue = (
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <span>{log.new_data}</span>
            <Switch checked={!!log.new_status} disabled />
          </Box>
        );
      }

      return {
        time: formattedTime,
        name: log.edit_name,
        topic,
        old: oldValue,
        new: newValue,
      };
    });

    setLogRows(transformed);
  }, [logsData]);

  if (logsLoading)
    return (
      <Box sx={{ textAlign: "center", mt: 5 }}>
        <CircularProgress />
        <Typography>{tInit("loading")}...</Typography>
      </Box>
    );

  if (logsError)
    return (
      <Typography color="error" sx={{ mt: 5 }}>
        ❌ {tInit("error")}
      </Typography>
    );

  //console.log(logsData);
  //console.log(JSON.stringify(logsData.logs, null, 2));
  console.log(JSON.stringify(logRows, null, 2));

  // 🔹 ฟังก์ชันกรองข้อมูล
  const filteredLogs = logRows.filter((log) => {
    const matchesLog =
      logFilter === "หัวข้อการ Logs แก้ไข" || log.topic.includes(logFilter);

    // --- แปลงวันที่ใน record ---
    const logDate = new Date(dayjs(log.time).format("YYYY-MM-DD"));

    // --- ถ้ามี startDate / endDate ให้กรองตามนั้น ---
    const isAfterStart = startDate ? logDate >= new Date(startDate) : true;
    const isBeforeEnd = endDate ? logDate <= new Date(endDate) : true;

    // ✅ เงื่อนไขรวมทั้งหมด (สามารถเพิ่ม filter อื่นได้)
    return isAfterStart && isBeforeEnd && matchesLog;
  });

  // ✅ แบ่งข้อมูลตามหน้า
  const paginatedLogs = filteredLogs.slice(
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
      }).then(async (result) => {
        if (result.isConfirmed) {
          setLogRows([]); // ✅ ลบข้อมูลทั้งหมด

          try {
            // ✅ เรียก mutation ไป backend
            const { data } = await deleteLogs();
            console.log("✅ Delete success:", data.deleteLogs);
          } catch (error) {
            console.log(error);
          }

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
      }).then(async (result) => {
        if (result.isConfirmed) {
          setLogRows([]); // ✅ ลบข้อมูลทั้งหมด
          
          try {
            // ✅ เรียก mutation ไป backend
            const { data } = await deleteLogs();
            console.log("✅ Delete success:", data.deleteLogs);
          } catch (error) {
            console.log(error);
          }

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

  const handleExportExcel = () => {
    const transformed = logRows.map((row) => {
      // 🧠 กำหนดค่า oldData/newData เริ่มต้น
      let oldData = row.old;
      let newData = row.new;

      // ✅ ตรวจว่ามี Switch หรือไม่ (React element)
      if (typeof row.old === "object" && row.topic.includes("แจ้งเตือน")) {
        oldData = "การแจ้งเตือนระบบ ❌"; // old switch checked
        newData = "การแจ้งเตือนระบบ ✅"; // new switch unchecked
      }

      // ✅ ถ้าค่าเป็น JSX หรือ object อื่นๆ ให้ดึงข้อความออก
      if (typeof oldData === "object") oldData = "ไม่ทราบค่าเดิม";
      if (typeof newData === "object") newData = "ไม่ทราบค่าใหม่";

      return {
        time: row.time,
        name: row.name,
        topic: row.topic,
        oldData,
        newData,
      };
    });

    console.log(transformed);

    exportLogsToExcel(transformed)
  }

  return (
    <div>
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
                  {paginatedLogs.map((row, i) => (
                    <TableRow key={i}>
                      <TableCell>{row.time}</TableCell>
                      <TableCell>{row.name}</TableCell>
                      <TableCell>{row.topic}</TableCell>
                      <TableCell>{row.old}</TableCell>
                      <TableCell>{row.new}</TableCell>
                    </TableRow>
                  ))}

                  {/* ถ้าไม่มีข้อมูล */}
                  {paginatedLogs.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                        ไม่พบข้อมูล
                      </TableCell>
                    </TableRow>
                  )}
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
                count={Math.ceil(filteredLogs.length / rowsPerPage)}
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
