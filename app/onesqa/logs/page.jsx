"use client";

import React, { useState, useEffect, useMemo } from "react";
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
  TextField,
  Button,
  Switch,
  CircularProgress,
  useMediaQuery,
  Stack,
} from "@mui/material";
// ใช้ dayjs (แนะนำเปิด timezone ให้ตรง Asia/Bangkok)
import dayjs from "dayjs";
import "dayjs/locale/th";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import DeleteIcon from "@mui/icons-material/Delete";
import UserTableToolbar from "@/app/components/UserTableToolbar";
import Swal from "sweetalert2";
import { useTheme } from "next-themes";
import { useTranslations } from "next-intl";
import { exportLogsToExcel } from "@/util/exportToExcel";
import { useRequireRole } from "@/hook/useRequireRole";
import SmartPagination from "@/app/components/SmartPagination";
import LocalizedDatePicker from "@/app/components/LocalizedDatePicker";
import { useLanguage } from "@/app/context/LanguageContext";

const mapLogFilterToType = (label) => {
  switch (label) {
    case "กำหนดแนวทางการตั้งคำถาม": return "PROMPT";
    case "ตั้งค่าการแจ้งเตือน": return "ALERT";
    case "ตั้งค่า Model ของระบบ": return "MODEL";
    case "ตั้งค่า Model ของผู้ใช้งาน": return "PERSONAL";
    case "ตั้งค่ากลุ่มผู้ใช้งาน": return "GROUP";
    case "ตั้งค่าบทบาทของผู้ใช้งาน": return "ROLE";
    default: return null; // "หัวข้อการ Logs" = ทั้งหมด
  }
};

const mapTypeToLogFilter = (label) => {
  switch (label) {
    case "PROMPT": return "กำหนดแนวทางการตั้งคำถาม";
    case "ALERT": return "ตั้งค่าการแจ้งเตือน";
    case "MODEL": return "ตั้งค่า Model ของระบบ";
    case "PERSONAL": return "ตั้งค่า Model ของผู้ใช้งาน";
    case "GROUP": return "ตั้งค่ากลุ่มผู้ใช้งาน";
    case "ROLE": return "ตั้งค่าบทบาทของผู้ใช้งาน";
    default: return null; // "หัวข้อการ Logs" = ทั้งหมด
  }
};

const LogPage = () => {
  dayjs.extend(utc);
  dayjs.extend(timezone);
  dayjs.tz.setDefault("Asia/Bangkok"); // เอาออกได้ถ้าไม่อยาก fix timezone

  const { locale } = useLanguage();
  const client = useApolloClient();
  const t = useTranslations("LogPage");
  const tInit = useTranslations("Init");
  const tDelete = useTranslations("DeleteAlert"); // สำหรับข้อความลบ

  const isMobile = useMediaQuery("(max-width:600px)"); // < md คือจอเล็ก
  const isTablet = useMediaQuery("(max-width:1200px)"); // < md คือจอเล็ก

  const [logType, setLogType] = useState(""); // "" = ทั้งหมด
  //const [logFilter, setLogFilter] = useState("หัวข้อการ Logs");
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
    //   old: "50,000 (ChatGPT 5)",
    //   new: "100,000 (ChatGPT 5)",
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
      locale: locale,
      page: page, 
      pageSize: rowsPerPage,
      where: {
        //logType: mapLogFilterToType(logFilter),
        logType: logType || null,
        startDate: startDate,
        endDate: endDate
      }
    },
  });

  const [deleteLogs] = useMutation(DELETE_LOGS);

  // แปลง type -> label (แสดงในตาราง) อยู่ใน component เท่านั้น
  const typeLabelMap = useMemo(() => ({
    PROMPT: t("select1"),
    ALERT: t("select2"),
    MODEL: t("select3"),
    PERSONAL: t("select4"),
    GROUP: t("select5"),
    ROLE: t("select6"),
  }), [t]);

  // กันเคส "0" / "1" / "true" / "false"
  const toBool = (v) =>
    v === true || v === "true" || v === 1 || v === "1";

  const toApprovalText = (v) => {
    if (toBool(v)) return t("active");
    if (v === false || v === "false" || v === 0 || v === "0") return t("inactive");
    return v == null ? "" : String(v);
  };

  useEffect(() => {
    if (!logsData?.logs?.items?.length) {
      setLogRows([]);
      setTotalCount(0);
      return;
    }

    const transformed = logsData.logs.items.map((log) => {
      const formattedTime = dayjs(log.createdAt).format("YYYY-MM-DD HH:mm:ss");

      // ✅ ใช้ mapping ใน component
      const topic = typeLabelMap[log.log_type] ?? log.log_type;

      let oldValue = log.old_data;
      let newValue = log.new_data;

      const hasStatus = log.old_status != null || log.new_status != null; // กัน null/undefined

      // ✅ ถ้า ALERT หรือ MODEL ที่มี status ให้โชว์ Switch
      if (
        log.log_type === "ALERT" || 
        (log.log_type === "MODEL" && hasStatus) || 
        (log.log_type === "PERSONAL" && hasStatus) ||
        (log.log_type === "GROUP" && hasStatus)
      ) {
        oldValue = (
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <span>{log.old_data}</span>
            <Switch checked={toBool(log.old_status)} disabled />
          </Box>
        );
        newValue = (
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <span>{log.new_data}</span>
            <Switch checked={toBool(log.new_status)} disabled />
          </Box>
        );
      }

      // ✅ PERSONAL โชว์เป็นข้อความ active/inactive
      // if (log.log_type === "PERSONAL") {
      //   oldValue = `${log.old_data ?? ""} ${toApprovalText(log.old_status)}`.trim();
      //   newValue = `${log.new_data ?? ""} ${toApprovalText(log.new_status)}`.trim();
      // }

      return {
        time: formattedTime,
        name: log.edit_name,
        topic,
        old: oldValue,
        new: newValue,
      };
    });

    setLogRows(transformed);
    setTotalCount(logsData.logs.totalCount ?? 0);
  }, [logsData, typeLabelMap]); // ✅ ใส่ typeLabelMap เพื่อให้เปลี่ยนภาษาแล้วอัปเดต label

  useEffect(() => {
    // ตั้งค่าเริ่มต้นเป็น "วันนี้"
    const now = dayjs(); // ใช้ tz default ที่ set แล้ว
    setStartDate(now.startOf("day").format("YYYY-MM-DD"));
    setEndDate(now.endOf("day").format("YYYY-MM-DD"));
    setPage(1);
  }, []);

  const { allowed, loading, user } = useRequireRole({
    roles: ["ผู้ดูแลระบบ", "superadmin"],
    redirectTo: "/onesqa/chat",
  });
  
  if (loading) return null;     // หรือใส่ Skeleton ก็ได้
  if (!allowed) return null;    // ระหว่างกำลัง redirect กันไม่ให้แสดงหน้า

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

  // console.log(logsError);
  
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
  //     logFilter === "หัวข้อการ Logs" || log.topic.includes(logFilter);

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
    const d = dayjs().tz("Asia/Bangkok"); // หรือ dayjs() ก็ได้ถ้าตั้ง default TZ แล้ว

    setLogType(""); // กลับไปค่าหมวดหมู่เริ่มต้น
    setStartDate(d.startOf("day").format("YYYY-MM-DD"));
    setEndDate(d.endOf("day").format("YYYY-MM-DD"));
    setPage(1);
    // console.log("🧹 ล้างตัวกรองเรียบร้อย");
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
        // ✅ กด Enter = confirm (เพราะโฟกัสอยู่ที่ปุ่ม confirm)
        focusConfirm: true,
        didOpen: () => {
          Swal.getConfirmButton()?.focus();
        },
      }).then(async (result) => {
        if (result.isConfirmed) {
          setLogRows([]); // ✅ ลบข้อมูลทั้งหมด
          setTotalCount(0);

          try {
            // ✅ เรียก mutation ไป backend
            const { data } = await deleteLogs();
            // console.log("✅ Delete success:", data.deleteLogs);
          } catch (error) {
            // console.log(error);
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
        // ✅ กด Enter = confirm (เพราะโฟกัสอยู่ที่ปุ่ม confirm)
        focusConfirm: true,
        didOpen: () => {
          Swal.getConfirmButton()?.focus();
        },
      }).then(async (result) => {
        if (result.isConfirmed) {
          setLogRows([]); // ✅ ลบข้อมูลทั้งหมด
          setTotalCount(0);
          
          try {
            // ✅ เรียก mutation ไป backend
            const { data } = await deleteLogs();
            // console.log("✅ Delete success:", data.deleteLogs);
          } catch (error) {
            // console.log(error);
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
    const { data } = await client.query({
      query: GET_LOGS,
      fetchPolicy: "network-only",
      variables: {
        locale,
        page: 1,                 // ✅ export เอาทั้งหมด แนะนำเริ่มที่หน้า 1
        pageSize: totalCount || 0,
        where: {
          logType: logType || null,
          startDate,
          endDate,
        },
      },
    });

    const rows = data?.logs?.items ?? [];

    const payload = rows.map((log) => {
      const time = dayjs(log.createdAt).format("YYYY-MM-DD HH:mm:ss");

      // ✅ ใช้ mapping ใน component (ไม่เรียก useTranslations ใน function ภายนอก)
      const topic = typeLabelMap[log.log_type] ?? log.log_type;

      const hasStatus = log.old_status != null || log.new_status != null;

      // ✅ ALERT หรือ MODEL ที่มี status -> export เป็น ✅ / ❌
      if (
        log.log_type === "ALERT" || 
        (log.log_type === "MODEL" && hasStatus) || 
        (log.log_type === "PERSONAL" && hasStatus) ||
        (log.log_type === "GROUP" && hasStatus)
      ){
        return {
          time,
          name: log.edit_name,
          topic,
          oldData: `${log.old_data ?? ""} ${toBool(log.old_status) ? "✅" : "❌"}`.trim(),
          newData: `${log.new_data ?? ""} ${toBool(log.new_status) ? "✅" : "❌"}`.trim(),
        };
      }

      // ✅ PERSONAL -> export เป็น active/inactive (ตาม i18n)
      // if (log.log_type === "PERSONAL") {
      //   return {
      //     time,
      //     name: log.edit_name,
      //     topic,
      //     oldData: `${log.old_data ?? ""} ${toApprovalText(log.old_status)}`.trim(),
      //     newData: `${log.new_data ?? ""} ${toApprovalText(log.new_status)}`.trim(),
      //   };
      // }

      // ✅ อื่นๆ -> ส่งค่าตรง
      return {
        time,
        name: log.edit_name,
        topic,
        oldData: log.old_data ?? "",
        newData: log.new_data ?? "",
      };
    });

    exportLogsToExcel(payload, locale);
  };

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
              value={logType}              // logType เป็น "" | "PROMPT" | ...
              onChange={(e) => {
                setLogType(e.target.value);
                setPage(1);
              }}
              size="small"
              sx={{ width: isTablet ? "100%" : "none", flex: 1 }}
              displayEmpty                 // ✅ ทำให้ value="" ยัง render ได้
              renderValue={(value) => {
                if (value === "") return t("select0"); // ✅ แสดง "ทั้งหมด"
                return typeLabelMap[value] ?? value;   // ตัวอื่น ๆ
              }}
            >
              <MenuItem value="">{t("select0")}</MenuItem>
              <MenuItem value="PROMPT">{t("select1")}</MenuItem>
              <MenuItem value="ALERT">{t("select2")}</MenuItem>
              <MenuItem value="MODEL">{t("select3")}</MenuItem>
              <MenuItem value="PERSONAL">{t("select4")}</MenuItem>
              <MenuItem value="GROUP">{t("select5")}</MenuItem>
              <MenuItem value="ROLE">{t("select6")}</MenuItem>
            </Select>

            {/* วันที่เริ่มต้น */}
            <LocalizedDatePicker
              label={t("startDate")}
              value={startDate}
              onChange={(v) => {
                setStartDate(v)
                setPage(1)
              }}
              textFieldProps={{
                size: "small",
                  sx: { width: isTablet ? "100%" : 200 },
                }}
            />

            {/* วันที่สิ้นสุด */}
            <LocalizedDatePicker
              label={t("endDate")}
              value={endDate}
              onChange={(v) => {
                setEndDate(v)
                setPage(1)
              }}
              textFieldProps={{
                size: "small",
                  sx: { width: isTablet ? "100%" : 200 },
                }}
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
                        {t("notfound")}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>

            {/* Footer */}
            {/* ✅ Pagination */}
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                gap: 3,
                flexWrap: "wrap",
                alignItems: "center",
                mt: 2,
              }}
            >
              <Stack 
                direction="row" 
                spacing={1} 
                alignItems="center"
                sx={{
                  ml: 1
                }}
              >
                <Typography variant="body2" color="text.secondary">
                  {tInit("count")}
                </Typography>

                <Typography variant="body2" fontWeight={700}>
                  {totalCount}
                </Typography>
              </Stack>

              {/* ✅ มือถือให้ชิดขวา (flex-end) */}
              <Box
                sx={{
                  display: "flex",
                  justifyContent: { xs: "flex-end", sm: "flex-end" }, // ถ้าต้องการเฉพาะมือถือ: { xs: "flex-end", sm: "flex-start" }
                  width: { xs: "100%", sm: "auto" }, // ให้กินเต็มบรรทัดบนมือถือ จะได้ดันไปขวาได้
                }}
              >
                <SmartPagination
                  page={page}
                  totalPages={Math.ceil(totalCount / rowsPerPage)}
                  disabled={logsLoading}
                  onChange={(newPage) => setPage(newPage)}
                />
              </Box>
            </Box>
          </Box>
        </Box>
      </Box>
    </div>
  );
};

export default LogPage;
