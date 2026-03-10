"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
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
  TextField,
  Avatar,
  Stack,
  Divider,
  CircularProgress,
  useMediaQuery,
  InputAdornment,
} from "@mui/material";
// ใช้ dayjs (แนะนำเปิด timezone ให้ตรง Asia/Bangkok)
import dayjs from "dayjs";
import "dayjs/locale/th";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import UserTableToolbar from "@/app/components/UserTableToolbar";
import TokenUsageCard from "@/app/components/TokenUsageCard";
import { useTranslations } from "next-intl";
import {
  exportReportPeriodsToExcel,
  exportReportsToExcel,
} from "@/util/exportToExcel";
import { useRequireRole } from "@/hook/useRequireRole";
import {
  GET_PERIOD_REPORTS,
  GET_REPORTS,
  TOPFIVE_REPORTS,
} from "@/graphql/report/queries";
import SmartPagination from "@/app/components/SmartPagination";
import LocalizedDatePicker from "@/app/components/LocalizedDatePicker";
import { useLanguage } from "@/app/context/LanguageContext";
import { DataFilter } from "@/app/components/DateFilter";
import SearchIcon from "@mui/icons-material/Search";

function getLast5Years() {
  const y = new Date().getFullYear();
  return Array.from({ length: 5 }, (_, i) => y - i);
}

const ReportPage = () => {
  dayjs.extend(utc);
  dayjs.extend(timezone);
  dayjs.tz.setDefault("Asia/Bangkok"); // เอาออกได้ถ้าไม่อยาก fix timezone

  const years = useMemo(() => getLast5Years(), []);
  const now = dayjs();

  const { locale } = useLanguage();
  const client = useApolloClient();
  const t = useTranslations("ReportPage");
  const tInit = useTranslations("Init");
  const tDatePicker = useTranslations("DatePicker");

  const isMobile = useMediaQuery("(max-width:600px)"); // < md คือจอเล็ก
  const isTablet = useMediaQuery("(max-width:1200px)"); // < md คือจอเล็ก

  // ✅ TABLE 1 (รายงานแบบช่วงวันที่ start/end)
  const [searchList, setSearchList] = useState("");
  const [quickRangeList, setQuickRangeList] = useState("วันนี้");
  const [startDateList, setStartDateList] = useState("");
  const [endDateList, setEndDateList] = useState("");
  const [pageList, setPageList] = useState(1);
  const rowsPerPageList = 5;
  const [totalCountList, setTotalCountList] = useState(0);

  // ✅ filter สำหรับ Top 5
  const [topMonth, setTopMonth] = useState(now.month() + 1); // 1..12
  const [topYear, setTopYear] = useState(now.year());

  // ✅ TABLE 2 (รายงานตาม DataFilter: daily/monthly/yearly)
  const [searchPeriod, setSearchPeriod] = useState("");
  const [pagePeriod, setPagePeriod] = useState(1);
  const rowsPerPagePeriod = 5;
  const [totalCountPeriod, setTotalCountPeriod] = useState(0);

  const [periodReport, setPeriodReport] = useState({
    mode: "daily",
    date: dayjs(),
  });
  const [dailyDateReport, setDailyDateReport] = useState(
    periodReport?.mode === "daily" ? periodReport.date : now
  );
  const [monthReport, setMonthReport] = useState(
    periodReport?.mode === "monthly" ? periodReport.month : now.month() + 1
  );
  const [yearReport, setYearReport] = useState(
    periodReport?.mode === "monthly"
      ? periodReport.year
      : periodReport?.mode === "yearly"
      ? periodReport.year
      : years[0]
  );

  const monthOptions = useMemo(() => {
    const fmt = new Intl.DateTimeFormat(
      locale?.startsWith("th") ? "th-TH" : "en-US",
      { month: "long" }
    );
    return Array.from({ length: 12 }, (_, i) => ({
      value: i + 1,
      label: fmt.format(new Date(2000, i, 1)),
    }));
  }, [locale]);

  const {
    data: aisData,
    loading: aisLoading,
    error: aisError,
  } = useQuery(GET_AIS, {
    fetchPolicy: "network-only",
  });

  const {
    data: reportsData,
    loading: reportsLoading,
    error: reportsError,
    networkStatus,
  } = useQuery(GET_REPORTS, {
    fetchPolicy: "cache-and-network",
    notifyOnNetworkStatusChange: true,
    variables: {
      page: pageList,
      pageSize: rowsPerPageList,
      where: {
        startDate: startDateList,
        endDate: endDateList,
        search: searchList, // ถ้า backend รองรับค่อยใส่
      },
    },
  });

  const periodVar = useMemo(() => {
    const mode = periodReport?.mode || "daily";

    return {
      mode,
      date:
        mode === "daily" && dailyDateReport
          ? dayjs(dailyDateReport).tz("Asia/Bangkok").startOf("day").format()
          : null,
      month: mode === "monthly" ? Number(monthReport) : null,
      year: mode === "monthly" || mode === "yearly" ? Number(yearReport) : null,
    };
  }, [periodReport, dailyDateReport, monthReport, yearReport]);

  const {
    data: periodReportsData,
    loading: periodReportsLoading,
    error: periodReportsError,
    networkStatus: periodNetworkStatus,
  } = useQuery(GET_PERIOD_REPORTS, {
    fetchPolicy: "cache-and-network",
    notifyOnNetworkStatusChange: true,
    variables: {
      page: pagePeriod,
      pageSize: rowsPerPagePeriod,
      period: periodVar,
      search: searchPeriod, // ถ้า backend รองรับค่อยใส่
    },
  });

  const {
    data: topfiveData,
    loading: topfiveLoading,
    error: topfiveError,
    networkStatus: topfiveNetworkStatus,
  } = useQuery(TOPFIVE_REPORTS, {
    fetchPolicy: "cache-and-network",
    notifyOnNetworkStatusChange: true,
    variables: {
      month: topMonth,
      year: topYear,
    },
  });

  useEffect(() => {
    setTotalCountList(reportsData?.reports?.totalCount ?? 0);
  }, [reportsData]);

  useEffect(() => {
    setTotalCountPeriod(periodReportsData?.periodReports?.totalCount ?? 0);
  }, [periodReportsData]);

  useEffect(() => {
    // ตั้งค่าเริ่มต้นเป็น "วันนี้"
    const now = dayjs(); // ใช้ tz default ที่ set แล้ว
    setStartDateList(now.startOf("day").format("YYYY-MM-DD"));
    setEndDateList(now.endOf("day").format("YYYY-MM-DD"));
    setPageList(1);
  }, []);

  const { allowed, loading, user } = useRequireRole({
    roles: ["ผู้ดูแลระบบ", "superadmin"],
    redirectTo: "/onesqa/chat",
  });

  if (loading) return null; // หรือใส่ Skeleton ก็ได้
  if (!allowed) return null; // ระหว่างกำลัง redirect กันไม่ให้แสดงหน้า

  // โชว์โหลดเฉพาะ "ครั้งแรกจริง ๆ" (ยังไม่มี data)
  const isInitialLoading =
    networkStatus === NetworkStatus.loading && !reportsData;

  const isInitialLoadingPeriod =
    periodNetworkStatus === NetworkStatus.loading && !periodReportsData;

  const isInitialLoadingTopfive =
    topfiveNetworkStatus === NetworkStatus.loading && !topfiveData;

  if (isInitialLoading || isInitialLoadingPeriod || isInitialLoadingTopfive) {
    return (
      <Box sx={{ textAlign: "center", mt: 5 }}>
        <CircularProgress />
        <Typography>{tInit("loading")}...</Typography>
      </Box>
    );
  }

  if (aisError || reportsError || topfiveError || periodReportsError)
    return (
      <Typography color="error" sx={{ mt: 5 }}>
        ❌ {tInit("error")}
      </Typography>
    );

  // console.log(aisData?.ais);
  // console.log(reportsData?.reports?.items);

  const getRangeFromQuick = (range) => {
    const now = dayjs(); // จะใช้ Asia/Bangkok จากด้านบน
    switch (range) {
      case "วันนี้": {
        return { start: now.startOf("day"), end: now.endOf("day") };
      }
      case "7วันย้อนหลัง": {
        const s7 = now.subtract(6, "day").startOf("day"); // รวมวันนี้ = 7 วัน
        return { start: s7, end: now.endOf("day") };
      }
      case "1เดือนย้อนหลัง": {
        const s30 = now.subtract(29, "day").startOf("day"); // รวมวันนี้ ~30 วัน
        return { start: s30, end: now.endOf("day") };
      }
      default:
        return { start: null, end: null };
    }
  };
  const applyQuickRange = (range) => {
    const { start, end } = getRangeFromQuick(range);
    setStartDateList(start ? start.format("YYYY-MM-DD") : "");
    setEndDateList(end ? end.format("YYYY-MM-DD") : "");
    setPageList(1);
  };

  const handleClearFilters = () => {
    const d = dayjs().tz("Asia/Bangkok"); // หรือ dayjs() ก็ได้ถ้าตั้ง default TZ แล้ว

    setQuickRangeList("วันนี้");
    setStartDateList(d.startOf("day").format("YYYY-MM-DD"));
    setEndDateList(d.endOf("day").format("YYYY-MM-DD"));
    setSearchList("");
    setPageList(1);
  };
  
  const handleClearFilterPeriods = () => {
    const d = dayjs();
    const y = years.includes(d.year()) ? d.year() : years[0];

    setPeriodReport({ mode: "daily", date: d });
    setDailyDateReport(d);
    setMonthReport(d.month() + 1);
    setYearReport(y);

    setSearchPeriod("");
    setPagePeriod(1);
  };

  // ✅ Export ตารางที่ 1 (ช่วงวันที่ start/end)
  const handleExportExcel = async () => {
    // ถ้าไม่มีข้อมูลก็ export ว่าง ๆ ได้ หรือจะ return ก็ได้
    const total = totalCountList ?? 0;

    const { data } = await client.query({
      query: GET_REPORTS,
      fetchPolicy: "network-only",
      variables: {
        page: 1, // ✅ ดึงทั้งหมด เริ่มที่หน้า 1
        pageSize: total > 0 ? total : 1, // กัน backend error ถ้า pageSize=0
        where: {
          startDate: startDateList,
          endDate: endDateList,
          search: searchList || null, // ถ้า backend ไม่รองรับ จะลบทิ้งได้
        },
      },
    });

    const reportExcel = data?.reports?.items ?? [];
    exportReportsToExcel(reportExcel, locale);
  };
  // ✅ Export ตารางที่ 2 (ตาม period: daily/monthly/yearly)
  const handleExportExcelPeriod = async () => {
    const total = totalCountPeriod ?? 0;

    const { data } = await client.query({
      query: GET_PERIOD_REPORTS, // ✅ ต้องใช้ตัวนี้
      fetchPolicy: "network-only",
      variables: {
        page: 1, // ✅ ดึงทั้งหมด
        pageSize: total > 0 ? total : 1,
        period: periodVar, // ✅ ใช้ตัวเดียวกับที่ query ตาราง 2
        search: searchPeriod || null, // ถ้า backend ไม่รองรับ จะลบทิ้งได้
      },
    });

    const reportExcel = data?.periodReports?.items ?? [];
    exportReportPeriodsToExcel(reportExcel, locale, periodReport);
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
        <Stack spacing={2}>
          <Typography variant="h6" fontWeight="bold" sx={{ mb: 1 }}>
            {t("subtitle1")}
          </Typography>

          {/* 🔹 ส่วนค้นหาและกรองข้อมูล */}
          <Box
            sx={{
              display: "flex",
              flexDirection: isTablet ? "column" : "row",
              alignItems: isTablet ? "flex-start" : "center",
              gap: 2,
            }}
          >
            <Select
              value={quickRangeList}
              onChange={(e) => {
                const val = e.target.value;
                setQuickRangeList(val);
                applyQuickRange(val); // หรือถ้าแยกชื่อ: applyQuickRangeList(val)
                setPageList(1);
              }}
              size="small"
              sx={{ width: isTablet ? "100%" : "none", flex: 1 }}
            >
              <MenuItem value="วันนี้">{t("select1")}</MenuItem>
              <MenuItem value="7วันย้อนหลัง">{t("select2")}</MenuItem>
              <MenuItem value="1เดือนย้อนหลัง">{t("select3")}</MenuItem>
            </Select>

            {/* วันที่เริ่มต้น */}
            <LocalizedDatePicker
              label={t("startDate")}
              value={startDateList}
              onChange={(v) => {
                setStartDateList(v);
                setPageList(1);
              }}
              textFieldProps={{
                size: "small",
                sx: { width: isTablet ? "100%" : 200 },
              }}
            />

            {/* วันที่สิ้นสุด */}
            <LocalizedDatePicker
              label={t("endDate")}
              value={endDateList}
              onChange={(v) => {
                setEndDateList(v);
                setPageList(1);
              }}
              textFieldProps={{
                size: "small",
                sx: { width: isTablet ? "100%" : 200 },
              }}
            />
          </Box>

          <TextField
            variant="outlined"
            placeholder={t("placeholder1")}
            value={searchList}
            onChange={(e) => {
              setSearchList(e.target.value);
              setPageList(1);
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
        </Stack>
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
                {reportsData?.reports?.items?.map((row, index) => (
                  <TableRow key={index} hover>
                    <TableCell>
                      {new Date(row.date).toLocaleDateString("en-GB", {
                        day: "numeric",
                        month: "numeric",
                        year: "numeric",
                      })}
                    </TableCell>
                    <TableCell>{row.user}</TableCell>
                    <TableCell>{row.group || "-"}</TableCell>
                    <TableCell align="center">
                      {row.chats.toLocaleString()}
                    </TableCell>
                    <TableCell align="right">
                      {Number(row.tokens).toLocaleString()}
                    </TableCell>
                  </TableRow>
                ))}

                {/* ถ้าไม่มีข้อมูล */}
                {reportsData?.reports?.items?.length === 0 && (
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
          {/* 📄 Pagination */}
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
                {totalCountList}
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
                page={pageList}
                totalPages={Math.ceil(totalCountList / rowsPerPageList)}
                disabled={reportsLoading}
                onChange={(newPage) => setPageList(newPage)}
              />
            </Box>
          </Box>
        </Box>
      </Box>

      <UserTableToolbar
        onRefresh={() => console.log("🔄 เชื่อมต่อข้อมูลผู้ใช้งาน")}
        onExport={() => handleExportExcelPeriod()}
        onClearFilters={handleClearFilterPeriods}
      />

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
            {t("subtitle3")}
          </Typography>

          <DataFilter
            value={periodReport}
            onChange={(v) => {
              setPeriodReport(v);
              setPagePeriod(1);
            }}
            dailyDate={dailyDateReport}
            setDailyDate={(v) => {
              setDailyDateReport(v);
              setPagePeriod(1);
            }}
            month={monthReport}
            setMonth={(v) => {
              setMonthReport(v);
              setPagePeriod(1);
            }}
            year={yearReport}
            setYear={(v) => {
              setYearReport(v);
              setPagePeriod(1);
            }}
            now={now}
            years={years}
          />

          <TextField
            variant="outlined"
            placeholder={t("placeholder1")}
            value={searchPeriod}
              onChange={(e) => {
                setSearchPeriod(e.target.value);
                setPagePeriod(1);
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
        </Stack>
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
                    <b>{t("tablecell6")}</b>
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
                {periodReportsData?.periodReports?.items?.map((row, index) => (
                  <TableRow key={index} hover>
                    <TableCell>
                      {periodReport?.mode === "daily"
                        ? new Date(row.period_start).toLocaleDateString(
                            "en-GB",
                            {
                              day: "numeric",
                              month: "numeric",
                              year: "numeric",
                            }
                          )
                        : periodReport?.mode === "yearly"
                        ? new Intl.DateTimeFormat(
                            locale?.startsWith("th") ? "th-TH" : "en-US",
                            {
                              month: "short",
                            }
                          ).format(new Date(row.period_start))
                        : row.period}
                    </TableCell>
                    <TableCell>{row.user}</TableCell>
                    <TableCell>{row.group || "-"}</TableCell>
                    <TableCell align="center">
                      {row.chats.toLocaleString()}
                    </TableCell>
                    <TableCell align="right">
                      {Number(row.tokens).toLocaleString()}
                    </TableCell>
                  </TableRow>
                ))}

                {/* ถ้าไม่มีข้อมูล */}
                {periodReportsData?.periodReports?.items?.length === 0 && (
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
          {/* 📄 Pagination */}
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
                {totalCountPeriod}
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
                page={pagePeriod}
                totalPages={Math.ceil(totalCountPeriod / rowsPerPagePeriod)}
                disabled={periodReportsLoading}   // ✅ สำคัญ: อย่าใช้ reportsLoading
                onChange={(newPage) => setPagePeriod(newPage)}
              />
            </Box>
          </Box>
        </Box>
      </Box>

      <Box
        sx={{
          border: "1px solid #E5E7EB",
          boxShadow: "0 3px 8px rgba(0,0,0,0.05)",
          borderRadius: 4,
          p: isMobile ? 1.5 : 3,
          width: isTablet ? "100%" : "none",
          bgcolor: "background.paper",
          flex: 1,
          mb: 2,
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
          <Stack direction={{ xs: "column", sm: "row" }} spacing={2} sx={{ mt: 2, mb: 2 }}>
            <TextField
              select
              fullWidth
              size="small"
              label={tDatePicker("month")}
              value={topMonth}
              onChange={(e) => setTopMonth(Number(e.target.value))}
            >
              {monthOptions.map((x) => (
                <MenuItem key={x.value} value={x.value}>
                  {x.label}
                </MenuItem>
              ))}
            </TextField>

            <TextField
              select
              fullWidth
              size="small"
              label={tDatePicker("year")}
              value={topYear}
              onChange={(e) => setTopYear(Number(e.target.value))}
            >
              {years.map((y) => (
                <MenuItem key={y} value={y}>
                  {y}
                </MenuItem>
              ))}
            </TextField>
          </Stack>

          {topfiveData?.topFiveReports?.map((user) => (
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
                  {Number(user.tokens || 0).toLocaleString()}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Tokens
                </Typography>
              </Box>
            </Box>
          ))}

          {topfiveData?.topFiveReports?.length === 0 && (
            <Box sx={{ textAlign: "center", my: 5 }}>
              <Typography variant="body1" color="text.secondary">
                {t("notfound1")}
              </Typography>
            </Box>
          )}
        </Stack>
      </Box>

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
            title={ai.model_use_name}
            remain={ai.token_count}
            total={ai.token_all}
            today={ai.today}
            average={ai.average}
          />
        ))}
      </Box>
    </Box>
  );
};

export default ReportPage;
