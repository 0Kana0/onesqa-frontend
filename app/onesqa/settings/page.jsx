"use client";

import React, { useState, useEffect } from "react";
import { useMutation, useQuery } from "@apollo/client/react";
import { Box, Button, Typography, CircularProgress, useMediaQuery} from "@mui/material";
import SmartToyIcon from "@mui/icons-material/SmartToy"; // 🤖 AI
import AllInclusiveIcon from "@mui/icons-material/AllInclusive"; // 🌐 Model
import HubIcon from "@mui/icons-material/Hub";
import ActionBar from "@/app/components/ActionBar";
import TokenUsageCardSetting from "@/app/components/TokenUsageCardSetting";
import UserGroupSettingCard from "@/app/components/UserGroupSettingCard";
import TokenUsageCard from "@/app/components/TokenUsageCard";
import GroupTokenTable from "@/app/components/GroupTokenTable";
import { useTranslations } from 'next-intl';
import { UPDATE_AI } from "@/graphql/ai/mutations";
import { GET_AIS } from "@/graphql/ai/queries";
import { useRequireRole } from "@/hook/useRequireRole";

const SettingPage = () => {
  const [selected, setSelected] = useState("AI");
  const [viewMode, setViewMode] = useState("card"); // ✅ state อยู่ที่นี่
  const [resetTrigger, setResetTrigger] = useState(0); // ✅ ตัวแปร trigger

  const t = useTranslations('SettingPage');
  const tInit = useTranslations("Init");
  const isMobile = useMediaQuery("(max-width:600px)"); // < md คือจอเล็ก
  const isTablet = useMediaQuery("(max-width:1200px)"); // < md คือจอเล็ก

  // ✅ เก็บสถานะเปิด/ปิดของแต่ละการ์ด
  const [cards, setCards] = useState([
    // {
    //   id: 1,
    //   title: "Gemini 2.5 Pro",
    //   defaultLimit: 1200000000,
    //   used: 200000000,
    //   total: 500000000,
    //   today: 2500,
    //   average: 1800,
    //   enabled: false,
    // },
    // {
    //   id: 2,
    //   title: "ChatGPT 4o",
    //   defaultLimit: 800000000,
    //   used: 150000000,
    //   total: 400000000,
    //   today: 1200,
    //   average: 1000,
    //   enabled: true,
    // },
  ]);

  const [rows, setRows] = useState([
    {
      id: 1,
      group: "Admin",
      tokens: 1000000,
      model: "Gemini 2.5 Pro",
      models: {
        "Gemini 2.5 Pro": { used: 1500000, total: 2000000 },
        "ChatGPT 5": { used: 1200000, total: 2000000 },
      },
    },
    {
      id: 2,
      group: "หัวหน้าภารกิจ",
      tokens: 1000000,
      model: "Gemini 2.5 Pro",
      models: {
        "Gemini 2.5 Pro": { used: 900000, total: 2000000 },
        "ChatGPT 5": { used: 700000, total: 2000000 },
      },
    },
    {
      id: 3,
      group: "เจ้าหน้าที่",
      tokens: 1000000,
      model: "Gemini 2.5 Pro",
      models: {
        "Gemini 2.5 Pro": { used: 500000, total: 2000000 },
        "ChatGPT 5": { used: 300000, total: 2000000 },
      },
    },
  ]);

  const modelOptions = ["Gemini 2.5 Pro", "ChatGPT 5"];

  const {
    data: aisData,
    loading: aisLoading,
    error: aisError,
  } = useQuery(GET_AIS, {
    fetchPolicy: "network-only",
  });
    
  const [updateAi] = useMutation(UPDATE_AI);

  useEffect(() => {
    if (!aisData?.ais.length) return;

    const transformed = aisData?.ais?.map((ai) => {
      return {
        id: ai.id,
        title: ai.model_name,
        defaultLimit: ai.token_count,
        remain: ai.token_count,
        total: ai.token_all,
        today: ai.today,
        average: ai.average,
        enabled: ai.activity,
      };
    });

    setCards(transformed);
  }, [aisData, resetTrigger]);

  console.log(cards);

  const { allowed, loading, user } = useRequireRole({
    roles: ["ผู้ดูแลระบบ"],
    redirectTo: "/onesqa/chat",
  });
    
  if (loading) return null;     // หรือใส่ Skeleton ก็ได้
  if (!allowed) return null;    // ระหว่างกำลัง redirect กันไม่ให้แสดงหน้า

  if (aisLoading)
    return (
      <Box sx={{ textAlign: "center", mt: 5 }}>
        <CircularProgress />
        <Typography>{tInit("loading")}...</Typography>
      </Box>
    );
    
  if (aisError)
    return (
      <Typography color="error" sx={{ mt: 5 }}>
        ❌ {tInit("error")}
      </Typography>
    );

  // 🔹 เมื่อมีการเปลี่ยนแปลงช่องกรอก
  const handleTokenChange = (id, model, value) => {
    setRows((prev) =>
      prev.map((r) =>
        r.id === id
          ? {
              ...r,
              models: {
                ...r.models,
                [model]: { ...r.models[model], tokens: value },
              },
            }
          : r
      )
    );
  };

  const handleSettingChange = (id, field, value) => {
    setRows((prev) =>
      prev.map((r) => (r.id === id ? { ...r, [field]: value } : r))
    );
  };

  const handleLimitChange = (id, newValue) => {
    setCards((prev) =>
      prev.map((card) =>
        card.id === id
          ? { ...card, defaultLimit: Number(newValue) } // ✅ อัปเดตค่าใหม่เฉพาะการ์ดนี้
          : card
      )
    );
  };
  // ✅ ฟังก์ชันสลับ Switch ของแต่ละการ์ด
  const handleToggle = (id) => {
    setCards((prev) =>
      prev.map((card) =>
        card.id === id ? { ...card, enabled: !card.enabled } : card
      )
    );
  };

  const handleViewChange = (mode) => {
    setViewMode(mode);
    console.log("🟢 เปลี่ยนโหมดเป็น:", mode);
  };

  const handleReset = () => {
    setResetTrigger((prev) => prev + 1); // ✅ trigger ให้ useEffect ทำงานใหม่
  };

  const handleSubmit = async () => {
    console.log(cards);

    try {
      // ✅ ใช้ Promise.all เพื่ออัปเดตพร้อมกันทั้งหมด
      const results = await Promise.all(
        cards.map(async (card) => {
          const { data } = await updateAi({
            variables: {
              id: card.id, // id ของ AI record
              input: {
                token_count: Number(card.defaultLimit),
                token_all: Number(card.defaultLimit),
                activity: card.enabled,
              },
            },
          });
          return data.updateAi;
        })
      );

      console.log("✅ Update success:", results);
    } catch (error) {
      console.log(error); 
    }
  }

  const buttons = [
    { label: "AI", icon: <SmartToyIcon />, value: "AI" },
    { label: "Model", icon: <AllInclusiveIcon />, value: "Model" },
    { label: t('button1'), icon: <HubIcon />, value: "Tokens" },
  ];

  // ✅ เนื้อหาที่จะเปลี่ยนตามปุ่ม
  const renderContent = () => {
    switch (selected) {
      case "AI":
        return (
          <Box
            sx={{
              border: "1px solid #E5E7EB",
              boxShadow: "0 3px 8px rgba(0,0,0,0.04)",
              borderRadius: 3,
              bgcolor: "background.paper",
              p: isMobile ? 1.5 : 3,
            }}
          >
            <Typography variant="h6" fontWeight={600}>
              {t('aititle1')}
            </Typography>
            <Typography variant="body1" sx={{ mt: 1 }} color="text.secondary">
              {t('aisubtitle1')}
            </Typography>
          </Box>
        );
      case "Model":
        return (
          <Box
            sx={{
              display: "flex", // ใช้ flex layout
              flexDirection: "column", // ✅ เรียงในแนวตั้ง
              gap: 2, // ✅ ระยะห่างระหว่างการ์ด (theme.spacing * 2 = 16px)
            }}
          >
            {cards.map((card) => (
              <TokenUsageCardSetting
                key={card.id}
                title={
                  card.title === "gpt-4o"
                    ? "ChatGPT 4o"
                    : card.title === "gemini-2.5-pro"
                    ? "Gemini 2.5 Pro"
                    : card.title
                }
                defaultLimit={card.defaultLimit}
                remain={card.remain}
                total={card.total}
                today={card.today}
                average={card.average}
                enabled={card.enabled}
                onToggle={() => handleToggle(card.id)} // ✅ ส่งฟังก์ชันลงไป
                onLimitChange={(newValue) => handleLimitChange(card.id, newValue)} // ✅ เพิ่มตรงนี้
              />
            ))}
          </Box>
        );
      case "Tokens":
        return (
          <Box
            sx={{
              border: "1px solid #E5E7EB",
              boxShadow: "0 3px 8px rgba(0,0,0,0.04)",
              borderRadius: 3,
              bgcolor: "background.paper",
              p: isMobile ? 1.5 : 3,
              display: "flex", // ใช้ flex layout
              flexDirection: "column", // ✅ เรียงในแนวตั้ง
              gap: isMobile ? 5 : 2, // ✅ ระยะห่างระหว่างการ์ด (theme.spacing * 2 = 16px)
            }}
          >
            {viewMode === "card" ? (
              <>
                <Box
                  sx={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: 2,
                  }}
                >
                  <Box sx={{ flex: 1 }}>
                    <UserGroupSettingCard
                      roleName="Admin"
                      defaultLimit={1000000}
                      modelOptions={["Gemini 2.5 Pro", "ChatGPT 4o"]}
                      defaultModel="Gemini 2.5 Pro"
                      onChange={(field, value) =>
                        handleSettingChange("Admin", field, value)
                      }
                    />
                  </Box>
                  <Box sx={{ flex: 1 }}>
                    <TokenUsageCard
                      title="Gemini 2.5 Pro"
                      remain={1500000}
                      total={2000000}
                      today={2500}
                      average={1800}
                      always={true}
                    />
                  </Box>
                  <Box sx={{ flex: 1 }}>
                    <TokenUsageCard
                      title="Gemini 2.5 Pro"
                      remain={1500000}
                      total={2000000}
                      today={2500}
                      average={1800}
                      always={true}
                    />
                  </Box>
                </Box>
                <Box
                  sx={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: 2,
                  }}
                >
                  <Box sx={{ flex: 1 }}>
                    <UserGroupSettingCard
                      roleName="Admin"
                      defaultLimit={1000000}
                      modelOptions={["Gemini 2.5 Pro", "ChatGPT 4o"]}
                      defaultModel="Gemini 2.5 Pro"
                      onChange={(field, value) =>
                        handleSettingChange("Admin", field, value)
                      }
                    />
                  </Box>
                  <Box sx={{ flex: 1 }}>
                    <TokenUsageCard
                      title="Gemini 2.5 Pro"
                      remain={1500000}
                      total={2000000}
                      today={2500}
                      average={1800}
                      always={true}
                    />
                  </Box>
                  <Box sx={{ flex: 1 }}>
                    <TokenUsageCard
                      title="Gemini 2.5 Pro"
                      remain={1500000}
                      total={2000000}
                      today={2500}
                      average={1800}
                      always={true}
                    />
                  </Box>
                </Box>
              </>
            ) : (
              <>
                <GroupTokenTable
                  rows={rows}
                  modelOptions={modelOptions}
                  onChange={handleSettingChange}
                />
              </>
            )}
          </Box>
        );
      default:
        return null;
    }
  };
  
  return (
    <div>
      <Box sx={{ p: isMobile ? 0 : 3 }}>
        <ActionBar
          onSubmit={() => handleSubmit()}
          onClearData={() => handleReset()}
          viewMode={viewMode}
          onViewChange={handleViewChange}
          settingMode={selected}
        />

        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            flexDirection: isTablet ? "column" : "row", // ✅ สลับแนวตามจอ
            alignItems: isTablet ? "flex-start" : "center",
            gap: 1,
            p: 1,
            bgcolor: "background.paper",
            borderRadius: 3,
            border: "1px solid #E5E7EB",
            boxShadow: "0 3px 8px rgba(0,0,0,0.04)",
            mb: 2,
          }}
        >
          {buttons.map((btn) => {
            const isSelected = selected === btn.value;
            return (
              <Button
                key={btn.value}
                onClick={() => setSelected(btn.value)}
                startIcon={btn.icon}
                variant="contained"
                sx={{
                  flex: 1,
                  textTransform: "none",
                  borderRadius: 2,
                  px: 3,
                  py: 1.5,
                  width: isTablet ? "100%" : "none",
                  fontWeight: 600,
                  bgcolor: isSelected ? "#1976d2" : "#e3f2fd",
                  color: isSelected ? "#fff" : "#1976d2",
                  boxShadow: isSelected ? "0 2px 6px rgba(0,0,0,0.15)" : "none",
                  "&:hover": {
                    bgcolor: isSelected ? "#1565c0" : "#dbeafe",
                  },
                }}
              >
                {btn.label}
              </Button>
            );
          })}
        </Box>

        {/* เนื้อหาที่เปลี่ยนตามปุ่ม */}
        {renderContent()}
      </Box>
    </div>
  );
};

export default SettingPage;
