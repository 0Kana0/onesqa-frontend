"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
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
  Avatar,
  ListItemIcon,
} from "@mui/material";
import { useTheme } from "next-themes";
import { useTranslations } from "next-intl";
import { GET_USER } from "@/graphql/user/queries";
import ScienceOutlinedIcon from "@mui/icons-material/ScienceOutlined";
import BrushOutlinedIcon from "@mui/icons-material/BrushOutlined";
import ChatInputBar from "@/app/components/chat/ChatInputBar";
import { useAuth } from "@/app/context/AuthContext";
import { CREATE_CHAT } from "@/graphql/chat/mutations";
import { MULTIPLE_UPLOAD } from "@/graphql/file/mutations";
import { useRouter } from "next/navigation";
import { GET_CHATS } from "@/graphql/chat/queries";
import { useInitText } from "@/app/context/InitTextContext";
import { getAiLogo, AI_LOGOS } from "../../../util/aiLogo";
import PromptList from "@/app/components/chat/PromptList";
import { GET_PROMPTS } from "@/graphql/prompt/queries";
import { extractErrorMessage, showErrorAlert } from "@/util/errorAlert"; // ปรับ path ให้ตรงโปรเจกต์จริง
import { useLanguage } from "@/app/context/LanguageContext";
import { GET_GROUP_BY_NAME } from "@/graphql/group/queries";
import AcademySearchModal from "@/app/components/chat/AcademyButtonModal";

const ChatPage = () => {
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
  const [attachments, setAttachments] = useState([]); // File[]

  const [model, setModel] = useState("0");

  const [active, setActive] = useState(null);
  const [open, setOpen] = useState(false);

  // const steps = [
  //   { prompt_title: "มาตรฐานการประเมินคุณภาพภายนอก" },
  //   { prompt_title: "ขั้นตอนการประเมินคุณภาพภายนอก" },
  //   { prompt_title: "เกณฑ์การให้คะแนนการประเมิน" },
  //   { prompt_title: "เกณฑ์การให้คะแนนการประเมินเกณฑ์การให้คะแนนการประเมิน" },
  //   { prompt_title: "เกณฑ์การให้คะแนนการประเมินเกณฑ์การให้คะแนนการประเมิน" },
  // ];

  const tInit = useTranslations("Init");
  const tChatSidebar = useTranslations("ChatSidebar");
  const tchaterror = useTranslations('ChatError');
  const tError = useTranslations('ErrorAlert');
  const tAcademyError = useTranslations('AcademyError');

  const isMobile = useMediaQuery("(max-width:600px)"); // < md คือจอเล็ก
  const isTablet = useMediaQuery("(max-width:1200px)"); // < md คือจอเล็ก

  const { refetch } = useQuery(GET_CHATS, {
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

  const [createChat] = useMutation(CREATE_CHAT);
  const [mutate, { loading, error }] = useMutation(MULTIPLE_UPLOAD, {
    client,
  });

  const clearedRef = useRef(false);
  useEffect(() => {
    if (clearedRef.current) return;
    clearedRef.current = true;

    setInitText("");
    setInitAttachments([]);
    setInitMessageType('TEXT');
  }, [setInitText, setInitAttachments, setInitMessageType]);

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

  if (userLoading || promptsLoading || groupLoading)
    return (
      <Box sx={{ textAlign: "center", mt: 5 }}>
        <CircularProgress />
        <Typography>{tInit("loading")}...</Typography>
      </Box>
    );

  if (userError || promptsError || groupError)
    return (
      <Typography color="error" sx={{ mt: 5 }}>
        ❌ {tInit("error")}
      </Typography>
    );

  // console.log(initAttachments);
  // console.log("groupData", groupData.groupByName);

  const textUserAis = (userData?.user?.user_ai ?? []).filter(
    (ua) => String(ua?.ai?.message_type).toUpperCase() === "TEXT"
  );

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
      setInitAttachments(data?.multipleUpload)
      //onClear();
      handleCreateChat()
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
          },
        },
      });

      // console.log("✅ Create success:", data.createChat);
      //refetch();
      // await client.refetchQueries({
      //   include: [GET_CHATS],
      // });
      // ✅ ส่งพารามิเตอร์ new=true ไปด้วย
      router.push(`/onesqa/chat/${data.createChat.id}?new=true`);
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
          component="img"
          src="/images/chatIcon.png" // ✅ ใส่โลโก้ของคุณใน public/
          alt="chatIcon"
          sx={{
            width: isMobile ? 240 : 300,
            height: isMobile ? 240 : 300,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        />
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
            mb: 1,
          }}
        >
          <PromptList
            steps={promptsData.prompts}
            activeIndex={active}
            onChange={setActive}
            onTextChange={setInitText}
          />
        </Box>
      </Container>
    </>
  );
};

export default ChatPage;
