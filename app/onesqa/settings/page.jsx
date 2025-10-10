"use client";

import React, { useState } from "react";
import { Box, Button, Typography } from "@mui/material";
import SmartToyIcon from "@mui/icons-material/SmartToy"; // 🤖 AI
import AllInclusiveIcon from "@mui/icons-material/AllInclusive"; // 🌐 Model
import HubIcon from "@mui/icons-material/Hub";
import ActionBar from "@/app/components/ActionBar";
import TokenUsageCardSetting from "@/app/components/TokenUsageCardSetting";
import UserGroupSettingCard from "@/app/components/UserGroupSettingCard";
import TokenUsageCard from "@/app/components/TokenUsageCard";
import GroupTokenTable from "@/app/components/GroupTokenTable";

const SettingPage = () => {
  const [selected, setSelected] = useState("AI");
  const [viewMode, setViewMode] = useState("card"); // ✅ state อยู่ที่นี่

  // ✅ เก็บสถานะเปิด/ปิดของแต่ละการ์ด
  const [cards, setCards] = useState([
    {
      id: 1,
      title: "Gemini 2.5 Pro",
      used: 200000000,
      total: 500000000,
      today: 2500,
      average: 1800,
      enabled: false,
    },
    {
      id: 2,
      title: "ChatGPT 4o",
      used: 150000000,
      total: 400000000,
      today: 1200,
      average: 1000,
      enabled: true,
    },
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

  const buttons = [
    { label: "AI", icon: <SmartToyIcon />, value: "AI" },
    { label: "Model", icon: <AllInclusiveIcon />, value: "Model" },
    { label: "กำหนด Tokens รายกลุ่ม", icon: <HubIcon />, value: "Tokens" },
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
              p: 3,
            }}
          >
            <Typography variant="h6" fontWeight={600}>
              การตั้งค่า AI Chatbot
            </Typography>
            <Typography variant="body1" sx={{ mt: 1 }}>
              กำหนดแนวทางการตั้งคำถาม (สูงสุด 5 คำถาม)
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
                title={card.title}
                used={card.used}
                total={card.total}
                today={card.today}
                average={card.average}
                enabled={card.enabled}
                onToggle={() => handleToggle(card.id)} // ✅ ส่งฟังก์ชันลงไป
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
              p: 3,
              display: "flex", // ใช้ flex layout
              flexDirection: "column", // ✅ เรียงในแนวตั้ง
              gap: 2, // ✅ ระยะห่างระหว่างการ์ด (theme.spacing * 2 = 16px)
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
                      used={1500000}
                      total={2000000}
                      today={2500}
                      average={1800}
                    />
                  </Box>
                  <Box sx={{ flex: 1 }}>
                    <TokenUsageCard
                      title="Gemini 2.5 Pro"
                      used={1500000}
                      total={2000000}
                      today={2500}
                      average={1800}
                    />
                  </Box>
                </Box>
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
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
                      used={1500000}
                      total={2000000}
                      today={2500}
                      average={1800}
                    />
                  </Box>
                  <Box sx={{ flex: 1 }}>
                    <TokenUsageCard
                      title="Gemini 2.5 Pro"
                      used={1500000}
                      total={2000000}
                      today={2500}
                      average={1800}
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
      <Box sx={{ p: 3 }}>
        <ActionBar
          onSubmit={() => console.log("⬇️ ส่งออกไฟล์ Excel")}
          onClearData={() => console.log("⬇️ ส่งออกไฟล์ Excel")}
          viewMode={viewMode}
          onViewChange={handleViewChange}
          settingMode={selected}
        />

        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            gap: 2,
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
