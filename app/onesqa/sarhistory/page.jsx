"use client";

import React, { useState, useEffect } from "react";
import { NetworkStatus } from "@apollo/client";
import { useApolloClient, useQuery } from "@apollo/client/react";
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
} from "@mui/material";

import SearchIcon from "@mui/icons-material/Search";
import { useTranslations } from "next-intl";
import { useTheme } from "next-themes";

import { useLanguage } from "@/app/context/LanguageContext";
import { useRequireRole } from "@/hook/useRequireRole";
import SmartPagination from "@/app/components/SmartPagination";
import HistoryToolbar from "@/app/components/HistoryToolbar";
import LocalizedDatePicker from "@/app/components/LocalizedDatePicker";

// ✅ เปลี่ยนเป็น query ของ login history
import { exportSarHistoryToExcel } from "@/util/exportToExcel";
import { GET_SAR_HISTORY } from "@/graphql/sarhistory/queries";

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.tz.setDefault("Asia/Bangkok");

const normalizeText = (v) => {
  const s = (v ?? "").trim();
  return s === "" ? null : s;
};

const SarHistoryPage = () => {
  const client = useApolloClient();
  const { locale } = useLanguage();
  const { theme } = useTheme();
  const router = useRouter();

  const t = useTranslations("SarHistoryPage");
  const tInit = useTranslations("Init");

  const isMobile = useMediaQuery("(max-width:600px)");
  const isTablet = useMediaQuery("(max-width:1200px)");

  // 🔹 state (คงเดิม)
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const rowsPerPage = 5;

  // ✅ เก็บเป็น YYYY-MM-DD แล้วค่อยแปลงส่งเป็น DateTime ตอน query
  const [startDate, setStartDate] = useState(() =>
    dayjs().startOf("day").format("YYYY-MM-DD"),
  );
  const [endDate, setEndDate] = useState(() =>
    dayjs().endOf("day").format("YYYY-MM-DD"),
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
    startDate: startDateTime,
    endDate: endDateTime,
  };

  const {
    data: historyData,
    loading: historyLoading,
    error: historyError,
    refetch: historyRefetch,
    networkStatus,
  } = useQuery(GET_SAR_HISTORY, {
    fetchPolicy: "cache-and-network",
    notifyOnNetworkStatusChange: true,
    variables: {
      page,
      pageSize: rowsPerPage,
      where: whereVars,
    },
  });

  // ✅ require role เหมือนเดิม
  const { allowed, loading, user } = useRequireRole({
    roles: ["ผู้ดูแลระบบ", "superadmin"],
    redirectTo: "/onesqa/chat",
  });

  useEffect(() => {
    if (!historyData?.sarHistory) return;

    const items = historyData.sarHistory.items || [];

    if (!items.length) {
      setRows([]);
      setTotalCount(historyData.sarHistory.totalCount ?? 0);
      return;
    }

    const formatted = items.map((h) => {
      const createdAt =
        h?.createdAt && dayjs(h.createdAt).isValid()
          ? dayjs(h.createdAt).format("YYYY-MM-DD HH:mm:ss")
          : "-";

      return {
        id: h?.id,
        delete_name: h?.delete_name,
        name: h?.academy?.name || "-",
        code: h?.academy?.code || "-",
        sar_file: h?.sar_file,
        createdAt,
      };
    });

    setRows(formatted);
    setTotalCount(historyData.sarHistory.totalCount ?? formatted.length);
  }, [historyData, locale]);

  if (loading) return null;
  if (!allowed) return null;

  const isInitialLoading =
    networkStatus === NetworkStatus.loading && !historyData;

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

  const handleExportExcel = async () => {
    const { data } = await client.query({
      query: GET_SAR_HISTORY,
      fetchPolicy: "network-only",
      variables: {
        page: 1,
        pageSize: totalCount || 1,
        where: whereVars,
      },
    });

    const items = data?.sarHistory?.items ?? [];

    const transformed = items.map((h, idx) => {
      const createdAt =
        h?.createdAt && dayjs(h.createdAt).isValid()
          ? dayjs(h.createdAt).format("YYYY-MM-DD HH:mm:ss")
          : "-";

      return {
        id: h?.id ?? `row-${idx}`,
        delete_name: h?.delete_name,
        name: h?.academy?.name || "-",
        code: h?.academy?.code || "-",
        sar_file: h?.sar_file,
        createdAt,
      };
    });

    // ✅ ถ้า util เดิมทำ column สำหรับ users ไว้ คุณอาจต้องปรับ util ให้รองรับฟิลด์ชุดนี้
    exportSarHistoryToExcel(transformed, locale);
  };

  const handleClearFilters = () => {
    setSearch("");
    setPage(1);
    setStartDate(dayjs().startOf("day").format("YYYY-MM-DD"));
    setEndDate(dayjs().endOf("day").format("YYYY-MM-DD"));
  };

  return (
    <Box sx={{ p: isMobile ? 0 : 3 }}>
      <HistoryToolbar
        onBack={() => router.push(`/onesqa/academy`)}
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
        <Box
          sx={{
            width: "100%",
            overflowX: "auto",
            overflowY: "hidden",
            maxWidth: isMobile ? "80vw" : isTablet ? "85vw" : "90vw",
          }}
        >
          <TableContainer
            component={Paper}
            sx={{ borderRadius: 3, display: "inline-block" }}
          >
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>{t("tablecell1")}</TableCell>
                  <TableCell>{t("tablecell2")}</TableCell>
                  <TableCell>{t("tablecell3")}</TableCell>
                  <TableCell>{t("tablecell4")}</TableCell>
                  <TableCell>{t("tablecell5")}</TableCell>
                </TableRow>
              </TableHead>

              <TableBody>
                {rows.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>{item.delete_name}</TableCell>
                    <TableCell>{item.name}</TableCell>
                    <TableCell>{item.code}</TableCell>
                    <TableCell
                      sx={{
                        maxWidth: 420, // ปรับตามต้องการ
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                      title={String(item.sar_file ?? "")} // hover เพื่อดูเต็ม ๆ
                    >
                      {String(item.sar_file ?? "")}
                    </TableCell>

                    <TableCell>{item.createdAt}</TableCell>
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

          <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 2 }}>
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
  );
};

export default SarHistoryPage;
