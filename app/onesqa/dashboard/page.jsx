"use client";

import React from "react";
import { useMutation, useQuery } from "@apollo/client/react";
import { GET_ROLES } from "@/graphql/role/queries";
import { GET_ME } from "@/graphql/auth/queries";
import { Box } from "@mui/material";
import { useTranslations } from "next-intl";
import ChatIcon from "@mui/icons-material/Chat";
import SmartToyIcon from "@mui/icons-material/SmartToy";
import GroupIcon from "@mui/icons-material/Group";
import DashboardStatCard from "../../components/DashboardStatCard";
import TokensChart from "@/app/components/TokensChart";
import AlertCard from "@/app/components/AlertCard";
import SystemStatusCard from "@/app/components/SystemStatusCard";
import TokenUsageDashboardBar from "@/app/components/TokenUsageDashboardBar";

const DashboardPage = () => {
  const t = useTranslations("DashboardPage");
  const { data: meData, loading: meLoading, error: meError } = useQuery(GET_ME);
  const { data, loading, error, refetch } = useQuery(GET_ROLES);

  console.log(meData?.me);
  console.log(meError?.message);

  if (meLoading || loading) return <p>กำลังโหลด…</p>;
  if (meError) return <p>ผิดพลาด ME: {meError.message}</p>;
  if (error) return <p>ผิดพลาด ROLES: {error.message}</p>;

  const sampleData = [
    { date: "1 Oct", chatgpt: 900, gemini: 1800, total: 2700 },
    { date: "3 Oct", chatgpt: 2000, gemini: 2500, total: 3000 },
    { date: "7 Oct", chatgpt: 2400, gemini: 2200, total: 2600 },
    { date: "10 Oct", chatgpt: 3100, gemini: 2800, total: 2900 },
    { date: "14 Oct", chatgpt: 2900, gemini: 3200, total: 3500 },
    { date: "20 Oct", chatgpt: 4200, gemini: 2700, total: 3800 },
    { date: "23 Oct", chatgpt: 4000, gemini: 1300, total: 2714 },
    { date: "27 Oct", chatgpt: 3900, gemini: 1700, total: 2900 },
    { date: "30 Oct", chatgpt: 3100, gemini: 3600, total: 2800 },
  ];

  const systemData = [
    { label: "API Connection", status: "ปกติ" },
    { label: "Database", status: "ปกติ" },
    { label: "AI Service", status: "ผิดพลาด" },
    { label: "SSL Certificate", status: "ผิดพลาด" },
  ];

  const handleDetail = () => {
    console.log("🟠 เปิดรายละเอียดการใช้งาน Token");
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box
        sx={{
          border: "1px solid #E5E7EB",
          boxShadow: "0 3px 8px rgba(0,0,0,0.05)",
          borderRadius: 4,
          p: 3,
          bgcolor: "background.paper",
          mb: 2,
        }}
      >
        <AlertCard
          title={t("title1")}
          message={`${t("message1p1")} 75% ${t("message1p2")}`} // ใช้การเชื่อมข้อความแบบ template literal
          onDetailClick={handleDetail}
        />
      </Box>

      <Box
        sx={{
          display: "flex",
          gap: 2,
          flexWrap: "wrap",
          p: 3,
          mb: 2,
          borderRadius: 4,
          border: "1px solid #E5E7EB", // ✅ เส้นขอบรอบนอกเหมือนภาพ
          boxShadow: "0 3px 8px rgba(0,0,0,0.04)",
          bgcolor: "background.paper",
        }}
      >
        <DashboardStatCard
          title={t("card1")}
          value="156"
          percentChange={15}
          icon={<ChatIcon />}
          bgColor="primary.minor"
        />

        <DashboardStatCard
          title={t("card2")}
          value="25,600"
          percentChange={8}
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

      <Box>
        <TokensChart data={sampleData} subtitle={t("subtitle2")}  title={t("title2")} />
      </Box>

      <Box
        sx={{
          border: "1px solid #E5E7EB",
          boxShadow: "0 3px 8px rgba(0,0,0,0.05)",
          borderRadius: 4,
          p: 3,
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
          p: 3,
          bgcolor: "background.paper",
          mb: 4,
        }}
      >
        <TokenUsageDashboardBar 
          title = {t("title4")}
          subtitle = {t("subtitle3")}
          used={500} 
          total={2000} 
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
