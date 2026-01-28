"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { NetworkStatus } from "@apollo/client";
import { useMutation, useQuery, useApolloClient } from "@apollo/client/react";
import { GET_ROLES } from "@/graphql/role/queries";
import { ONLINE_USERS } from "@/graphql/userStatus/queries";
import { GET_ME } from "@/graphql/auth/queries";
import { GET_AIS } from "@/graphql/ai/queries";
import {
  Box,
  Typography,
  CircularProgress,
  useMediaQuery,
  Select,
  MenuItem,
  TextField,
  Stack,
} from "@mui/material";
// ใช้ dayjs (แนะนำเปิด timezone ให้ตรง Asia/Bangkok)
import dayjs from "dayjs";
import "dayjs/locale/th";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import { useTranslations } from "next-intl";
import { useLanguage } from "@/app/context/LanguageContext";
import ChatIcon from "@mui/icons-material/Chat";
import SmartToyIcon from "@mui/icons-material/SmartToy";
import GroupIcon from "@mui/icons-material/Group";
import DashboardStatCard from "../../components/DashboardStatCard";
import TokensChart from "@/app/components/TokensChart";
import AlertCard from "@/app/components/AlertCard";
import SystemStatusCard from "@/app/components/SystemStatusCard";
import TokenUsageDashboardBar from "@/app/components/TokenUsageDashboardBar";
import OnlineUsersListener from "@/app/components/OnlineUsersListener";
import { useRequireRole } from "@/hook/useRequireRole";
import {
  CHART_REPORTS,
  MESSAGE_REPORTS,
  PERIOD_CHART_REPORTS,
  TOKEN_REPORTS,
} from "@/graphql/report/queries";
import UserCountChart from "@/app/components/UserCountChart";
import { USER_COUNT_REPORTS, CHART_USER_COUNT_REPORTS } from "@/graphql/user_count/queries";
import LocalizedDatePicker from "@/app/components/LocalizedDatePicker";
import { DataFilter } from "@/app/components/DateFilter";
import PeriodReportChart from "@/app/components/PeriodReportChart";
import { PERIOD_USERS_ACTIVE } from "@/graphql/user_daily_active/queries";

function getLast5Years() {
  const y = new Date().getFullYear();
  return Array.from({ length: 5 }, (_, i) => y - i);
}

const DashboardPage = () => {
  dayjs.extend(utc);
  dayjs.extend(timezone);
  dayjs.tz.setDefault("Asia/Bangkok"); // เอาออกได้ถ้าไม่อยาก fix timezone

  const years = useMemo(() => getLast5Years(), []);
  const now = dayjs();
  const { locale } = useLanguage();

  const t = useTranslations("DashboardPage");
  const tReport = useTranslations("ReportPage");
  const tInit = useTranslations("Init");
  const tPeriodReportChart = useTranslations("PeriodReportChart");
  const isMobile = useMediaQuery("(max-width:600px)"); // < md คือจอเล็ก
  const isTablet = useMediaQuery("(max-width:1200px)"); // < md คือจอเล็ก

  // ✅ Token chart filter
  const [quickRangeToken, setQuickRangeToken] = useState("7วันย้อนหลัง");
  const [startDateToken, setStartDateToken] = useState(() =>
    dayjs().subtract(6, "day").startOf("day").format("YYYY-MM-DD")
  );
  const [endDateToken, setEndDateToken] = useState(() =>
    dayjs().endOf("day").format("YYYY-MM-DD")
  );

  // ✅ UserCount chart filter
  const [quickRangeUserCount, setQuickRangeUserCount] = useState("7วันย้อนหลัง");
  const [startDateUserCount, setStartDateUserCount] = useState(() =>
    dayjs().subtract(6, "day").startOf("day").format("YYYY-MM-DD")
  );
  const [endDateUserCount, setEndDateUserCount] = useState(() =>
    dayjs().endOf("day").format("YYYY-MM-DD")
  );

  const [periodToken, setPeriodToken] = useState({ mode: "daily", date: dayjs() });
  const [dailyDateToken, setDailyDateToken] = useState(
    periodToken?.mode === "daily" ? periodToken.date : now
  );
  const [monthToken, setMonthToken] = useState(
    periodToken?.mode === "monthly" ? periodToken.month : now.month() + 1
  );
  const [yearToken, setYearToken] = useState(
    periodToken?.mode === "monthly"
      ? periodToken.year
      : periodToken?.mode === "yearly"
      ? periodToken.year
      : years[0]
  );

  const [periodUser, setPeriodUser] = useState({ mode: "daily", date: dayjs() });
  const [dailyDateUser, setDailyDateUser] = useState(
    periodUser?.mode === "daily" ? periodUser.date : now
  );
  const [monthUser, setMonthUser] = useState(
    periodUser?.mode === "monthly" ? periodUser.month : now.month() + 1
  );
  const [yearUser, setYearUser] = useState(
    periodUser?.mode === "monthly"
      ? periodUser.year
      : periodUser?.mode === "yearly"
      ? periodUser.year
      : years[0]
  );

  const userGraph = [
    { model_type: "LOGIN", model_use_name: tPeriodReportChart("login") },
    { model_type: "ACTIVE", model_use_name: tPeriodReportChart("active") }
  ]

  // const { data: meData, loading: meLoading, error: meError } = useQuery(GET_ME);
  // const { data, loading, error, refetch } = useQuery(GET_ROLES);

  // console.log(meData?.me);
  // console.log(meError?.message);

  // if (meLoading || loading) return <p>กำลังโหลด…</p>;
  // if (meError) return <p>ผิดพลาด ME: {meError.message}</p>;
  // if (error) return <p>ผิดพลาด ROLES: {error.message}</p>;

  const [summary, setSummary] = useState({
    totalTokenCount: 0,
    totalTokenAll: 0,
  });

  const systemData = [
    { label: "API Connection", status: "ปกติ" },
    { label: "Database", status: "ปกติ" },
    { label: "AI Service", status: "ผิดพลาด" },
    { label: "SSL Certificate", status: "ผิดพลาด" },
  ];

  const {
    data: aisData,
    loading: aisLoading,
    error: aisError,
  } = useQuery(GET_AIS, {
    fetchPolicy: "network-only",
  });

  const {
    data: messageData,
    loading: messageLoading,
    error: messageError,
  } = useQuery(MESSAGE_REPORTS, {
    fetchPolicy: "network-only",
  });

  const {
    data: tokenData,
    loading: tokenLoading,
    error: tokenError,
  } = useQuery(TOKEN_REPORTS, {
    fetchPolicy: "network-only",
  });

  const {
    data: userCountData,
    loading: userCountLoading,
    error: userCountError,
  } = useQuery(USER_COUNT_REPORTS, {
    fetchPolicy: "network-only",
  });

  const {
    data: chartData,
    loading: chartLoading,
    error: chartError,
    networkStatus,
  } = useQuery(CHART_REPORTS, {
    fetchPolicy: "cache-and-network",
    notifyOnNetworkStatusChange: true,
    variables: {
      startDate: startDateToken,
      endDate: endDateToken,
    },
  });

  const {
    data: userCountChartData,
    loading: userCountChartLoading,
    error: userCountChartError,
    networkStatus: userCountChartNetworkStatus,
  } = useQuery(CHART_USER_COUNT_REPORTS, {
    fetchPolicy: "cache-and-network",
    notifyOnNetworkStatusChange: true,
    variables: {
      startDate: startDateUserCount,
      endDate: endDateUserCount,
    },
  });

  const periodTokenVar = useMemo(() => ({
    mode: periodToken?.mode || "daily",
    date:
      periodToken?.mode === "daily" && dailyDateToken
        ? dayjs(dailyDateToken).tz("Asia/Bangkok").startOf("day").format()
        : null,
    month: periodToken?.mode === "monthly" ? Number(monthToken) : null,
    year:
      periodToken?.mode === "monthly" || periodToken?.mode === "yearly"
        ? Number(yearToken)
        : null,
  }), [periodToken?.mode, dailyDateToken, monthToken, yearToken]);

  const {
    data: periodChartData,
    loading: periodChartLoading,
    error: periodChartError,
    networkStatus: periodNetworkStatus,
  } = useQuery(PERIOD_CHART_REPORTS, {
    fetchPolicy: "cache-and-network",
    notifyOnNetworkStatusChange: true,
    variables: { period: periodTokenVar },
  });

  const periodUserVar = useMemo(() => ({
    mode: periodUser?.mode || "daily",
    date:
      periodUser?.mode === "daily" && dailyDateUser
        ? dayjs(dailyDateUser).tz("Asia/Bangkok").startOf("day").format()
        : null,
    month: periodUser?.mode === "monthly" ? Number(monthUser) : null,
    year:
      periodUser?.mode === "monthly" || periodUser?.mode === "yearly"
        ? Number(yearUser)
        : null,
  }), [periodUser?.mode, dailyDateUser, monthUser, yearUser]);

  const {
    data: periodUserData,
    loading: periodUserLoading,
    error: periodUserError,
    networkStatus: periodUserNetworkStatus,
  } = useQuery(PERIOD_USERS_ACTIVE, {
    fetchPolicy: "cache-and-network",
    notifyOnNetworkStatusChange: true,
    variables: { period: periodUserVar },
  });

  // const {
  //   data: onlineUsersData,
  //   loading: onlineUsersLoading,
  //   error: onlineUsersError,
  //   refetch,
  // } = useQuery(ONLINE_USERS, {
  //   fetchPolicy: "network-only",
  // });

  useEffect(() => {
    if (!aisData?.ais?.length) return;

    // ✅ รวมข้อมูลแต่ละฟิลด์
    const totalTokenCount = aisData.ais.reduce(
      (sum, ai) => sum + (ai.token_count || 0),
      0
    );
    const totalTokenAll = aisData.ais.reduce(
      (sum, ai) => sum + (ai.token_all || 0),
      0
    );

    // ✅ ตั้งค่า state สรุป
    setSummary({
      totalTokenCount,
      totalTokenAll,
    });
  }, [aisData]);

  const { allowed, loading, user } = useRequireRole({
    roles: ["ผู้ดูแลระบบ", "superadmin"],
    redirectTo: "/onesqa/chat",
  });

  if (loading) return null; // หรือใส่ Skeleton ก็ได้
  if (!allowed) return null; // ระหว่างกำลัง redirect กันไม่ให้แสดงหน้า

  // โชว์โหลดเฉพาะ "ครั้งแรกจริง ๆ" (ยังไม่มี data)
  const isInitialLoading =
    networkStatus === NetworkStatus.loading && !chartData;

  const isInitialLoadingUserCountChart =
    userCountChartNetworkStatus === NetworkStatus.loading && !userCountChartData;

  const isInitialLoadingPeriod =
    periodNetworkStatus === NetworkStatus.loading && !periodChartData;

  const isInitialLoadingPeriodUser =
    periodUserNetworkStatus === NetworkStatus.loading && !periodUserData;

  if (isInitialLoading || isInitialLoadingPeriod || isInitialLoadingPeriodUser || isInitialLoadingUserCountChart)
    return (
      <Box sx={{ textAlign: "center", mt: 5 }}>
        <CircularProgress />
        <Typography>{tInit("loading")}...</Typography>
      </Box>
    );

  if (aisError || tokenError || messageError || chartError || userCountError || periodChartError || periodUserError || userCountChartError)
    return (
      <Typography color="error" sx={{ mt: 5 }}>
        ❌ {tInit("error")}
      </Typography>
    );

  //console.log(aisData?.ais);
  //console.log(chartData?.chartReports);

  const aiGraph = aisData?.ais?.map(ai => ({
    model_use_name: ai.model_use_name,
    model_type: ai.model_type,
  }));

  function pivotUsageByDate(
    rows,
    {
      locale = "en-GB", // 'th-TH' ได้เช่นกัน → "30 ต.ค. 2025"
      keepZeroDays = false,
    } = {}
  ) {
    if (!Array.isArray(rows) || rows.length === 0) return [];

    const byDate = new Map();

    for (const r of rows) {
      if (!r || !r.date) continue;
      const key = r.date; // 'YYYY-MM-DD'
      if (!byDate.has(key))
        byDate.set(key, { dateISO: key, gpt: 0, gemini: 0 });

      const acc = byDate.get(key);
      const tokens = Number(r.total_tokens ?? 0) || 0;

      if (/gpt/i.test(r.model)) acc.gpt += tokens;
      else if (/gemini/i.test(r.model)) acc.gemini += tokens;
    }

    const fmt = new Intl.DateTimeFormat(locale, {
      day: "numeric",
      month: "short",
      year: "numeric",
      timeZone: "UTC", // กันสไลด์วันข้ามโซนเวลา
    });

    let result = [...byDate.values()]
      .sort((a, b) => a.dateISO.localeCompare(b.dateISO))
      .map(({ dateISO, gpt, gemini }) => {
        const [y, m, d] = dateISO.split("-").map(Number);
        const dt = new Date(Date.UTC(y, m - 1, d));
        return {
          date: fmt.format(dt), // -> "30 Oct 2025"
          gpt,
          gemini,
          total: gpt + gemini,
        };
      });

    return result;
  }

  // ใช้
  const output = pivotUsageByDate(chartData?.chartReports);

  const getRangeFromQuick = (range) => {
    const now = dayjs();
    switch (range) {
      case "7วันย้อนหลัง": {
        const s = now.subtract(6, "day").startOf("day");
        return { start: s, end: now.endOf("day") };
      }
      case "30วันย้อนหลัง": {
        const s = now.subtract(29, "day").startOf("day");
        return { start: s, end: now.endOf("day") };
      }
      case "60วันย้อนหลัง": {
        const s = now.subtract(59, "day").startOf("day");
        return { start: s, end: now.endOf("day") };
      }
      default:
        return { start: null, end: null };
    }
  };
  const applyQuickRange = (range, setStart, setEnd) => {
    const { start, end } = getRangeFromQuick(range);
    setStart(start ? start.format("YYYY-MM-DD") : "");
    setEnd(end ? end.format("YYYY-MM-DD") : "");
  };

  function mapUserCountChart(rows, { locale = "en-GB" } = {}) {
    if (!Array.isArray(rows) || rows.length === 0) return [];

    const fmt = new Intl.DateTimeFormat(locale, {
      day: "numeric",
      month: "short",
      year: "numeric",
      timeZone: "UTC", // กันสไลด์วัน
    });

    return rows
      .map((r) => {
        const iso = String(r?.date || "").slice(0, 10); // "YYYY-MM-DD"
        if (!iso) return null;

        const [y, m, d] = iso.split("-").map(Number);
        const dt = new Date(Date.UTC(y, m - 1, d));

        return {
          dateISO: iso,
          date: fmt.format(dt),
          total_user: Number(r?.total_user ?? 0) || 0,
        };
      })
      .filter(Boolean)
      .sort((a, b) => a.dateISO.localeCompare(b.dateISO))
      .map(({ date, total_user }) => ({ date, total_user }));
  }
  const userCountSeries = mapUserCountChart(userCountChartData?.chartUserCountReports);

  const handleDetail = () => {
    console.log("🟠 เปิดรายละเอียดการใช้งาน Token");
  };

  return (
    <Box sx={{ p: isMobile ? 0 : 3 }}>
      {summary.totalTokenAll > 0 &&
        (summary.totalTokenCount / summary.totalTokenAll) * 100 <= 15 && (
          <Box
            sx={{
              border: "1px solid #E5E7EB",
              boxShadow: "0 3px 8px rgba(0,0,0,0.05)",
              borderRadius: 4,
              p: isMobile ? 1.5 : 3,
              bgcolor: "background.paper",
              mb: 2,
            }}
          >
            <AlertCard
              title={t("title1")}
              message={`${t("message1p1")} 85% ${t("message1p2")}`}
              onDetailClick={handleDetail}
            />
          </Box>
        )}

      {/* <OnlineUsersListener 
        online={onlineUsersData?.onlineUsers} 
        refetch={refetch}
      /> */}

      <Box
        sx={{
          display: "flex",
          gap: 2,
          flexWrap: "wrap",
          p: isMobile ? 1.5 : 3,
          mb: 2,
          borderRadius: 4,
          border: "1px solid #E5E7EB", // ✅ เส้นขอบรอบนอกเหมือนภาพ
          boxShadow: "0 3px 8px rgba(0,0,0,0.04)",
          bgcolor: "background.paper",
        }}
      >
        <DashboardStatCard
          title={t("card1")}
          value={messageData?.cardMessageReports?.value.toLocaleString()}
          percentChange={messageData?.cardMessageReports?.percentChange}
          icon={<ChatIcon />}
          bgColor="primary.minor"
        />

        <DashboardStatCard
          title={t("card2")}
          value={tokenData?.cardTokenReports?.value.toLocaleString()}
          percentChange={tokenData?.cardTokenReports?.percentChange}
          icon={<SmartToyIcon />}
          bgColor="primary.minor"
        />

        <DashboardStatCard
          title={t("card3")}
          value={userCountData?.cardUserCountReports?.value.toLocaleString()}
          percentChange={userCountData?.cardUserCountReports?.percentChange}
          icon={<GroupIcon />}
          bgColor="primary.minor"
        />
      </Box>

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
          {t("title2")}
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
            value={quickRangeToken}
            onChange={(e) => {
              const val = e.target.value;
              setQuickRangeToken(val);
              applyQuickRange(val, setStartDateToken, setEndDateToken);
            }}
            size="small"
            sx={{ width: isTablet ? "100%" : "none", flex: 1 }}
          >
            <MenuItem value="7วันย้อนหลัง">{t("select1")}</MenuItem>
            <MenuItem value="30วันย้อนหลัง">{t("select2")}</MenuItem>
            <MenuItem value="60วันย้อนหลัง">{t("select3")}</MenuItem>
          </Select>

          {/* วันที่เริ่มต้น */}
          <LocalizedDatePicker
            label={tReport("startDate")}
            value={startDateToken}
            onChange={(v) => setStartDateToken(v)}
            textFieldProps={{ size: "small", sx: { width: isTablet ? "100%" : 200 } }}
          />

          {/* วันที่สิ้นสุด */}
          <LocalizedDatePicker
            label={tReport("endDate")}
            value={endDateToken}
            onChange={(v) => setEndDateToken(v)}
            textFieldProps={{ size: "small", sx: { width: isTablet ? "100%" : 200 } }}
          />
        </Box>
      </Box>
      <Box>
        <TokensChart 
          data={output} 
          aiGraph={aiGraph}
          locale={locale}
        />
      </Box>

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
          {t("titleusercount1")} {/* การ์ดจำนวนผู้ใช้งาน */}
        </Typography>

        <Box
          sx={{
            display: "flex",
            flexDirection: isTablet ? "column" : "row",
            alignItems: isTablet ? "flex-start" : "center",
            gap: 2,
          }}
        >
          <Select
            value={quickRangeUserCount}
            onChange={(e) => {
              const val = e.target.value;
              setQuickRangeUserCount(val);
              applyQuickRange(val, setStartDateUserCount, setEndDateUserCount);
            }}
            size="small"
            sx={{ width: isTablet ? "100%" : "none", flex: 1 }}
          >
            <MenuItem value="7วันย้อนหลัง">{t("select1")}</MenuItem>
            <MenuItem value="30วันย้อนหลัง">{t("select2")}</MenuItem>
            <MenuItem value="60วันย้อนหลัง">{t("select3")}</MenuItem>
          </Select>

          <LocalizedDatePicker
            label={tReport("startDate")}
            value={startDateUserCount}
            onChange={(v) => setStartDateUserCount(v)}
            textFieldProps={{ size: "small", sx: { width: isTablet ? "100%" : 200 } }}
          />

          <LocalizedDatePicker
            label={tReport("endDate")}
            value={endDateUserCount}
            onChange={(v) => setEndDateUserCount(v)}
            textFieldProps={{ size: "small", sx: { width: isTablet ? "100%" : 200 } }}
          />
        </Box>
      </Box>
      <Box>
        <UserCountChart
          data={userCountSeries}
          locale={locale}
        />
      </Box>

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
            {t("title5")}
          </Typography>

          <DataFilter 
            value={periodToken} 
            onChange={setPeriodToken} 
            dailyDate={dailyDateToken}
            setDailyDate={setDailyDateToken}
            month={monthToken}
            setMonth={setMonthToken}
            year={yearToken}
            setYear={setYearToken}
            now={now}
            years={years}
          />
        </Stack>
      </Box>
      <PeriodReportChart 
        type="model"
        period={periodToken} 
        events={periodChartData?.periodChartReports} 
        locale={locale} 
        aiGraph={aiGraph}
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
            {t("title6")}
          </Typography>

          <DataFilter
            value={periodUser}
            onChange={setPeriodUser}
            dailyDate={dailyDateUser}
            setDailyDate={setDailyDateUser}
            month={monthUser}
            setMonth={setMonthUser}
            year={yearUser}
            setYear={setYearUser}
            now={now}
            years={years}
          />
        </Stack>
      </Box>
      <PeriodReportChart 
        type="user"
        period={periodUser} 
        events={periodUserData?.periodUsersActive} 
        locale={locale} 
        aiGraph={userGraph}
      />

      {/* <Box
        sx={{
          border: "1px solid #E5E7EB",
          boxShadow: "0 3px 8px rgba(0,0,0,0.05)",
          borderRadius: 4,
          p: isMobile ? 1.5 : 3,
          bgcolor: "background.paper",
          mb: 2,
        }}
      >
        <SystemStatusCard
          title={t("title3")}
          subtitle={t("subtitle1")}
          items={systemData}
        />
      </Box> */}

      <Box
        sx={{
          border: "1px solid #E5E7EB",
          boxShadow: "0 3px 8px rgba(0,0,0,0.05)",
          borderRadius: 4,
          p: isMobile ? 1.5 : 3,
          bgcolor: "background.paper",
          mb: 4,
        }}
      >
        <TokenUsageDashboardBar
          title={t("title4")}
          subtitle={t("subtitle3")}
          remain={summary.totalTokenCount}
          total={summary.totalTokenAll}
        />
      </Box>

      {/* <h1>Roles</h1>
      <button onClick={() => refetch()}>รีเฟรช</button>
      <ul>
        {data.roles.map((p) => (
          <li
            key={p.id}
            style={{ display: "flex", gap: 8, alignItems: "center" }}
          >
            {p.role_name_th}
          </li>
        ))}
      </ul> */}
    </Box>
  );
};

export default DashboardPage;
