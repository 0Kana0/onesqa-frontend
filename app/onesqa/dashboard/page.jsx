"use client";

import React, { useState, useEffect } from "react";
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
} from "@mui/material";
// ใช้ dayjs (แนะนำเปิด timezone ให้ตรง Asia/Bangkok)
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import { useTranslations } from "next-intl";
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
  TOKEN_REPORTS,
} from "@/graphql/report/queries";

const DashboardPage = () => {
  dayjs.extend(utc);
  dayjs.extend(timezone);
  dayjs.tz.setDefault("Asia/Bangkok"); // เอาออกได้ถ้าไม่อยาก fix timezone

  const t = useTranslations("DashboardPage");
  const tReport = useTranslations("ReportPage");
  const tInit = useTranslations("Init");
  const isMobile = useMediaQuery("(max-width:600px)"); // < md คือจอเล็ก
  const isTablet = useMediaQuery("(max-width:1200px)"); // < md คือจอเล็ก

  const [quickRange, setQuickRange] = useState("30วันย้อนหลัง");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

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
    data: chartData,
    loading: chartLoading,
    error: chartError,
    networkStatus,
  } = useQuery(CHART_REPORTS, {
    fetchPolicy: "network-only",
    variables: {
      startDate: startDate,
      endDate: endDate,
    },
  });

  const {
    data: onlineUsersData,
    loading: onlineUsersLoading,
    error: onlineUsersError,
    refetch,
  } = useQuery(ONLINE_USERS, {
    fetchPolicy: "network-only",
  });

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
    roles: ["ผู้ดูแลระบบ"],
    redirectTo: "/onesqa/chat",
  });

  if (loading) return null; // หรือใส่ Skeleton ก็ได้
  if (!allowed) return null; // ระหว่างกำลัง redirect กันไม่ให้แสดงหน้า

  // โชว์โหลดเฉพาะ "ครั้งแรกจริง ๆ" (ยังไม่มี data)
  const isInitialLoading =
    networkStatus === NetworkStatus.loading && !chartData?.chartReports;

  if (isInitialLoading)
    return (
      <Box sx={{ textAlign: "center", mt: 5 }}>
        <CircularProgress />
        <Typography>{tInit("loading")}...</Typography>
      </Box>
    );

  if (aisError || onlineUsersError || tokenError || messageError || chartError)
    return (
      <Typography color="error" sx={{ mt: 5 }}>
        ❌ {tInit("error")}
      </Typography>
    );

  console.log(aisData?.ais);
  console.log(chartData?.chartReports);

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
        byDate.set(key, { dateISO: key, chatgpt: 0, gemini: 0 });

      const acc = byDate.get(key);
      const tokens = Number(r.total_tokens ?? 0) || 0;

      if (/chatgpt/i.test(r.model)) acc.chatgpt += tokens;
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
      .map(({ dateISO, chatgpt, gemini }) => {
        const [y, m, d] = dateISO.split("-").map(Number);
        const dt = new Date(Date.UTC(y, m - 1, d));
        return {
          date: fmt.format(dt), // -> "30 Oct 2025"
          chatgpt,
          gemini,
          total: chatgpt + gemini,
        };
      });

    return result;
  }

  // ใช้
  const output = pivotUsageByDate(chartData?.chartReports);
  console.log(output);

  const getRangeFromQuick = (range) => {
    const now = dayjs(); // จะใช้ Asia/Bangkok จากด้านบน
    switch (range) {
      case "7วันย้อนหลัง": {
        const s7 = now.subtract(6, "day").startOf("day"); // รวมวันนี้ = 7 วัน
        return { start: s7, end: now.endOf("day") };
      }
      case "30วันย้อนหลัง": {
        const s30 = now.subtract(29, "day").startOf("day"); // รวมวันนี้ ~30 วัน
        return { start: s30, end: now.endOf("day") };
      }
      case "60วันย้อนหลัง": {
        const s60 = now.subtract(59, "day").startOf("day"); // รวมวันนี้ ~60 วัน
        return { start: s60, end: now.endOf("day") };
      }
      default:
        return { start: null, end: null };
    }
  };
  const applyQuickRange = (range) => {
    const { start, end } = getRangeFromQuick(range);
    setStartDate(start ? start.format("YYYY-MM-DD") : "");
    setEndDate(end ? end.format("YYYY-MM-DD") : "");
  };

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
          value="12"
          percentChange={-3}
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
          {tReport("filter1")}
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
            value={quickRange}
            onChange={(e) => {
              const val = e.target.value;
              setQuickRange(val);
              applyQuickRange(val); // << เซ็ต start/end ที่นี่
            }}
            size="small"
            sx={{ width: isTablet ? "100%" : "none", flex: 1 }}
          >
            <MenuItem value="7วันย้อนหลัง">7วันย้อนหลัง</MenuItem>
            <MenuItem value="30วันย้อนหลัง">30วันย้อนหลัง</MenuItem>
            <MenuItem value="60วันย้อนหลัง">60วันย้อนหลัง</MenuItem>
          </Select>

          {/* วันที่เริ่มต้น */}
          <TextField
            label={tReport("startDate")}
            type="date"
            value={startDate}
            onChange={(e) => {
              setStartDate(e.target.value);
            }}
            size="small"
            sx={{ width: isTablet ? "100%" : 200 }}
            InputLabelProps={{ shrink: true }}
          />

          {/* วันที่สิ้นสุด */}
          <TextField
            label={tReport("endDate")}
            type="date"
            value={endDate}
            onChange={(e) => {
              setEndDate(e.target.value);
            }}
            size="small"
            sx={{ width: isTablet ? "100%" : 200 }}
            InputLabelProps={{ shrink: true }}
          />
        </Box>
      </Box>

      <Box>
        <TokensChart
          data={output}
          subtitle={t("subtitle2")}
          title={t("title2")}
        />
      </Box>

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
        <SystemStatusCard
          title={t("title3")}
          subtitle={t("subtitle1")}
          items={systemData}
        />
      </Box>

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
            {p.role_name}
          </li>
        ))}
      </ul> */}
    </Box>
  );
};

export default DashboardPage;
