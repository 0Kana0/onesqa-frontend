"use client";

import React, { useState, useEffect } from "react";
import { NetworkStatus } from "@apollo/client";
import { useMutation, useQuery, useApolloClient } from "@apollo/client/react";
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

const mapLogFilterToType = (label) => {
  switch (label) {
    case "กำหนดแนวทางการตั้งคำถาม": return "PROMPT";
    case "ตั้งค่าการแจ้งเตือน": return "ALERT";
    case "ตั้งค่า Model": return "MODEL";
    case "ตั้งค่า Model ของผู้ใช้งาน": return "PERSONAL";
    case "ตั้งค่า Model ของกลุ่มงาน": return "GROUP";
    default: return null; // "หัวข้อการ Logs แก้ไข" = ทั้งหมด
  }
};

const mapTypeToLogFilter = (label) => {
  switch (label) {
    case "PROMPT": return "กำหนดแนวทางการตั้งคำถาม";
    case "ALERT": return "ตั้งค่าการแจ้งเตือน";
    case "MODEL": return "ตั้งค่า Model";
    case "PERSONAL": return "ตั้งค่า Model ของผู้ใช้งาน";
    case "GROUP": return "ตั้งค่า Model ของกลุ่มงาน";
    default: return null; // "หัวข้อการ Logs แก้ไข" = ทั้งหมด
  }
};

const LogPage = () => {
  const client = useApolloClient();
  const t = useTranslations("LogPage");
  const tInit = useTranslations("Init");
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
  const [totalCount, setTotalCount] = useState(0)

  const {
    data: logsData,
    loading: logsLoading,
    error: logsError,
    networkStatus
  } = useQuery(GET_LOGS, {
    fetchPolicy: "cache-and-network",
    notifyOnNetworkStatusChange: true,
    variables: {
      page: page, 
      pageSize: rowsPerPage,
      where: {
        logType: mapLogFilterToType(logFilter),
        startDate: startDate,
        endDate: endDate
      }
    },
  });

  const [deleteLogs] = useMutation(DELETE_LOGS);

  useEffect(() => {
    //console.log(logsData?.logs?.totalCount);
    if (!logsData?.logs?.items.length) {
      setLogRows([]);
      setTotalCount(0);
      
      return;
    } 

    const transformed = logsData.logs.items.map((log) => {
      const formattedTime = dayjs(log.createdAt).format("YYYY-MM-DD HH:mm:ss");

      // แปลง log_type เป็น topic
      let topic = mapTypeToLogFilter(log.log_type);

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

      // helper ไว้ใช้ซ้ำ
      const toApprovalText = (v) => {
        if (v === true || v === 'true' || v === 1 || v === '1') return 'อนุมัติ';
        if (v === false || v === 'false' || v === 0 || v === '0') return 'ไม่อนุมัติ';
        return v == null ? '' : String(v); // กัน null/undefined
      };

      if (log.log_type === 'MODEL' || log.log_type === 'PERSONAL') {
        oldValue = log.old_data + " " + toApprovalText(log.old_status);
        newValue = log.new_data + " " + toApprovalText(log.new_status);
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
    setTotalCount(logsData?.logs?.totalCount)
  }, [logsData]);

  // โชว์โหลดเฉพาะ "ครั้งแรกจริง ๆ" (ยังไม่มี data)
  const isInitialLoading =
    networkStatus === NetworkStatus.loading && !logsData;

  // ก่อนหน้าเคยเขียน if (logsLoading) return ... → เปลี่ยนเป็นเช็ค isInitialLoading
  if (isInitialLoading) 
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
  //console.log(JSON.stringify(logRows, null, 2));
  //console.log(logRows, logsData?.logs?.items.length);
  //console.log(logsData?.logs?.totalCount / rowsPerPage);
  //console.log(totalCount);

  // 🔹 ฟังก์ชันกรองข้อมูล
  // const filteredLogs = logRows.filter((log) => {
  //   const matchesLog =
  //     logFilter === "หัวข้อการ Logs แก้ไข" || log.topic.includes(logFilter);

  //   // --- แปลงวันที่ใน record ---
  //   const logDate = new Date(dayjs(log.time).format("YYYY-MM-DD"));

  //   // --- ถ้ามี startDate / endDate ให้กรองตามนั้น ---
  //   const isAfterStart = startDate ? logDate >= new Date(startDate) : true;
  //   const isBeforeEnd = endDate ? logDate <= new Date(endDate) : true;

  //   // ✅ เงื่อนไขรวมทั้งหมด (สามารถเพิ่ม filter อื่นได้)
  //   return isAfterStart && isBeforeEnd && matchesLog;
  // });

  // ✅ เมื่อเปลี่ยนหน้า
  const handleChangePage = (event, value) => {
    setPage(value);
  };

  // ปุ่มล้างตัวกรองทั้งหมด
  const handleClearFilters = () => {
    setLogFilter("หัวข้อการ Logs แก้ไข"); // กลับไปค่าหมวดหมู่เริ่มต้น
    setStartDate(""); // ล้างวันที่เริ่ม
    setEndDate(""); // ล้างวันที่สิ้นสุด
    setPage(1);
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
          setTotalCount(0);

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
          setTotalCount(0);
          
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

  const handleExportExcel = async () => {
    // เรียกแบบไม่ส่ง variables (ใช้ค่า default ของ schema)
    const { data } = await client.query({
      query: GET_LOGS,
      fetchPolicy: "network-only",
    });

    //console.log(data);
    //console.log(data?.logs?.items);
    
    const lowRowExcel = data?.logs?.items ?? [];

    const toApprovalText = (v) => {
      if (v === true || v === "true" || v === 1 || v === "1") return "อนุมัติ";
      if (v === false || v === "false" || v === 0 || v === "0") return "ไม่อนุมัติ";
      return v == null ? "" : String(v);
    };

    const payload = lowRowExcel.map((log) => {
      const time = dayjs(log.createdAt).format("YYYY-MM-DD HH:mm:ss");
      const topic = typeof mapTypeToLogFilter === "function"
        ? mapTypeToLogFilter(log.log_type)
        : log.log_type;

      if (log.log_type === "ALERT") {
        return {
          time,
          name: log.edit_name,
          topic,
          oldData: `${log.old_data ?? ""} ${log.old_status ? "✅" : "❌"}`,
          newData: `${log.new_data ?? ""} ${log.new_status ? "✅" : "❌"}`,
        };
      }

      if (log.log_type === "MODEL" || log.log_type === "PERSONAL") {
        return {
          time,
          name: log.edit_name,
          topic,
          oldData: `${log.old_data ?? ""} ${toApprovalText(log.old_status)}`,
          newData: `${log.new_data ?? ""} ${toApprovalText(log.new_status)}`,
        };
      }

      return {
        time,
        name: log.edit_name,
        topic,
        oldData: log.old_data ?? "",
        newData: log.new_data ?? "",
      };
    });

    exportLogsToExcel(payload);
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
              onChange={(e) => {
                setLogFilter(e.target.value)
                setPage(1)
              }}
              size="small"
              sx={{ width: isTablet ? "100%" : "none", flex: 1 }}
            >
              <MenuItem value="หัวข้อการ Logs แก้ไข">
                หัวข้อการ Logs แก้ไข
              </MenuItem>
              <MenuItem value="กำหนดแนวทางการตั้งคำถาม">
                กำหนดแนวทางการตั้งคำถาม
              </MenuItem>
              <MenuItem value="ตั้งค่าการแจ้งเตือน">
                ตั้งค่าการแจ้งเตือน
              </MenuItem>
              <MenuItem value="ตั้งค่า Model">
                ตั้งค่า Model
              </MenuItem>
              <MenuItem value="ตั้งค่า Model ของผู้ใช้งาน">
                ตั้งค่า Model ของผู้ใช้งาน
              </MenuItem>
              <MenuItem value="ตั้งค่า Model ของกลุ่มงาน">
                ตั้งค่า Model ของกลุ่มงาน
              </MenuItem>
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
              onClick={() => {
                handleDeleteAll()
                setPage(1)
              }}
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
                  {logRows.map((row, i) => (
                    <TableRow key={i}>
                      <TableCell>{row.time}</TableCell>
                      <TableCell>{row.name}</TableCell>
                      <TableCell>{row.topic}</TableCell>
                      <TableCell>{row.old}</TableCell>
                      <TableCell>{row.new}</TableCell>
                    </TableRow>
                  ))}

                  {/* ถ้าไม่มีข้อมูล */}
                  {logRows.length === 0 && (
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
                count={Math.ceil(totalCount / rowsPerPage)}
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
