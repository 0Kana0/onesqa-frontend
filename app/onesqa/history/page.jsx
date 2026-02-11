"use client";

import React, { useState, useEffect } from "react";
import { NetworkStatus } from "@apollo/client";
import { useApolloClient, useQuery, useMutation } from "@apollo/client/react";
import { useRouter } from "next/navigation";

import dayjs from "dayjs";
import "dayjs/locale/th";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";

import {
  Box,
  Typography,
  TextField,
  InputAdornment,
  Select,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  CircularProgress,
  useMediaQuery,
  Stack,
  Button,
} from "@mui/material";

import Swal from "sweetalert2";
import DeleteIcon from "@mui/icons-material/Delete";
import SearchIcon from "@mui/icons-material/Search";
import { useTranslations } from "next-intl";
import { useTheme } from "next-themes";

import { useLanguage } from "@/app/context/LanguageContext";
import { useRequireRole } from "@/hook/useRequireRole";
import SmartPagination from "@/app/components/SmartPagination";
import HistoryToolbar from "@/app/components/HistoryToolbar";
import LocalizedDatePicker from "@/app/components/LocalizedDatePicker";

// ✅ เปลี่ยนเป็น query ของ login history
import { exportHistoryToExcel } from "@/util/exportToExcel";
import { GET_USER_LOGIN_HISTORY } from "@/graphql/user_login_history/queries";
import { DELETE_LOGIN_HISTORYS } from "@/graphql/user_login_history/mutations";

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.tz.setDefault("Asia/Bangkok");

const normalizeText = (v) => {
  const s = (v ?? "").trim();
  return s === "" ? null : s;
};

const HistoryPage = () => {
  const client = useApolloClient();
  const { locale } = useLanguage();
  const { theme } = useTheme();
  const router = useRouter();

  const t = useTranslations("HistoryPage");
  const tInit = useTranslations("Init");
  const tDelete = useTranslations("DeleteAlert"); // สำหรับข้อความลบ

  const isMobile = useMediaQuery("(max-width:600px)");
  const isTablet = useMediaQuery("(max-width:1200px)");

  // 🔹 state (คงเดิม)
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("ทั้งหมด");
  const [page, setPage] = useState(1);
  const rowsPerPage = 5;

  // ✅ เก็บเป็น YYYY-MM-DD แล้วค่อยแปลงส่งเป็น DateTime ตอน query
  const [startDate, setStartDate] = useState(() =>
    dayjs().startOf("day").format("YYYY-MM-DD")
  );
  const [endDate, setEndDate] = useState(() =>
    dayjs().endOf("day").format("YYYY-MM-DD")
  );

  const [rows, setRows] = useState([]);
  const [totalCount, setTotalCount] = useState(0);

  // ✅ แปลงวัน (YYYY-MM-DD) => DateTime string แบบไม่มี timezone
  // เพื่อให้ backend ตีความเป็น Asia/Bangkok ได้ตรง ๆ
  const startDateTime = startDate
    ? dayjs(startDate).startOf("day").format("YYYY-MM-DDTHH:mm:ss.SSS")
    : null;

  const endDateTime = endDate
    ? dayjs(endDate).endOf("day").format("YYYY-MM-DDTHH:mm:ss.SSS")
    : null;

  const whereVars = {
    search: normalizeText(search),
    event_type: typeFilter === "ทั้งหมด" ? null : typeFilter,
    startDate: startDateTime,
    endDate: endDateTime,
  };

  const {
    data: historyData,
    loading: historyLoading,
    error: historyError,
    refetch: historyRefetch,
    networkStatus,
  } = useQuery(GET_USER_LOGIN_HISTORY, {
    fetchPolicy: "cache-and-network",
    notifyOnNetworkStatusChange: true,
    variables: {
      page,
      pageSize: rowsPerPage,
      where: whereVars,
    },
  });

  const [deleteLoginHistorys] = useMutation(DELETE_LOGIN_HISTORYS);

  // ✅ require role เหมือนเดิม
  const { allowed, loading, user } = useRequireRole({
    roles: ["ผู้ดูแลระบบ", "superadmin"],
    redirectTo: "/onesqa/chat",
  });

  // helper แปลง event type เป็น label
  const getEventLabel = (et) => {
    if (et === "LOGIN_SUCCESS") return t("selecttype1");
    if (et === "LOGOUT") return t("selecttype2");
    return et || "-";
  };

  useEffect(() => {
    if (!historyData?.loginHistory) return;

    const items = historyData.loginHistory.items || [];

    if (!items.length) {
      setRows([]);
      setTotalCount(historyData.loginHistory.totalCount ?? 0);
      return;
    }

    const formatted = items.map((h) => {
      // ✅ กัน schema ได้ทั้ง user เป็น object หรือ array
      const u = Array.isArray(h.user) ? h.user?.[0] : h.user;

      const roleName =
        locale === "th"
          ? u?.user_role?.[0]?.role?.role_name_th || "ไม่ระบุ"
          : u?.user_role?.[0]?.role?.role_name_en || "Not specified";

      const createdAt =
        h?.createdAt && dayjs(h.createdAt).isValid()
          ? dayjs(h.createdAt).format("YYYY-MM-DD HH:mm:ss")
          : "-";

      return {
        id: h?.id,
        name: `${u?.firstname || ""} ${u?.lastname || ""}`.trim() || "-",
        role: roleName,
        group: u?.group_name || "-",
        event_type: h?.event_type || "-",
        event_label: getEventLabel(h?.event_type),
        createdAt,
        user_agent: h?.user_agent || "-",
      };
    });

    setRows(formatted);
    setTotalCount(historyData.loginHistory.totalCount ?? formatted.length);
  }, [historyData, locale]);

  if (loading) return null;
  if (!allowed) return null;

  const isInitialLoading = networkStatus === NetworkStatus.loading && !historyData;

  if (isInitialLoading) {
    return (
      <Box sx={{ textAlign: "center", mt: 5 }}>
        <CircularProgress />
        <Typography>{tInit("loading")}...</Typography>
      </Box>
    );
  }

  if (historyError) {
    return (
      <Typography color="error" sx={{ mt: 5 }}>
        ❌ {tInit("error")}
      </Typography>
    );
  }

  // ✅ ฟังก์ชันลบทั้งหมดพร้อม SweetAlert2
  const handleDeleteAll = () => {
    if (theme === "dark") {
      Swal.fire({
        title: tDelete("title1"),
        text: tDelete("textloginhistory1"),
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
          setRows([]); // ✅ ลบข้อมูลทั้งหมด
          setTotalCount(0);
  
          try {
            // ✅ เรียก mutation ไป backend
            const { data } = await deleteLoginHistorys();
            // console.log("✅ Delete success:", data.deleteLoginHistorys);
          } catch (error) {
            // console.log(error);
          }
  
          Swal.fire({
            title: tDelete("title2"),
            text: tDelete("textloginhistory2"),
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
        text: tDelete("textloginhistory1"),
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
          setRows([]); // ✅ ลบข้อมูลทั้งหมด
          setTotalCount(0);
            
          try {
            // ✅ เรียก mutation ไป backend
            const { data } = await deleteLoginHistorys();
            // console.log("✅ Delete success:", data.deleteLoginHistorys);
          } catch (error) {
            // console.log(error);
          }
  
          Swal.fire({
            title: tDelete("title2"),
            text: tDelete("textloginhistory2"),
            icon: "success",
            confirmButtonColor: "#3E8EF7",
          });
        }
      });
    }
  };

  const handleExportExcel = async () => {
    const { data } = await client.query({
      query: GET_USER_LOGIN_HISTORY,
      fetchPolicy: "network-only",
      variables: {
        page: 1,
        pageSize: totalCount || 1,
        where: whereVars,
      },
    });

    const items = data?.loginHistory?.items ?? [];

    const transformed = items.map((h, idx) => {
      const u = Array.isArray(h.user) ? h.user?.[0] : h.user;

      return {
        id: h?.id ?? `row-${idx}`,
        fullName: `${u?.firstname || ""} ${u?.lastname || ""}`.trim() || "-",
        role:
          locale === "th"
            ? u?.user_role?.[0]?.role?.role_name_th || "ไม่ระบุ"
            : u?.user_role?.[0]?.role?.role_name_en || "Not specified",
        group: u?.group_name || "-",
        event: getEventLabel(h?.event_type),
        createdAt:
          h?.createdAt && dayjs(h.createdAt).isValid()
            ? dayjs(h.createdAt).format("YYYY-MM-DD HH:mm:ss")
            : "-",
        userAgent: h?.user_agent || "-",
      };
    });

    // ✅ ถ้า util เดิมทำ column สำหรับ users ไว้ คุณอาจต้องปรับ util ให้รองรับฟิลด์ชุดนี้
    exportHistoryToExcel(transformed, locale);
  };

  const handleClearFilters = () => {
    setSearch("");
    setTypeFilter("ทั้งหมด");
    setPage(1);
    setStartDate(dayjs().startOf("day").format("YYYY-MM-DD"));
    setEndDate(dayjs().endOf("day").format("YYYY-MM-DD"));
  };

  return (
    <Box sx={{ p: isMobile ? 0 : 3 }}>
      <HistoryToolbar
        onBack={() => router.push(`/onesqa/users`)}
        onExport={() => handleExportExcel()}
        onClearFilters={handleClearFilters}
      />

      {/* Filter box */}
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
        <Stack spacing={2}>
          <Typography variant="h6" fontWeight="bold" sx={{ mb: 1 }}>
            {t("filter1")}
          </Typography>

          <Box
            sx={{
              display: "flex",
              flexDirection: isTablet ? "column" : "row",
              alignItems: isTablet ? "flex-start" : "center",
              gap: 2,
            }}
          >
            <TextField
              variant="outlined"
              placeholder={t("placeholder1")}
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              size="small"
              sx={{ width: isTablet ? "100%" : "none", flex: 1 }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon color="action" />
                  </InputAdornment>
                ),
              }}
            />

            <Select
              value={typeFilter}
              onChange={(e) => {
                setTypeFilter(e.target.value);
                setPage(1);
              }}
              size="small"
              sx={{ width: isTablet ? "100%" : "none" }}
            >
              <MenuItem value="ทั้งหมด">{t("selecttype0")}</MenuItem>
              <MenuItem value="LOGIN_SUCCESS">{t("selecttype1")}</MenuItem>
              <MenuItem value="LOGOUT">{t("selecttype2")}</MenuItem>
            </Select>
          </Box>

          <Box
            sx={{
              display: "flex",
              flexDirection: isTablet ? "column" : "row",
              alignItems: isTablet ? "flex-start" : "center",
              gap: 2,
            }}
          >
            <LocalizedDatePicker
              label={t("startDate")}
              value={startDate}
              onChange={(v) => {
                setStartDate(v);
                setPage(1);
              }}
              textFieldProps={{
                size: "small",
                sx: { width: "100%" },
              }}
            />

            <LocalizedDatePicker
              label={t("endDate")}
              value={endDate}
              onChange={(v) => {
                setEndDate(v);
                setPage(1);
              }}
              textFieldProps={{
                size: "small",
                sx: { width: "100%" },
              }}
            />
          </Box>
        </Stack>
      </Box>

      {/* Table box */}
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
        {/* Header */}
        <Box
          sx={{
            display: "flex",
            justifyContent: "flex-end",
            alignItems: "center",
            mb: 2,
            gap: 1,
          }}
        >
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
        
        <Box
          sx={{
            width: "100%",
            overflowX: "auto",
            overflowY: "hidden",
            maxWidth: isMobile ? "80vw" : isTablet ? "85vw" : "90vw",
          }}
        >
          <TableContainer component={Paper} sx={{ borderRadius: 3, display: "inline-block" }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>{t("tablecell1")}</TableCell>
                  <TableCell>{t("tablecell2")}</TableCell>
                  <TableCell>{t("tablecell3")}</TableCell>
                  <TableCell>{t("tablecell4")}</TableCell>
                  <TableCell>{t("tablecell5")}</TableCell>
                  <TableCell>{t("tablecell6")}</TableCell>
                </TableRow>
              </TableHead>

              <TableBody>
                {rows.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <Typography fontWeight="bold">{item.name}</Typography>
                    </TableCell>

                    <TableCell>
                      <Chip
                        label={item.role}
                        sx={{
                          bgcolor:
                            item.role === "ผู้ดูแลระบบ" || item.role === "administrator"
                              ? "#FCE4EC"
                              : item.role === "ผู้ประเมินภายนอก" || item.role === "external assessor"
                              ? "#E3F2FD"
                              : "#FFF3E0",
                          color:
                            item.role === "ผู้ดูแลระบบ" || item.role === "administrator"
                              ? "#D81B60"
                              : item.role === "ผู้ประเมินภายนอก" || item.role === "external assessor"
                              ? "#1976D2"
                              : "#F57C00",
                          fontWeight: 500,
                        }}
                      />
                    </TableCell>

                    <TableCell>{item.group}</TableCell>
                    <TableCell>{item.event_label}</TableCell>
                    <TableCell>{item.createdAt}</TableCell>
                    <TableCell>{item.user_agent}</TableCell>
                  </TableRow>
                ))}

                {rows.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                      {t("notfound")}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>

          {/* Footer */}
          {/* 🔹 Pagination */}
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
                disabled={historyLoading}
                onChange={(newPage) => setPage(newPage)}
              />
            </Box>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default HistoryPage;
