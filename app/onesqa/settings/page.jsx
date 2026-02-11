"use client";

import React, { useState, useEffect } from "react";
import { useMutation, useQuery } from "@apollo/client/react";
import { 
  Box, 
  Button, 
  Typography, 
  CircularProgress, 
  useMediaQuery, 
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  MenuItem,
  LinearProgress,
  Paper,
  Switch,
 } from "@mui/material";
import SmartToyIcon from "@mui/icons-material/SmartToy"; // 🤖 AI
import AllInclusiveIcon from "@mui/icons-material/AllInclusive"; // 🌐 Model
import HubIcon from "@mui/icons-material/Hub";
import ActionBar from "@/app/components/ActionBar";
import TokenUsageCardSetting from "@/app/components/TokenUsageCardSetting";
import UserGroupSettingCard from "@/app/components/UserGroupSettingCard";
import TokenUsageCard from "@/app/components/TokenUsageCard";
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
import { GET_GROUPS } from "@/graphql/group/queries";
import { UPDATE_GROUP } from "@/graphql/group/mutations";
import GroupFilterBar from "@/app/components/GroupFilterBar";
import SmartPagination from "@/app/components/SmartPagination";
import { closeLoading, showLoading, showSuccessAlert } from "@/util/loadingModal";
import { useLanguage } from "@/app/context/LanguageContext";
import TokenSummaryModalButton from "@/app/components/TokenSummaryModalButton";

const normalize = (v) => (v === 'โมเดลทั้งหมด' || v === '' || v == null ? null : v);
const normalizeText = (v) => {
  const s = (v ?? '').trim();
  return s === '' ? null : s;
}

const SettingPage = () => {
  const { theme } = useTheme();
  const { locale } = useLanguage();
  const [selected, setSelected] = useState("AI");
  const [viewMode, setViewMode] = useState("card"); // ✅ state อยู่ที่นี่
  const [resetTrigger, setResetTrigger] = useState(0); // ✅ ตัวแปร trigger

  const t = useTranslations("SettingPage");
  const ttable = useTranslations("GroupTokenTable");
  const tInit = useTranslations("Init");
  const tDelete = useTranslations("DeleteAlert"); // สำหรับข้อความลบ
  const tsettingerror = useTranslations('SettingError');
  const tError = useTranslations('ErrorAlert');

  const isMobile = useMediaQuery("(max-width:600px)"); // < md คือจอเล็ก
  const isTablet = useMediaQuery("(max-width:1200px)"); // < md คือจอเล็ก

  // 🔹 state
  const [search, setSearch] = useState("");
  const [aiFilter, setAiFilter] = useState("โมเดลทั้งหมด");
  const [page, setPage] = useState(1);
  const rowsPerPage = 5; // ✅ แสดง 5 แถวต่อหน้า

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

  const [groups, setGroups] = useState([]);

  const formatComma = (n) => {
    if (n === null || n === undefined || n === "") return "";
    const x = Number(String(n).replace(/,/g, ""));
    return Number.isFinite(x) ? x.toLocaleString("en-US") : "";
  };

  const parseCommaToNumberSafe = (s) => {
    const raw = String(s ?? "").replace(/,/g, "").trim();
    if (raw === "") return 0;
    const n = Number(raw);
    return Number.isFinite(n) ? n : 0;
  };

  const {
    data: aisData,
    loading: aisLoading,
    error: aisError,
  } = useQuery(GET_AIS, {
    fetchPolicy: "network-only",
  });

  const {
    data: aiTypeData,
    loading: aiTypeLoading,
    error: aiTypeError,
  } = useQuery(GET_AIS, {
    variables: {
      message_type: "TEXT",
    },
    fetchPolicy: "network-only",
  });

  const {
    data: promptsData,
    loading: promptsLoading,
    error: promptsError,
    refetch: promptsRefetch,
  } = useQuery(GET_PROMPTS, {
    variables: {
      locale: locale,
    },
    fetchPolicy: "network-only",
    notifyOnNetworkStatusChange: true, // ✅ ให้ re-render ตอนกำลัง refetch
  });

  const {
    data: groupsData,
    loading: groupsLoading,
    error: groupsError,
    refetch: groupsRefetch,
  } = useQuery(GET_GROUPS, {
    fetchPolicy: "cache-and-network",
    notifyOnNetworkStatusChange: true, // ✅ ให้ re-render ตอนกำลัง refetch
    variables: {
      page: page, 
      pageSize: rowsPerPage,
      where: {
        model_use_name: normalize(aiFilter),
        search: normalizeText(search)
      }
    },
  });

  // console.log(groupsData?.groups);

  const [updateAi] = useMutation(UPDATE_AI);

  const [createPrompt] = useMutation(CREATE_PROMPT);
  const [updatePrompt] = useMutation(UPDATE_PROMPT);
  const [deletePrompt] = useMutation(DELETE_PROMPT);

  const [updateGroup] = useMutation(UPDATE_GROUP);

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

  useEffect(() => {
    if (!groupsData?.groups?.items) return;

    const mapped = groupsData.groups.items.map((g) => {
      const defaultModel = g.ai?.model_use_name || "";

      // key = model_use_name -> { today, average, token_count, token_all, ai_id }
      const statsByModel = new Map(
        (g.models || []).map((m) => {
          const modelUseName = m.ai?.model_use_name || "";
          return [
            modelUseName,
            {
              ai_id: m.ai_id ?? null,
              today: m.today ?? 0,
              average: m.average ?? 0,
              token_count: m.token_count ?? 0,
              token_all: m.token_all ?? 0,
            },
          ];
        })
      );

      // groupAis: เอา init_token + stats ของโมเดลนั้นๆ
      const groupAis =
        g.group_ai?.map((ga) => {
          const modelName = ga.ai?.model_use_name || "";
          const stat = statsByModel.get(modelName) || {
            ai_id: null,
            today: 0,
            average: 0,
            token_count: 0,
            token_all: 0,
          };

          return {
            model_use_name: modelName,
            ai_id: stat.ai_id, // ✅ เผื่อใช้ฝั่ง UI/อัปเดต
            init_token: ga.init_token || 0,
            plus_token: 0,
            minus_token: 0,

            // ✅ usage รวมทั้งกลุ่ม
            today: stat.today,
            average: stat.average,

            // ✅ รวม quota ทั้งกลุ่มจาก User_ai
            token_count: stat.token_count,
            token_all: stat.token_all,
          };
        }) || [];

      // (optional) ถ้าอยากให้ default model โผล่แม้ไม่มีใน group_ai
      // จะ push เพิ่มโดยใช้ init_token = 0
      if (defaultModel && !groupAis.some((x) => x.model_use_name === defaultModel)) {
        const stat = statsByModel.get(defaultModel) || {
          ai_id: null,
          today: 0,
          average: 0,
          token_count: 0,
          token_all: 0,
        };

        groupAis.unshift({
          model_use_name: defaultModel,
          ai_id: stat.ai_id,
          init_token: 0,
          plus_token: 0,
          minus_token: 0,
          today: stat.today,
          average: stat.average,
          token_count: stat.token_count,
          token_all: stat.token_all,
        });
      }

      return {
        id: g.id,
        name: g.name,
        status: g.status,
        user_count: g.user_count,
        model_use_name: defaultModel,
        groupAis,
      };
    });

    setGroups(mapped);
  }, [groupsData, resetTrigger]);

  useEffect(() => {
    setPage(1);
  }, [aiFilter, search]);
  // ✅ scroll ทุกครั้งที่หน้าเปลี่ยน (ชัวร์)
  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [page]);

  const { allowed, loading, user } = useRequireRole({
    roles: ["ผู้ดูแลระบบ", "superadmin"],
    redirectTo: "/onesqa/chat",
  });

  if (loading) return null; // หรือใส่ Skeleton ก็ได้
  if (!allowed) return null; // ระหว่างกำลัง redirect กันไม่ให้แสดงหน้า

  if (aisLoading || promptsLoading || aiTypeLoading)
    return (
      <Box sx={{ textAlign: "center", mt: 5 }}>
        <CircularProgress />
        <Typography>{tInit("loading")}...</Typography>
      </Box>
    );

  // console.log(groupsError);

  if (aisError || promptsError || groupsError || aiTypeError)
    return (
      <Typography color="error" sx={{ mt: 5 }}>
        ❌ {tInit("error")}
      </Typography>
    );

  const modelOptions = aisData?.ais?.map(ai => ai.model_use_name);
  const modelTypeOptions = aiTypeData?.ais?.map(ai => ai.model_use_name);
  const totalItems =
    groupsData?.groups?.total ||
    groupsData?.groups?.totalItems ||
    groupsData?.groups?.totalCount ||
    groupsData?.groups?.count ||
    0;

  const totalPages =
    groupsData?.groups?.totalPages ||
    groupsData?.groups?.pageInfo?.totalPages ||
    Math.max(1, Math.ceil(totalItems / rowsPerPage));

  // console.log("groups", groups);

  // ด้านบนใน component
  const LIMIT = 5;
  const totalCount = (persistedEdits?.length || 0) + (newPrompts?.length || 0);
  const canAdd = totalCount < LIMIT;

  const toNumber = (v) => Number(v || 0);

  const renderTotalText = (tokenValue, userCount, sign = "") => {
    const users = toNumber(userCount);
    const total = toNumber(tokenValue) * users;
    return `× ${users.toLocaleString("en-US")} = ${sign}${formatComma(total)}`;
  };

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
        text: tDelete("textprompt1"),
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
          try {
            // ✅ เรียก mutation ไป backend
            const { data } = await deletePrompt({
              variables: {
                id: id,
              },
            });
            // console.log("✅ Delete success:", data.deletePrompt);
            await promptsRefetch();
          } catch (error) {
            // console.log(error);
          }

          Swal.fire({
            title: tDelete("title2"),
            text: tDelete("textprompt2"),
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
        text: tDelete("textprompt1"),
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
          try {
            // ✅ เรียก mutation ไป backend
            const { data } = await deletePrompt({
              variables: {
                id: id,
              },
            });
            // console.log("✅ Delete success:", data.deletePrompt);
            await promptsRefetch();
          } catch (error) {
            // console.log(error);
          }

          Swal.fire({
            title: tDelete("title2"),
            text: tDelete("textprompt2"),
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

  // ✅ แปลงเป็นเลขแบบกัน NaN/ค่าว่าง
  const toNumberSafe = (v) => {
    const s = String(v ?? "").trim();
    if (s === "") return 0;
    const n = Number(s);
    return Number.isFinite(n) ? n : 0;
  };

  // ✅ table จะอ้างอิงด้วย model_use_name -> upsert เข้า groupAis
  const upsertGroupAiField = (groupId, modelUseName, field, value) => {
    setGroups((prev) =>
      prev.map((g) => {
        if (g.id !== groupId) return g;

        const next = [...(g.groupAis || [])];
        let idx = next.findIndex((x) => x.model_use_name === modelUseName);

        // ถ้าไม่มี row ของโมเดลนี้ ให้สร้างใหม่ (เพื่อแก้ไขได้เหมือน card)
        if (idx === -1) {
          next.push({
            model_use_name: modelUseName,
            ai_id: null,
            init_token: 0,
            plus_token: 0,
            minus_token: 0,
            today: 0,
            average: 0,
            token_count: 0,
            token_all: 0,
          });
          idx = next.length - 1;
        }

        next[idx] = { ...next[idx], [field]: value };
        return { ...g, groupAis: next };
      })
    );
  };

  const handleGroupChange = (groupId, field, value) => {
    setGroups((prev) =>
      prev.map((g) => (g.id === groupId ? { ...g, [field]: value } : g))
    );
  };
  const handleGroupAiChange = (groupId, index, field, value) => {
    setGroups((prev) =>
      prev.map((g) => {
        if (g.id !== groupId) return g;
        const next = [...(g.groupAis || [])];
        next[index] = { ...next[index], [field]: value };
        return { ...g, groupAis: next };
      })
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
    // console.log("🟢 เปลี่ยนโหมดเป็น:", mode);
  };

  const handleReset = () => {
    setNewPrompts([])
    setResetTrigger((prev) => prev + 1); // ✅ trigger ให้ useEffect ทำงานใหม่
  };

  const handleClearFilters = () => {
    setSearch("");
    setAiFilter("โมเดลทั้งหมด");
    setPage(1)
    // console.log("🧹 ล้างตัวกรองเรียบร้อย");
  };

  const handleSubmit = async () => {
    if (selected === "AI") {
      // console.log("selected", selected);

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
                  locale: locale,
                },
              },
            });
            return data.updatePrompt;
          })
        );

        // console.log("✅ Update success:", results);
      } catch (error) {
        showErrorAlert(error, theme, {
          title: tsettingerror('error1'),
          t: tError
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
                  locale: locale,
                },
              },
            });
            return data.createPrompt;
          })
        );

        // console.log("✅ Create success:", results);
      } catch (error) {
        showErrorAlert(error, theme, {
          title: tsettingerror('error1'),
          t: tError
        });
      }

      setNewPrompts([]);
      await promptsRefetch();

      await showSuccessAlert({
        title: t("syncuser2"),
        text: t("syncuser3"),
        theme,
      });
      
    } else if (selected === "Model") {
      try {
        showLoading(t("syncusermodel1"), theme);

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

        // console.log("✅ Update success:", results);

        closeLoading();
        await showSuccessAlert({
          title: t("syncuser2"),
          text: t("syncuser3"),
          theme,
        });
      } catch (error) {
        closeLoading();
        showErrorAlert(error, theme, {
          title: tsettingerror('error2'),
          t: tError
        });
      }
    } else if (selected === "Tokens") {
      try {
        showLoading(t("syncusertokens1"), theme);

        // สร้าง lookup map ไว้ก่อน (เร็วกว่า find ซ้ำ ๆ)
        const aiIdByUseName = new Map(
          (aisData?.ais || []).map((ai) => [ai.model_use_name, ai.id])
        );

        // ✅ อัปเดตทุก group พร้อมกัน
        const results = await Promise.all(
          groups.map(async (group) => {
            // ✅ ai_id ของ default model (ระดับ group)
            const defaultAiId = aiIdByUseName.get(group.model_use_name);

            // ✅ group_ai (ตารางลูก)
            const group_ai = (group.groupAis || [])
              .map((ga) => {
                const ai_id = aiIdByUseName.get(ga.model_use_name);
                if (!ai_id) return null;

                return {
                  ai_id,
                  init_token: ga.init_token ?? 0,
                  plus_token: ga.plus_token ?? 0,
                  minus_token: ga.minus_token ?? 0,
                };
              })
              .filter(Boolean);

            const input = {
              model_use_name: group.model_use_name,
              status: !!group.status,
              group_ai,
              ...(defaultAiId ? { ai_id: defaultAiId } : {}), // ✅ ส่งเฉพาะตอนมีค่า
            };

            const { data } = await updateGroup({
              variables: {
                id: group.id,
                input,
              },
            });

            return data?.updateGroup;
          })
        );

        // console.log("✅ Update success:", results);

        closeLoading();
        await showSuccessAlert({
          title: t("syncuser2"),
          text: t("syncuser3"),
          theme,
        });

        setGroups((prev) =>
          prev.map((g) => ({
            ...g,
            groupAis: (g.groupAis || []).map((ga) => ({
              ...ga,
              plus_token: 0,
              minus_token: 0,
            })),
          }))
        );

        await groupsRefetch()
      } catch (error) {
        closeLoading();
        showErrorAlert(error, theme, {
          title: tsettingerror('error3'),
          t: tError
        });

        setGroups((prev) =>
          prev.map((g) => ({
            ...g,
            groupAis: (g.groupAis || []).map((ga) => ({
              ...ga,
              plus_token: 0,
              minus_token: 0,
            })),
          }))
        );

        await groupsRefetch()
      }
    }
  };

  const buttons = [
    { label: "AI", icon: <SmartToyIcon />, value: "AI" },
    { label: "Model", icon: <AllInclusiveIcon />, value: "Model" },
    { label: t('button1'), icon: <HubIcon />, value: "Tokens" },
  ];

  const getVisiblePages = (page, totalPages) => {
    if (totalPages <= 3) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    if (page <= 1) return [1, 2, 3];
    if (page >= totalPages) return [totalPages - 2, totalPages - 1, totalPages];

    return [page - 1, page, page + 1];
  };

  // 🔹 ฟังก์ชันเรนเดอร์แถบความคืบหน้า
  const renderProgress = ({ used = 0, total = 0 }) => {
    const percent = total > 0 ? Math.min((used / total) * 100, 100) : 0;

    let progressColor = "#3E8EF7";
    if (percent >= 15 && percent <= 30) progressColor = "#FFA726";
    else if (percent < 15) progressColor = "#E53935";

    const formatInt = (n) => Number(n ?? 0).toLocaleString("en-US"); // 1,000,000

    return (
      <Box>
        <Typography variant="body2" fontWeight={600}>
          {formatInt(used)} / {formatInt(total)} Tokens
        </Typography>

        <LinearProgress
          variant="determinate"
          value={percent}
          sx={{
            mt: 0.5,
            height: 8,
            borderRadius: 5,
            bgcolor: "#e3f2fd",
            "& .MuiLinearProgress-bar": { bgcolor: progressColor },
          }}
        />
      </Box>
    );
  };

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
                titlePlaceholder={t('title')}
                detailValue={prompt.prompt_detail}
                detailPlaceholder={t('detail')}
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
                  {t('notfound1')}
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
                titlePlaceholder={t('title')}
                detailValue={p.prompt_detail}
                detailPlaceholder={t('detail')}
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
                {t('newprompt')}
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

            {/* {cards.length === 0 && (
              <Box sx={{ textAlign: "center", my: 2 }}>
                <Typography variant="body1" color="text.secondary">
                  ไม่พบข้อมูล Model ในระบบ
                </Typography>
              </Box>
            )} */}
          </Box>
        );
      case "Tokens":
        return (
          <>
          <GroupFilterBar
            search={search}
            setSearch={setSearch}
            aiFilter={aiFilter}
            setAiFilter={setAiFilter}
            setPage={setPage}
            modelOptions={modelTypeOptions}
          />
          <TokenSummaryModalButton />
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
                    width: "100%",
                    gap: 5,
                  }}
                >
                  {groups.map((group) => {
                    // รวม default model + groupAis แล้วกันชื่อซ้ำด้วย model_use_name
                    const mergedByModel = new Map();

                    // helper หา stat ของ default model จาก groupAis (ถ้ามี)
                    const defaultStat =
                      (group.groupAis || []).find((x) => x.model_use_name === group.model_use_name) || null;

                    // default model (ของ Group)
                    if (group.model_use_name) {
                      mergedByModel.set(group.model_use_name, {
                        model_use_name: group.model_use_name,

                        // quota แบบเดิม (init/plus/minus) ของ default ไม่มีใน group_ai
                        init_token: defaultStat?.init_token ?? 0,
                        plus_token: defaultStat?.plus_token ?? 0,
                        minus_token: defaultStat?.minus_token ?? 0,

                        // ✅ usage
                        today: defaultStat?.today ?? 0,
                        average: defaultStat?.average ?? 0,

                        // ✅ เพิ่มจาก User_ai (รวมทั้งกลุ่ม)
                        token_count: defaultStat?.token_count ?? 0,
                        token_all: defaultStat?.token_all ?? 0,
                      });
                    }

                    // models ที่มาจาก group_ai (และมี stat ครบแล้วใน group.groupAis)
                    (group.groupAis || []).forEach((ga) => {
                      const key = ga.model_use_name || "";
                      if (!key) return;

                      mergedByModel.set(key, {
                        model_use_name: key,
                        init_token: ga.init_token ?? 0,
                        plus_token: ga.plus_token ?? 0,
                        minus_token: ga.minus_token ?? 0,

                        today: ga.today ?? 0,
                        average: ga.average ?? 0,

                        // ✅ เพิ่มจาก User_ai
                        token_count: ga.token_count ?? 0,
                        token_all: ga.token_all ?? 0,
                      });
                    });

                    const tokenCards = Array.from(mergedByModel.values());

                    return (
                      <Box sx={{ display: "flex", flexWrap: "wrap", width: "100%", gap: 1 }} key={group.id}>
                        <Box sx={{ flex: 1 }}>
                          <UserGroupSettingCard
                            user_count={group.user_count}
                            roleName={group.name}
                            status={group.status}
                            model={group.model_use_name}         // group default model
                            groupAis={group.groupAis || []}      // list ใหม่ (มี today/avg/token_count/token_all แล้ว)
                            modelOptions={modelTypeOptions}
                            onGroupChange={(field, value) => handleGroupChange(group.id, field, value)}
                            onGroupAiChange={(index, field, value) =>
                              handleGroupAiChange(group.id, index, field, value)
                            }
                          />
                        </Box>

                        <Box sx={{ display: "flex", width: "100%", flexWrap: "wrap", gap: 2 }}>
                          {tokenCards.map((m) => {
                            // ✅ total quota “ตามใหม่” = token_all (รวมทั้งกลุ่มจาก User_ai)
                            // ถ้าอยาก fallback ไปใช้สูตรเดิม ให้คงไว้ด้วย
                            const totalFallback = Math.max(
                              0,
                              (m.init_token ?? 0) + (m.plus_token ?? 0) - (m.minus_token ?? 0)
                            );
                            const total = m.token_all ?? totalFallback;

                            // ✅ remain = total - token_count (ใช้ไปแล้ว)
                            const remain = m.token_count ?? 0;

                            return (
                              <Box
                                key={`${group.id}-${m.model_use_name}`}
                                sx={(theme) => ({
                                  // มือถือ = 1 ต่อแถว, จอ >= sm = 2 ต่อแถว
                                  flex: {
                                    xs: "1 1 100%",
                                    sm: `0 0 calc((100% - ${theme.spacing(2)}) / 2)`,
                                  },
                                  maxWidth: {
                                    xs: "100%",
                                    sm: `calc((100% - ${theme.spacing(2)}) / 2)`,
                                  },
                                })}
                              >
                                <TokenUsageCard
                                  title={m.model_use_name}
                                  remain={remain}
                                  total={total}
                                  today={m.today}
                                  average={m.average}
                                />
                              </Box>
                            );
                          })}
                        </Box>
                      </Box>
                    );
                  })}
                </Box>

                {/* ถ้าไม่มีข้อมูล */}
                {groups.length === 0 && (
                  <Box sx={{ textAlign: "center", my: 2 }}>
                    <Typography variant="body1" color="text.secondary">
                      {t('notfound3')}
                    </Typography>
                  </Box>
                )}

                {/* ✅ Pagination */}
                <Stack alignItems="center" sx={{ mt: 3 }}>
                  <SmartPagination
                    page={page}
                    totalPages={totalPages}
                    disabled={groupsLoading}
                    onChange={(newPage) => setPage(newPage)}
                  />
                </Stack>
              </>
            ) : (
              <Box
                sx={{
                  bgcolor: "background.paper",
                }}
              >
                {/* ✅ กล่องสำหรับเลื่อนแนวนอน (กันตารางเกินจอ) */}
                <Box
                  sx={{
                    width: "100%",
                    overflowX: "auto",
                    overflowY: "hidden",
                    // ❗ อย่าซ่อน Y ตรงนี้ เพราะเราจะให้ TableContainer จัดการ scroll แถวแทน
                    maxWidth: isMobile ? "80vw" : isTablet ? "85vw" : !open ? "85vw" : "70vw", // ✅ จำกัดไม่ให้เกินหน้าจอ
                  }}
                >
                  {/* ✅ กล่องสำหรับเลื่อนแนวตั้ง + stickyHeader */}
                  <TableContainer
                    component={Paper}
                    elevation={0}
                    sx={{
                      display: "inline-block", // ✅ ป้องกันตารางยืดเกิน container
                      mt: 1,
                      borderRadius: 2,
                      // ✅ ทำให้เลื่อนดู "แถว" ได้
                      maxHeight: isMobile ? "55vh" : "65vh",
                      overflowY: "auto",
                      // ✅ เพื่อให้ตารางกว้างเท่าที่จำเป็น แล้วค่อยเลื่อน X ที่ Box ชั้นนอก
                      width: "max-content",
                      minWidth: "100%",
                    }}
                  >
                    <Table stickyHeader size="small" sx={{ tableLayout: "auto" }}>
                      <TableHead>
                        <TableRow>
                          <TableCell sx={{ fontWeight: 700, whiteSpace: "nowrap" }}>
                            {ttable("tablecell1")}
                          </TableCell>

                          <TableCell sx={{ fontWeight: 700, whiteSpace: "nowrap", width: 120 }}>
                            {ttable("tablecell11")}
                          </TableCell>

                          <TableCell sx={{ fontWeight: 700, whiteSpace: "nowrap", width: 220 }}>
                            {ttable("tablecell2")}
                            <Typography variant="body2" color="text.secondary">
                              {ttable("tablecell2sub")}
                            </Typography>
                          </TableCell>

                          {/* token ตั้งต้น */}
                          {modelOptions.map((model) => (
                            <TableCell
                              key={`init-${model}`}
                              sx={{ fontWeight: 700, whiteSpace: "nowrap", width: 220 }}
                            >
                              {model}
                              <Typography variant="body2" color="text.secondary">
                                {ttable("tablecell3sub")}
                              </Typography>
                            </TableCell>
                          ))}

                          {/* เพิ่ม token */}
                          {modelOptions.map((model) => (
                            <TableCell
                              key={`plus-${model}`}
                              sx={{ fontWeight: 700, whiteSpace: "nowrap", width: 220 }}
                            >
                              {model}
                              <Typography variant="body2" color="text.secondary">
                                {ttable("tablecell4sub")}
                              </Typography>
                            </TableCell>
                          ))}

                          {/* ลด token */}
                          {modelOptions.map((model) => (
                            <TableCell
                              key={`minus-${model}`}
                              sx={{ fontWeight: 700, whiteSpace: "nowrap", width: 220 }}
                            >
                              {model}
                              <Typography variant="body2" color="text.secondary">
                                {ttable("tablecell5sub")}
                              </Typography>
                            </TableCell>
                          ))}

                          {/* ข้อมูล token */}
                          {modelOptions.map((model) => (
                            <TableCell
                              key={`info-${model}`}
                              sx={{ fontWeight: 700, whiteSpace: "nowrap", width: 260 }}
                            >
                              {model}
                              <Typography variant="body2" color="text.secondary">
                                {ttable("tablecell6sub")}
                              </Typography>
                            </TableCell>
                          ))}
                        </TableRow>
                      </TableHead>

                      <TableBody>
                        {groups.map((group) => (
                          <TableRow key={group.id} hover>
                            <TableCell sx={{ whiteSpace: "nowrap" }}>
                              <Typography fontWeight={600}>{group.name}: {group.user_count} {ttable("unit")}</Typography>
                            </TableCell>

                            <TableCell>
                              <Switch
                                checked={group.status === true || group.status === 1}
                                onChange={(e) =>
                                  handleGroupChange(group.id, "status", e.target.checked)
                                }
                              />
                            </TableCell>

                            <TableCell sx={{ minWidth: 220 }}>
                              <TextField
                                select
                                size="small"
                                value={group.model_use_name || ""}
                                onChange={(e) =>
                                  handleGroupChange(group.id, "model_use_name", e.target.value)
                                }
                                fullWidth
                              >
                                {modelTypeOptions.map((option, i) => (
                                  <MenuItem key={i} value={option}>
                                    {option}
                                  </MenuItem>
                                ))}
                              </TextField>
                            </TableCell>

                            {/* init_token */}
                            {modelOptions.map((model) => {
                              const aiRow =
                                (group.groupAis || []).find((x) => x.model_use_name === model) || null;
                              return (
                                <TableCell key={`init-${group.id}-${model}`} sx={{ minWidth: 220 }}>
                                  <TextField
                                    type="text"
                                    size="small"
                                    fullWidth
                                    value={formatComma(aiRow?.init_token ?? 0)}
                                    onChange={(e) => {
                                      const raw = e.target.value;
                                      if (!/^[0-9,]*$/.test(raw)) return;
                                      upsertGroupAiField(group.id, model, "init_token", parseCommaToNumberSafe(raw));
                                    }}
                                    helperText={renderTotalText(aiRow?.init_token ?? 0, group.user_count, "")}
                                    FormHelperTextProps={{
                                      sx: { color: "text.secondary", textAlign: "right", m: 0, mt: 0.5 },
                                    }}
                                    inputProps={{
                                      inputMode: "numeric",
                                      style: { textAlign: "right" },
                                    }}
                                    sx={{ "& .MuiInputBase-input": { textAlign: "right" } }}
                                  />
                                </TableCell>
                              );
                            })}

                            {/* plus_token */}
                            {modelOptions.map((model) => {
                              const aiRow =
                                (group.groupAis || []).find((x) => x.model_use_name === model) || null;
                              return (
                                <TableCell key={`plus-${group.id}-${model}`} sx={{ minWidth: 220 }}>
                                  <TextField
                                    type="text"
                                    size="small"
                                    fullWidth
                                    value={formatComma(aiRow?.plus_token ?? 0)}
                                    onChange={(e) => {
                                      const raw = e.target.value;
                                      if (!/^[0-9,]*$/.test(raw)) return;
                                      upsertGroupAiField(group.id, model, "plus_token", parseCommaToNumberSafe(raw));
                                    }}
                                    helperText={renderTotalText(aiRow?.plus_token ?? 0, group.user_count, "-")}
                                    FormHelperTextProps={{
                                      sx: { color: "error.main", textAlign: "right", m: 0, mt: 0.5 },
                                    }}
                                    inputProps={{
                                      inputMode: "numeric",
                                      style: { textAlign: "right" },
                                    }}
                                    sx={{ "& .MuiInputBase-input": { textAlign: "right" } }}
                                  />
                                </TableCell>
                              );
                            })}

                            {/* minus_token */}
                            {modelOptions.map((model) => {
                              const aiRow =
                                (group.groupAis || []).find((x) => x.model_use_name === model) || null;
                              return (
                                <TableCell key={`minus-${group.id}-${model}`} sx={{ minWidth: 220 }}>
                                  <TextField
                                    type="text"
                                    size="small"
                                    fullWidth
                                    value={formatComma(aiRow?.minus_token ?? 0)}
                                    onChange={(e) => {
                                      const raw = e.target.value;
                                      if (!/^[0-9,]*$/.test(raw)) return;
                                      upsertGroupAiField(group.id, model, "minus_token", parseCommaToNumberSafe(raw));
                                    }}
                                    helperText={renderTotalText(aiRow?.minus_token ?? 0, group.user_count, "+")}
                                    FormHelperTextProps={{
                                      sx: { color: "error.main", textAlign: "right", m: 0, mt: 0.5 },
                                    }}
                                    inputProps={{
                                      inputMode: "numeric",
                                      style: { textAlign: "right" },
                                    }}
                                    sx={{ "& .MuiInputBase-input": { textAlign: "right" } }}
                                  />
                                </TableCell>
                              );
                            })}

                            {/* info progress */}
                            {modelOptions.map((model) => {
                              const aiRow =
                                (group.groupAis || []).find((x) => x.model_use_name === model) || null;

                              const totalFallback = Math.max(
                                0,
                                (aiRow?.init_token ?? 0) +
                                  (aiRow?.plus_token ?? 0) -
                                  (aiRow?.minus_token ?? 0)
                              );

                              const total = aiRow?.token_all ?? totalFallback;
                              const used = aiRow?.token_count ?? 0;

                              return (
                                <TableCell key={`info-${group.id}-${model}`} sx={{ minWidth: 260 }}>
                                  {renderProgress({ used, total })}
                                </TableCell>
                              );
                            })}
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>

                  {/* ถ้าไม่มีข้อมูล */}
                  {groups.length === 0 && (
                    <Box sx={{ textAlign: "center", my: 2 }}>
                      <Typography variant="body1" color="text.secondary">
                        {t('notfound3')}
                      </Typography>
                    </Box>
                  )}
                </Box>

                {/* Footer */}
                {/* ✅ Pagination อยู่นอก TableContainer เพื่อไม่ให้โดน scroll แนวตั้ง */}
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
                      {totalItems}
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
                      totalPages={totalPages}
                      disabled={groupsLoading}
                      onChange={(newPage) => setPage(newPage)}
                    />
                  </Box>
                </Box>
              </Box>
            )}
          </Box>
          </>
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
          onClearFilters={() => handleClearFilters()}
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
