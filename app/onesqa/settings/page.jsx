"use client";

import React, { useState, useEffect } from "react";
import { useMutation, useQuery } from "@apollo/client/react";
import { Box, Button, Typography, CircularProgress, useMediaQuery } from "@mui/material";
import SmartToyIcon from "@mui/icons-material/SmartToy"; // 🤖 AI
import AllInclusiveIcon from "@mui/icons-material/AllInclusive"; // 🌐 Model
import HubIcon from "@mui/icons-material/Hub";
import ActionBar from "@/app/components/ActionBar";
import TokenUsageCardSetting from "@/app/components/TokenUsageCardSetting";
import UserGroupSettingCard from "@/app/components/UserGroupSettingCard";
import TokenUsageCard from "@/app/components/TokenUsageCard";
import GroupTokenTable from "@/app/components/GroupTokenTable";
import Swal from "sweetalert2";
import { useTheme } from "next-themes";
import { useTranslations } from "next-intl";
import { UPDATE_AI } from "@/graphql/ai/mutations";
import { GET_AIS } from "@/graphql/ai/queries";
import { useRequireRole } from "@/hook/useRequireRole";
import { GET_PROMPTS } from "@/graphql/prompt/queries";
import ActionTextField from "@/app/components/ActionTextField";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import {
  CREATE_PROMPT,
  DELETE_PROMPT,
  UPDATE_PROMPT,
} from "@/graphql/prompt/mutations";
import { extractErrorMessage, showErrorAlert } from "@/util/errorAlert"; // ปรับ path ให้ตรงโปรเจกต์จริง

const SettingPage = () => {
  const { theme } = useTheme();

  const [selected, setSelected] = useState("AI");
  const [viewMode, setViewMode] = useState("card"); // ✅ state อยู่ที่นี่
  const [resetTrigger, setResetTrigger] = useState(0); // ✅ ตัวแปร trigger

  const t = useTranslations("SettingPage");
  const tInit = useTranslations("Init");
  const tDelete = useTranslations("DeleteAlert"); // สำหรับข้อความลบ

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
    //   title: "ChatGPT 5",
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

  // สำเนาข้อมูลจาก DB สำหรับแก้ไขแบบ controlled
  const [persistedEdits, setPersistedEdits] = useState([]);
  const [newPrompts, setNewPrompts] = useState([]);

  const modelOptions = ["Gemini 2.5 Pro", "ChatGPT 5"];

  const {
    data: aisData,
    loading: aisLoading,
    error: aisError,
  } = useQuery(GET_AIS, {
    fetchPolicy: "network-only",
  });

  const {
    data: promptsData,
    loading: promptsLoading,
    error: promptsError,
    refetch: promptsRefetch,
  } = useQuery(GET_PROMPTS, {
    fetchPolicy: "network-only",
    notifyOnNetworkStatusChange: true, // ✅ ให้ re-render ตอนกำลัง refetch
  });

  const [updateAi] = useMutation(UPDATE_AI);

  const [createPrompt] = useMutation(CREATE_PROMPT);
  const [updatePrompt] = useMutation(UPDATE_PROMPT);
  const [deletePrompt] = useMutation(DELETE_PROMPT);

  useEffect(() => {
    if (!aisData?.ais.length) return;

    const transformed = aisData?.ais?.map((ai) => {
      return {
        id: ai.id,
        title: ai.model_name,
        model_use: ai?.model_use_name || "-",
        model_type: ai?.model_type || "-",
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

  useEffect(() => {
    const rows = Array.isArray(promptsData?.prompts) ? promptsData.prompts : [];
    // ✅ อย่าชี้ array เดิมจาก cache: ทำสำเนา (กันการกลายพันธุ์ cache)
    setPersistedEdits(rows.map((p) => ({ ...p })));
  }, [promptsData?.prompts, resetTrigger]); // ✅ ผูกกับฟิลด์ที่ใช้จริง

  console.log(cards);

  const { allowed, loading, user } = useRequireRole({
    roles: ["ผู้ดูแลระบบ"],
    redirectTo: "/onesqa/chat",
  });

  if (loading) return null; // หรือใส่ Skeleton ก็ได้
  if (!allowed) return null; // ระหว่างกำลัง redirect กันไม่ให้แสดงหน้า

  if (aisLoading || promptsLoading)
    return (
      <Box sx={{ textAlign: "center", mt: 5 }}>
        <CircularProgress />
        <Typography>{tInit("loading")}...</Typography>
      </Box>
    );

  if (aisError || promptsError)
    return (
      <Typography color="error" sx={{ mt: 5 }}>
        ❌ {tInit("error")}
      </Typography>
    );

  // ด้านบนใน component
  const LIMIT = 5;
  const totalCount = (persistedEdits?.length || 0) + (newPrompts?.length || 0);
  const canAdd = totalCount < LIMIT;

  const handleAddNewPrompt = () => {
    if (!canAdd) return; // ป้องกันระดับโค้ด
    setNewPrompts((prev) => [
      ...prev,
      {
        tempId: `new-${Date.now()}`,
        prompt_title: "",
        prompt_detail: "",
      },
    ]);
  };
  // ------- เปลี่ยนค่าของรายการใหม่ -------
  const updateNew = (tempId, field, value) => {
    setNewPrompts((prev) =>
      prev.map((p) => (p.tempId === tempId ? { ...p, [field]: value } : p))
    );
  };
  const handleDeleteNew = (tempId) => {
    setNewPrompts((prev) => prev.filter((p) => p.tempId !== tempId));
  };

  // ------- เปลี่ยนค่าของรายการจาก DB -------
  const updatePersisted = (id, field, value) => {
    setPersistedEdits((prev) =>
      prev.map((p) => (p.id === id ? { ...p, [field]: value } : p))
    );
  };
  // ตัวอย่าง: ลบ/แก้ไขของรายการที่มาจาก DB (คุณอาจผูกกับ API จริง)
  const handleDeletePersisted = async (id) => {
    // TODO: เรียก API ลบ แล้วรีเฟรชข้อมูล
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
          try {
            // ✅ เรียก mutation ไป backend
            const { data } = await deletePrompt({
              variables: {
                id: id,
              },
            });
            console.log("✅ Delete success:", data.deletePrompt);
            await promptsRefetch();
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
          try {
            // ✅ เรียก mutation ไป backend
            const { data } = await deletePrompt({
              variables: {
                id: id,
              },
            });
            console.log("✅ Delete success:", data.deletePrompt);
            await promptsRefetch();
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
    setNewPrompts([])
    setResetTrigger((prev) => prev + 1); // ✅ trigger ให้ useEffect ทำงานใหม่
  };

  const handleSubmit = async () => {
    if (selected === "AI") {
      console.log("selected", selected);

      // เเก้ไขข้อมูลที่มีอยุ่แล้ว
      // helper เช็กช่องว่าง/null
      const isEmpty = (val) => !val || String(val).trim() === "";

      // ... ในฟังก์ชันบันทึก ...
      try {
        // ✅ กรองเฉพาะรายการที่มีทั้ง title และ detail
        const validPersistedEdits = persistedEdits.filter(
          (p) => !isEmpty(p.prompt_title) && !isEmpty(p.prompt_detail)
        );

        const results = await Promise.all(
          validPersistedEdits.map(async (persisted) => {
            const { data } = await updatePrompt({
              variables: {
                id: persisted.id, // id ของ AI record
                input: {
                  prompt_title: persisted.prompt_title,
                  prompt_detail: persisted.prompt_detail,
                  // locale: persisted.locale,
                  locale: "th",
                },
              },
            });
            return data.updatePrompt;
          })
        );

        console.log("✅ Update success:", results);
      } catch (error) {
        showErrorAlert(error, theme, {
          title: "ตั้งค่า Prompt ไม่สำเร็จ",
        });
      }

      // เพิ่มข้อมูลเข้ามาใหม่
      try {
        // ✅ กรองเฉพาะรายการที่มีทั้ง title และ detail
        const validNewPrompts = newPrompts.filter(
          (p) => !isEmpty(p.prompt_title) && !isEmpty(p.prompt_detail)
        );

        const results = await Promise.all(
          validNewPrompts.map(async (persisted) => {
            const { data } = await createPrompt({
              variables: {
                input: {
                  prompt_title: persisted.prompt_title,
                  prompt_detail: persisted.prompt_detail,
                  // locale: persisted.locale,
                  locale: "th",
                },
              },
            });
            return data.createPrompt;
          })
        );

        console.log("✅ Create success:", results);
      } catch (error) {
        showErrorAlert(error, theme, {
          title: "ตั้งค่า Prompt ไม่สำเร็จ",
        });
      }

      setNewPrompts([]);
      await promptsRefetch();
      
    } else if (selected === "Model") {
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
        showErrorAlert(error, theme, {
          title: "ตั้งค่า AI ไม่สำเร็จ",
        });
      }
    } else if (selected === "Tokens") {

    }
  };

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

            {(persistedEdits ?? []).map((prompt) => (
              <ActionTextField
                sx={{
                  my: 2
                }}
                key={prompt.id}
                titleValue={prompt.prompt_title}
                titlePlaceholder="หัวข้อ"
                detailValue={prompt.prompt_detail}
                detailPlaceholder="รายละเอียด"
                onTitleChange={(v) =>
                  updatePersisted(prompt.id, "prompt_title", v)
                }
                onDetailChange={(v) =>
                  updatePersisted(prompt.id, "prompt_detail", v)
                }
                onDelete={() => handleDeletePersisted(prompt.id)}
              />
            ))}
            {(persistedEdits.length === 0 && newPrompts.length === 0) && (
              <Box sx={{ textAlign: "center", my: 5 }}>
                <Typography variant="body1" color="text.secondary">
                  ไม่มีรายการ prompt
                </Typography>
              </Box>
            )}

            {newPrompts.map((p) => (
              <ActionTextField
                sx={{
                  my: 2
                }}
                key={p.tempId}
                titleValue={p.prompt_title}
                titlePlaceholder="หัวข้อ"
                detailValue={p.prompt_detail}
                detailPlaceholder="รายละเอียด"
                onTitleChange={(v) => updateNew(p.tempId, "prompt_title", v)}
                onDetailChange={(v) => updateNew(p.tempId, "prompt_detail", v)}
                onDelete={() => handleDeleteNew(p.tempId)}
              />
            ))}

            <Box sx={{ textAlign: "center" }}>
              <Button
                variant="contained"
                startIcon={<AddRoundedIcon />}
                onClick={handleAddNewPrompt}
                disabled={!canAdd} // ✅ ปิดปุ่มเมื่อครบโควตา
                sx={{
                  bgcolor: "#1976d2",
                  color: "white",
                  px: 2.5,
                  "&:hover": { bgcolor: "#1565c0" },
                }}
              >
                เพิ่ม Prompt ใหม่
              </Button>
            </Box>
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
                  card.model_use
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
                      modelOptions={["Gemini 2.5 Pro", "ChatGPT 5"]}
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
                      modelOptions={["Gemini 2.5 Pro", "ChatGPT 5"]}
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
