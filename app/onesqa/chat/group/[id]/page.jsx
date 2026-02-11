"use client";

import { useEffect, useState, useRef, useCallback, useMemo } from "react";
import { NetworkStatus } from "@apollo/client";
import { useQuery, useMutation, useApolloClient } from "@apollo/client/react";
import {
  Box,
  Button,
  Container,
  Paper,
  TextField,
  Typography,
  ToggleButton,
  ToggleButtonGroup,
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  Link,
  useMediaQuery,
  Select,
  MenuItem,
  CircularProgress,
  Collapse,
  List,
  ListItemButton,
  ListItemText,
  IconButton,
  Avatar,
  ListItemIcon,
} from "@mui/material";
import { useTranslations } from "next-intl";
import { GET_USER } from "@/graphql/user/queries";
import ScienceOutlinedIcon from "@mui/icons-material/ScienceOutlined";
import { MULTIPLE_UPLOAD } from "@/graphql/file/mutations";
import BrushOutlinedIcon from "@mui/icons-material/BrushOutlined";
import ChatInputBar from "@/app/components/chat/ChatInputBar";
import { useAuth } from "@/app/context/AuthContext";
import {
  CREATE_CHAT,
  DELETE_CHAT,
  UPDATE_CHAT,
} from "@/graphql/chat/mutations";
import { useTheme } from "next-themes";
import { useParams, useRouter } from "next/navigation";
import { GET_CHATS } from "@/graphql/chat/queries";
import { useInitText } from "@/app/context/InitTextContext";
import { GET_CHATGROUP } from "@/graphql/chatgroup/queries";
import { FolderOutlined, MoreHorizRounded } from "@mui/icons-material";
import ActionKebabMenu from "@/app/components/chat/ActionKebabMenu";
import NewProjectModal from "@/app/components/chat/NewProjectModal";
import Swal from "sweetalert2";
import { UPDATE_CHATGROUP } from "@/graphql/chatgroup/mutations";
import ProjectSearchModal from "@/app/components/chat/ProjectSearchModal";
import { getAiLogo, AI_LOGOS } from "../../../../../util/aiLogo";
import PromptList from "@/app/components/chat/PromptList";
import { GET_PROMPTS } from "@/graphql/prompt/queries";
import { extractErrorMessage, showErrorAlert } from "@/util/errorAlert"; // ปรับ path ให้ตรงโปรเจกต์จริง
import { useLanguage } from "@/app/context/LanguageContext";
import { GET_GROUP_BY_NAME } from "@/graphql/group/queries";
import AcademySearchModal from "@/app/components/chat/AcademyButtonModal";

const PAGE_SIZE = 10; // ✅ lazy loading

const ChatgroupPage = () => {
  const client = useApolloClient();
  const { locale } = useLanguage();
  const { 
    initText, 
    setInitText, 
    initAttachments, 
    setInitAttachments, 
    initMessageType, 
    setInitMessageType 
  } = useInitText();
  const router = useRouter();
  const { user } = useAuth();
  const { theme } = useTheme();
  const tDelete = useTranslations("DeleteAlert"); // สำหรับข้อความลบ
  const tchaterror = useTranslations('ChatError');

  const params = useParams();
  const { id } = params;

  const [attachments, setAttachments] = useState([]); // File[]

  const [model, setModel] = useState("0");

  const [active, setActive] = useState(null);
  const [open, setOpen] = useState(false);

  const [rename, setRename] = useState(null);
  // ---- Modal: โครงการใหม่ (แยกเป็นคอมโพเนนต์) ----
  const [newOpen, setNewOpen] = useState(false);

  // --- เมนูจุดสามจุด ---
  const [menuAnchor, setMenuAnchor] = useState(null);
  const [selected, setSelected] = useState(null);
  const menuOpen = Boolean(menuAnchor);

  // ===============================
  // ✅ lazy loading states
  // ===============================
  const [edges, setEdges] = useState([]);
  const [endCursor, setEndCursor] = useState(null);
  const [hasNextPage, setHasNextPage] = useState(false);

  const loaderRef = useRef(null);

  // state เปิด/ปิด modal ค้นหา
  const [openSearch, setOpenSearch] = useState(false);

  const tInit = useTranslations("Init");
  const tChatSidebar = useTranslations("ChatSidebar");
  const tError = useTranslations('ErrorAlert');
  const tAcademyError = useTranslations('AcademyError');

  const isMobile = useMediaQuery("(max-width:600px)"); // < md คือจอเล็ก
  const isTablet = useMediaQuery("(max-width:1200px)"); // < md คือจอเล็ก

  const {
    data: chatsData,
    loading: chatsLoading,
    error: chatsError,
    fetchMore,
    refetch,
    networkStatus,
  } = useQuery(GET_CHATS, {
    variables: {
      user_id: user?.id ?? "",
      chatgroup_id: id,
      first: PAGE_SIZE,
      after: null,
    },
    skip: !user?.id,
    notifyOnNetworkStatusChange: true,
    fetchPolicy: "network-only",
  });
  // console.log(chatsData?.chats?.edges);

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

  const { refetch: chatsRefresh } = useQuery(GET_CHATS, {
    variables: {
      user_id: user?.id ?? "",
      chatgroupMode: "NULL",
    },
    fetchPolicy: "network-only",
  });

  const {
    data: userData,
    loading: userLoading,
    error: userError,
  } = useQuery(GET_USER, {
    fetchPolicy: "network-only",
    variables: {
      id: user?.id,
    },
  });
  // console.log(userData?.user?.user_ai);

  const {
    data: groupData,
    loading: groupLoading,
    error: groupError,
  } = useQuery(GET_GROUP_BY_NAME, {
    fetchPolicy: "network-only",
    variables: {
      name: user?.group_name,
    },
  });

  const {
    data: chatgroupData,
    loading: chatgroupLoading,
    error: chatgroupError,
  } = useQuery(GET_CHATGROUP, {
    fetchPolicy: "network-only",
    variables: {
      id: id,
      user_id: user?.id,
    },
  });
  // console.log(chatgroupData?.chatgroup);

  const [createChat] = useMutation(CREATE_CHAT);
  const [updateChat] = useMutation(UPDATE_CHAT);
  const [deleteChat] = useMutation(DELETE_CHAT);
  const [mutate, { loading, error }] = useMutation(MULTIPLE_UPLOAD, {
    client,
  });

  // ===============================
  // รวม edges (กัน duplicate)
  // ===============================
  useEffect(() => {
    const conn = chatsData?.chats;
    if (!conn) return;

    const incoming = conn.edges ?? [];
    const seen = new Set();
    const merged = [];

    for (const e of incoming) {
      if (!seen.has(e.cursor)) {
        seen.add(e.cursor);
        merged.push(e);
      }
    }

    setEdges(merged);
    setEndCursor(conn.pageInfo?.endCursor ?? null);
    setHasNextPage(Boolean(conn.pageInfo?.hasNextPage));
  }, [chatsData?.chats]);

  // เพิ่ม useEffect เพื่อ set ค่า model อัตโนมัติ
  useEffect(() => {
    if (!groupData?.groupByName?.ai) return;
    if (!userData?.user?.user_ai) return;
  
    const groupAiName = groupData.groupByName.ai.model_use_name;
  
    const matchedAI = userData.user.user_ai.find(
      (ua) => ua.ai?.model_use_name === groupAiName
    );
  
    if (matchedAI) {
      setModel(String(matchedAI.ai_id ?? matchedAI.id));
    }
  }, [groupData, userData]);

  // ===============================
  // โหลดเพิ่ม
  // ===============================
  const loadMore = useCallback(async () => {
    if (!hasNextPage || !endCursor) return;

    const res = await fetchMore({
      variables: {
        user_id: user?.id,
        chatgroupMode: "NULL",
        first: PAGE_SIZE,
        after: endCursor,
      },
    });

    const conn = res?.data?.chats;
    if (!conn) return;

    setEdges((prev) => {
      const seen = new Set(prev.map((e) => e.cursor));
      const merged = [...prev];
      for (const e of conn.edges ?? []) {
        if (!seen.has(e.cursor)) {
          seen.add(e.cursor);
          merged.push(e);
        }
      }
      return merged;
    });

    setEndCursor(conn.pageInfo?.endCursor ?? null);
    setHasNextPage(Boolean(conn.pageInfo?.hasNextPage));
  }, [fetchMore, endCursor, hasNextPage, user?.id]);

  // ===============================
  // IntersectionObserver
  // ===============================
  useEffect(() => {
    const el = loaderRef.current;
    if (!el || !hasNextPage) return;

    let locked = false;
    const io = new IntersectionObserver(
      async (entries) => {
        if (entries[0].isIntersecting && !locked) {
          locked = true;
          try {
            await loadMore();
          } finally {
            setTimeout(() => (locked = false), 150);
          }
        }
      },
      { threshold: 0 }
    );

    io.observe(el);
    return () => io.disconnect();
  }, [hasNextPage, loadMore]);

  // ===============================
  // แปลงเป็น items (เหมือนเดิม)
  // ===============================
  const items = useMemo(
    () =>
      edges
        .map((e) => e.node)
        .filter(Boolean)
        .map((n) => ({
          id: n.id,
          model_type: n.ai.model_type,
          label: n.chat_name,
          href: `/onesqa/chat/${n.id}`,
        })),
    [edges]
  );

  useEffect(() => {
    // รอให้โหลดเสร็จก่อน
    if (chatgroupLoading) return;

    // ถ้า query ตอบกลับมาแล้วว่า chat เป็น null -> กลับหน้า list
    if (chatgroupData && chatgroupData.chatgroup === null) {
      router.replace("/onesqa/chat");
    }
  }, [chatgroupLoading, chatgroupData, router]);

  const clearedRef = useRef(false);
  useEffect(() => {
    if (clearedRef.current) return;
    clearedRef.current = true;

    setInitText("");
    setInitAttachments([]);
    setInitMessageType('TEXT');
  }, [setInitText, setInitAttachments, setInitMessageType]);

  if (
    (userLoading || chatsLoading || chatgroupLoading || promptsLoading || groupLoading) &&
    networkStatus === NetworkStatus.loading
  )
    return (
      <Box sx={{ textAlign: "center", mt: 5 }}>
        <CircularProgress />
        <Typography>{tInit("loading")}...</Typography>
      </Box>
    );

  if (userError || chatsError || chatgroupError || promptsError || groupError)
    return (
      <Typography color="error" sx={{ mt: 5 }}>
        ❌ {tInit("error")}
      </Typography>
    );

  const textUserAis = (userData?.user?.user_ai ?? []).filter(
    (ua) => String(ua?.ai?.message_type).toUpperCase() === "TEXT"
  );

  const handleOpenMenu = (e, item) => {
    e.preventDefault();
    e.stopPropagation(); // กันไม่ให้ Link ทำงาน
    setSelected(item);
    setMenuAnchor(e.currentTarget);
  };
  const handleCloseMenu = () => {
    setMenuAnchor(null);
    setSelected(null);
  };

  // ตัวอย่าง action (เปลี่ยนชื่อ / ลบ)
  const handleRename = () => {
    // console.log("rename:", selected?.label);
    setRename(selected);
    setNewOpen(true);
    handleCloseMenu();
  };

  const openNewProject = (e) => {
    e?.preventDefault?.();
    e?.stopPropagation?.();
    setNewOpen(true);
  };
  const closeNewProject = () => {
    setNewOpen(false);
    setRename(null);
  };
  const handleUpdateChat = async (name) => {
    // TODO: เรียก API / mutation สร้างโครงการ
    // console.log("เเก้ไขชื่อเเชต:", name);

    try {
      // ✅ เรียก mutation ไป backend
      const { data } = await updateChat({
        variables: {
          id: rename?.id,
          input: {
            user_id: user?.id,
            chat_name: name,
          },
        },
      });
      // console.log("✅ Update success:", data.updateChat);
      refetch();
      setNewOpen(false);
      setRename(null);
    } catch (error) {
      // console.log(error);
    }
  };

  const handleDelete = async () => {
    //console.log("delete:", selected?.id, selected?.label);
    if (theme === "dark") {
      Swal.fire({
        title: tDelete("title1"),
        text: tDelete("textchat1"),
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
            const { data } = await deleteChat({
              variables: {
                id: selected?.id,
              },
            });
            // console.log("✅ Delete success:", data.deleteChat);
            refetch();
            handleCloseMenu();
          } catch (error) {
            // console.log(error);
          }

          Swal.fire({
            title: tDelete("title2"),
            text: tDelete("textchat2"),
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
        text: tDelete("textchat1"),
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
            const { data } = await deleteChat({
              variables: {
                id: selected?.id,
              },
            });
            // console.log("✅ Delete success:", data.deleteChat);
            refetch();
            handleCloseMenu();
          } catch (error) {
            // console.log(error);
          }

          Swal.fire({
            title: tDelete("title2"),
            text: tDelete("textchat2"),
            icon: "success",
            confirmButtonColor: "#3E8EF7",
          });
        }
      });
    }
  };
  const handleUpdateGroup = async () => {
    setRename(selected);
    setOpenSearch(true);
    handleCloseMenu();
  };
  const handleUpdateGroupData = async (item) => {
    // console.log("rename", rename);

    try {
      // ✅ เรียก mutation ไป backend
      const { data } = await updateChat({
        variables: {
          id: rename?.id,
          input: {
            chatgroup_id: item.id,
          },
        },
      });
      // console.log("✅ Update success:", data.updateChat);
      refetch();
    } catch (error) {
      // console.log(error);
    }
  };
  const handleDeleteGroup = async () => {
    // console.log("selected", selected);

    try {
      // ✅ เรียก mutation ไป backend
      const { data } = await updateChat({
        variables: {
          id: selected?.id,
          input: {
            chatgroup_id: null,
          },
        },
      });
      // console.log("✅ Update success:", data.updateChat);

      await client.refetchQueries({
        include: [GET_CHATS],
      });
      setNewOpen(false);
      setRename(null);
    } catch (error) {
      // console.log(error);
    }
  };

  const onClear = () => setInitAttachments([]);
  const handleSubmitFile = async () => {
    if (!initAttachments.length) return;
    try {
      const { data } = await mutate({
        variables: {
          files: initAttachments,
          ai_id: model,
          user_id: user?.id,
        },
      });
      // console.log(data);
      setInitAttachments(data?.multipleUpload);
      //onClear();
      handleCreateChat();
    } catch (error) {
      showErrorAlert(error, theme, {
        title: tchaterror('error1'),
        t: tError
      });
    }
  };

  const handleCreateChat = async () => {
    try {
      // สมมติว่ามีตัวแปรภาษาชื่อ locale = 'th' | 'en'
      const trimmedText = initText?.trim() ?? "";

      const chatName =
        trimmedText
          ? (trimmedText.length > 40
              ? (locale === "th" ? "แชตใหม่" : "new chat")
              : trimmedText
            )
          : (locale === "th" ? "แชตใหม่จากเสียง" : "new chat from mic");

      const { data } = await createChat({
        variables: {
          input: {
            ai_id: model,
            user_id: user?.id,
            chat_name: chatName,
            chatgroup_id: id,
          },
        },
      });

      // console.log("✅ Create success:", data.createChat);
      // ✅ ส่งพารามิเตอร์ new=true ไปด้วย
      router.push(`/onesqa/chat/${data.createChat.id}?new=true`);
      //refetch();
    } catch (error) {
      showErrorAlert(error, theme, {
        title: tchaterror('error1'),
        t: tError
      });
    }
  };

  const handleOpen = () => {
    setOpen(true);
    //if (isTablet) toggle(); // ปิด sidebar บนจอเล็กเหมือนเดิม
  };

  const MAX_FILES = 10;

  const guessMime = (name = "") => {
    const ext = name.toLowerCase().split(".").pop();
    const map = {
      pdf: "application/pdf",
      doc: "application/msword",
      docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      ppt: "application/vnd.ms-powerpoint",
      pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
      xls: "application/vnd.ms-excel",
      xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      jpg: "image/jpeg",
      jpeg: "image/jpeg",
      png: "image/png",
      mp3: "audio/mpeg",
      mp4: "video/mp4",
    };
    return map[ext] || "";
  };

  const isGoogleDriveUrl = (url = "") => {
    const s = String(url);
    return s.includes("drive.google.com");
  };

  const normalizeDriveUrl = (url = "") => {
    const s = String(url).trim();

    // https://drive.google.com/file/d/<id>/view
    const m1 = s.match(/drive\.google\.com\/file\/d\/([^/]+)/i);
    if (m1?.[1]) return `https://drive.google.com/uc?export=download&id=${m1[1]}`;

    // https://drive.google.com/open?id=<id> หรือ .../uc?id=<id>
    const m2 = s.match(/[?&]id=([^&]+)/i);
    if (m2?.[1] && s.includes("drive.google.com")) {
      return `https://drive.google.com/uc?export=download&id=${m2[1]}`;
    }

    return s;
  };

  const filenameFromCD = (cd = "") => {
    // Content-Disposition: attachment; filename="xxx.pdf"
    const m = cd.match(/filename\*?=(?:UTF-8''|")?([^";\n]+)"?/i);
    if (!m?.[1]) return null;
    try { return decodeURIComponent(m[1]); } catch { return m[1]; }
  };

  const fileNameFromUrl = (u = "") => {
    const clean = String(u).split("?")[0];
    const last = clean.split("/").pop() || "file";
    try { return decodeURIComponent(last); } catch { return last; }
  };

  /**
   * ✅ unified urlToFile:
   * - google drive: ใช้ normalize + cd filename + html check
   * - others: ใช้ชื่อจาก url + guessMime
   */
  const urlToFile = async (url) => {
    const original = String(url || "");
    const isDrive = isGoogleDriveUrl(original);

    // ✅ ใช้ url ที่ถูก normalize เฉพาะ drive
    const normalized = isDrive ? normalizeDriveUrl(original) : original;

    // ✅ ทุกกรณีใช้ proxy กัน CORS
    const proxied = `/api/proxy-file?url=${encodeURIComponent(normalized)}`;

    const res = await fetch(proxied);
    if (!res.ok) throw new Error(`Download failed: ${res.status}`);

    const ct = res.headers.get("content-type") || "";

    // ✅ Drive ต้องกัน HTML (พวกหน้า login/confirm/view)
    if (isDrive && ct.includes("text/html")) {
      throw new Error("Google Drive: ไฟล์ไม่ public หรือยังไม่ใช่ direct download");
    }

    const blob = await res.blob();

    // ---- ตั้งชื่อไฟล์ ----
    let name = null;

    if (isDrive) {
      // ✅ Drive: เอาจาก Content-Disposition ก่อน
      const cd = res.headers.get("content-disposition") || "";
      name = filenameFromCD(cd);

      // fallback: ตั้งชื่อแบบ pdf ถ้าไม่มีชื่อ
      if (!name || !name.includes(".")) {
        name = ct.includes("pdf") ? "google-drive.pdf" : "google-drive-file";
      }
    } else {
      // ✅ non-drive: เอาชื่อจาก url
      name = fileNameFromUrl(original);
      // ถ้าไม่มีนามสกุล แต่ content-type เป็น pdf ให้เติม .pdf
      if (!name.includes(".") && ct.includes("pdf")) name = `${name}.pdf`;
    }

    const type = blob.type || ct || guessMime(name) || "application/octet-stream";

    const f = new File([blob], name, {
      type,
      lastModified: Date.now(),
    });

    f.__fromSar = true;
    f.__sarUrl = original;

    return f;
  };

  const mergeDedup = (prev = [], incoming = []) => {
    const seen = new Set(prev.map((f) => `${f.name}|${f.size}|${f.lastModified || 0}`));
    const merged = [...prev];

    for (const f of incoming) {
      const key = `${f.name}|${f.size}|${f.lastModified || 0}`;
      if (!seen.has(key)) {
        seen.add(key);
        merged.push(f);
      }
    }
    return merged;
  };

  return (
    <>
      <Box
        sx={{
          display: "flex",
          flexDirection: isMobile ? "column" : "row", // ✅ สลับแนวตามจอ
          alignItems: isMobile ? "flex-start" : "center",
          justifyContent: "space-between",
          gap: isMobile ? 1 : 0, // ✅ สลับแนวตามจอ
          px: 5,
          mb: 3,
        }}
      >
        <Select
          value={model}
          onChange={(e) => setModel(e.target.value)}
          size="small"
          displayEmpty
          renderValue={(selected) => {
            if (selected === "0") {
              return (
                <Typography sx={{ opacity: 0.7 }}>
                  {tChatSidebar("menuitem")}
                </Typography>
              );
            }

            const ua = textUserAis.find(
              (x) => String(x.ai_id ?? x.id) === String(selected)
            );

            return (
              <Box sx={{ display: "flex", alignItems: "center", gap: 1, minWidth: 0 }}>
                <Avatar
                  src={getAiLogo(ua?.ai)}
                  alt={ua?.ai?.model_type ?? "AI"}
                  sx={{ width: 20, height: 20 }}
                  imgProps={{ onError: (e) => (e.currentTarget.src = AI_LOGOS.default) }}
                />
                <Typography noWrap sx={{ minWidth: 0 }}>
                  {ua?.ai?.model_use_name ?? "AI"}
                </Typography>
              </Box>
            );
          }}
          sx={{
            border: "1px solid",
            borderColor: "primary.main",
            backgroundColor: "background.paper",
            width: isMobile ? "100%" : "250px",
          }}
        >
          <MenuItem value="0">{tChatSidebar("menuitem")}</MenuItem>

          {textUserAis.map((ua) => (
            <MenuItem key={ua.id} value={ua.ai_id ?? ua.id}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <Avatar
                  src={getAiLogo(ua.ai)}
                  alt={ua.ai?.model_type ?? "AI"}
                  sx={{ width: 20, height: 20 }}
                  imgProps={{ onError: (e) => (e.currentTarget.src = AI_LOGOS.default) }}
                />
                <Typography noWrap>{ua.ai?.model_use_name}</Typography>
              </Box>
            </MenuItem>
          ))}
        </Select>

        {user?.role_name_th === "ผู้ประเมินภายนอก" && (
          <>
            <Button
              variant="contained"
              onClick={handleOpen}
              sx={{
                width: isMobile ? "100%" : "auto",
                bgcolor: "#1976D2",
                color: "white",
                "&:hover": { bgcolor: "#1565C0" },
              }}
            >
              {tChatSidebar("academy")}
            </Button>

            <AcademySearchModal
              open={open}
              onClose={() => setOpen(false)}
              onUpload={async ({ selectedUrls }) => {
                try {
                  // ✅ กันเกิน maxFiles
                  const remain = MAX_FILES - (initAttachments?.length ?? 0);
                  if (remain <= 0) return;

                  const urls = selectedUrls.slice(0, remain);

                  // ✅ download -> File[]
                  const files = await Promise.all(urls.map(urlToFile));

                  // ✅ ใส่เข้า attachments ของ ChatInputBar
                  setInitAttachments((prev = []) => mergeDedup(prev, files));

                  // ปิด modal หลังเลือกเสร็จ (ถ้าต้องการ)
                  setOpen(false);
                } catch (err) {
                  showErrorAlert(err, theme, {
                    title: tAcademyError("error2"),
                    t: tError
                  });
                }
              }}
            />
          </>
        )}
      </Box>
      <Container
        maxWidth="md"
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 5,
        }}
      >
        <Box
          sx={{ display: "flex", alignItems: "center", gap: 1.25, minWidth: 0 }}
        >
          <FolderOutlined sx={{ fontSize: { xs: 48, md: 48 } }} />
          <Typography
            component="h1"
            variant="h4" // ปรับขนาดหัวเรื่อง (h4 ใหญ่ขึ้นอีก)
            noWrap
            sx={{
              fontWeight: 700,
              letterSpacing: 0.2,
              lineHeight: 1.2,
              minWidth: 0,
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
            title={chatgroupData?.chatgroup?.chatgroup_name || ""}
          >
            {chatgroupData?.chatgroup?.chatgroup_name ?? "—"}
          </Typography>
        </Box>

        <Box
          sx={{
            width: "100%",
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <ChatInputBar
            theme = {theme}
            messageType = {initMessageType}
            setMessageType = {setInitMessageType}
            value={initText}
            model={model}
            onChange={setInitText}
            attachments={initAttachments}
            setAttachments={setInitAttachments}
            onSend={async (msg) => {
              try {
                const hasFiles = (initAttachments?.length ?? 0) > 0;
                if (hasFiles) {
                  await handleSubmitFile(); // มีไฟล์ -> ใช้อันบน
                } else {
                  await handleCreateChat(); // ไม่มีไฟล์ -> ใช้อันล่าง
                  // หรือถ้าฟังก์ชันของคุณต้องการข้อความ: await handleCreateChat(msg);
                }
                // setInitText(""); // ล้างอินพุตหลังส่ง (ถ้าต้องการ)
              } catch (err) {
                // console.log(err);
              }
            }}
            placeholder={tChatSidebar("inputph")}
            actions={[
              // {
              //   key: "deep",
              //   label: tChatSidebar("deepresearch"),
              //   onClick: () => console.log("deep"),
              //   icon: <ScienceOutlinedIcon />,
              // },
              // {
              //   key: "canvas",
              //   label: "Canvas",
              //   onClick: () => console.log("canvas"),
              //   icon: <BrushOutlinedIcon />,
              // },
            ]}
            onMicClick={() => console.log("mic")}
            onAttachClick={() => console.log("attach menu")}
            onFilesSelected={(fileList) => {
              const files = Array.from(fileList); // FileList -> File[]
              // console.log("selected files:", files);
            }}
            accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.ppt,.pptx,.xls,.xlsx,.mp3,.mp4"
            sx={{
              backgroundColor: "background.paper",
              boxShadow: "0 3px 8px rgba(0,0,0,0.05)",
              height: "100%",
              width: "100%",
            }} // ปรับแต่งเพิ่มเติมได้
          />
        </Box>

        <Box
          sx={{
            width: "100%",
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <PromptList
            steps={promptsData?.prompts}
            activeIndex={active}
            onChange={setActive}
            onTextChange={setInitText}
          />
        </Box>

        <Box
          sx={{
            width: "90%",
            height: "90%",
          }}
        >
          <List disablePadding>
            {items.map((it) => {
              const isActive = menuOpen && selected?.id === it.id;

              return (
                <Link
                  key={it.id}
                  href={it.href}
                  style={{ textDecoration: "none", color: "inherit" }}
                >
                  <ListItemButton
                    disableRipple
                    sx={{
                      pl: 1.5,
                      pr: 1,
                      minHeight: 40,
                      py: 0.75,
                      borderBottom: "1px solid",
                      borderColor: "divider",

                      "& .kebab": {
                        opacity: isActive ? 1 : 0,
                        transition: "opacity .15s ease",
                      },
                      "&:hover .kebab": {
                        opacity: 1,
                      },
                    }}
                  >
                    {/* 🔹 Avatar ใหญ่ขึ้น */}
                    <Avatar
                      src={getAiLogo(it)}
                      sx={{ width: 24, height: 24, mr: 1 }}
                      imgProps={{
                        onError: (e) =>
                          (e.currentTarget.src = AI_LOGOS.default),
                      }}
                    />

                    {/* 🔹 Text ใหญ่ขึ้นนิดเดียว */}
                    <ListItemText
                      primary={it.label}
                      primaryTypographyProps={{
                        fontSize: 15,
                        lineHeight: 1.2,
                      }}
                    />

                    {/* 🔹 IconButton ใหญ่ขึ้นแบบไม่เทอะทะ */}
                    <IconButton
                      className="kebab"
                      size="small"
                      disableRipple
                      sx={{
                        ml: 0.5,
                        p: 0.5, // เพิ่มพื้นที่คลิกเล็กน้อย
                      }}
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setSelected(it);
                        setMenuAnchor(e.currentTarget);
                      }}
                    >
                      <MoreHorizRounded fontSize="medium" />
                    </IconButton>
                  </ListItemButton>
                </Link>
              );
            })}

            {items.length === 0 && (
              <Typography
                sx={{
                  textAlign: "center",
                  opacity: 0.6,
                  py: 2,
                }}
              >
                -- {tChatSidebar("notfound1")} --
              </Typography>
            )}

            {/* ✅ Sentinel */}
            <Box
              ref={loaderRef}
              sx={{ display: "flex", justifyContent: "center", py: 1 }}
            >
              {networkStatus === NetworkStatus.fetchMore && (
                <Typography variant="caption" sx={{ opacity: 0.6 }}>
                  Loading...
                </Typography>
              )}
              {!hasNextPage && items.length > 0 && (
                <Typography
                  variant="caption"
                  sx={{ opacity: 0.6 }}
                ></Typography>
              )}
            </Box>
          </List>
        </Box>
      </Container>

      {/* Dropdown เมนูแบบในภาพ */}
      {/* เรียกใช้คอมโพเนนต์เมนูที่แยกออกมา */}
      <ActionKebabMenu
        anchorEl={menuAnchor}
        open={menuOpen}
        onClose={handleCloseMenu}
        onRename={handleRename}
        onChangeGroup={handleUpdateGroup}
        onDelete={handleDelete}
        onDeleteGroup={handleDeleteGroup}
        // ปรับข้อความได้ตามบริบท เช่น "กลุ่ม"
        renameLabel={tChatSidebar("chatdropdownrename")}
        changeGroupLabel={tChatSidebar("chatdropdowngroup")}
        deleteGroupLabel={`${tChatSidebar("chatdropdowndeletegroup")} ${
          chatgroupData?.chatgroup?.chatgroup_name ?? "—"
        }`}
        deleteLabel={tChatSidebar("chatdropdowndelete")}
        // paperSx={{ minWidth: 200 }} // ถ้าต้องการปรับแต่งเพิ่ม
      />

      {/* ใช้คอมโพเนนต์ Modal ที่แยกไว้ */}
      <NewProjectModal
        open={newOpen}
        onClose={closeNewProject}
        onCreate={handleUpdateChat}
        initialName={rename?.label} // ถ้าต้องการค่าเริ่มต้น
        title={tChatSidebar("chattitleedit")}
        label={tChatSidebar("chatlabel")}
        confirmLabel={tChatSidebar("chatcomfirmedit")}
      />

      {openSearch && (
        <ProjectSearchModal
          open={openSearch}
          onClose={() => setOpenSearch(false)}
          onSelect={(item) => {
            // ทำอะไรก็ได้เมื่อเลือกผลลัพธ์
            // console.log("เลือก:", item);
            handleUpdateGroupData(item);
            // ตัวอย่าง: ไปหน้าแชตของ item.id
            // router.push(`/chat/${item.id}`);
            setOpenSearch(false);
          }}
          group_id={id}
        />
      )}
    </>
  );
};

export default ChatgroupPage;
