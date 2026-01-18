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

  console.log(initAttachments);
  console.log("groupData", groupData.groupByName);

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
      console.log(data);
      setInitAttachments(data?.multipleUpload)
      //onClear();
      handleCreateChat()
    } catch (error) {
      showErrorAlert(error, theme, {
        title: tchaterror('error1'),
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

      console.log("✅ Create success:", data.createChat);
      //refetch();
      // await client.refetchQueries({
      //   include: [GET_CHATS],
      // });
      // ✅ ส่งพารามิเตอร์ new=true ไปด้วย
      router.push(`/onesqa/chat/${data.createChat.id}?new=true`);
    } catch (error) {
      showErrorAlert(error, theme, {
        title: tchaterror('error1'),
      });
    }
  };

  return (
    <>
      <Box
        sx={{
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
              return <Typography sx={{ opacity: 0.7 }}>{tChatSidebar("menuitem")}</Typography>;
            }

            const ua = (userData?.user?.user_ai ?? []).find(
              (x) => String(x.ai_id ?? x.id) === String(selected)
            );

            return (
              <Box sx={{ display: "flex", alignItems: "center", gap: 1, minWidth: 0 }}>
                <Avatar
                  src={getAiLogo(ua?.ai)}
                  alt={ua?.ai?.model_type ?? "AI"}
                  sx={{ width: 20, height: 20 }}
                  imgProps={{
                    onError: (e) => (e.currentTarget.src = AI_LOGOS.default),
                  }}
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
            width: "250px",
          }}
        >
          <MenuItem value="0">{tChatSidebar("menuitem")}</MenuItem>

          {(userData?.user?.user_ai ?? []).map((ua) => (
            <MenuItem key={ua.id} value={ua.ai_id ?? ua.id}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <Avatar
                  src={getAiLogo(ua.ai)}
                  alt={ua.ai?.model_type ?? "AI"}
                  sx={{ width: 20, height: 20 }}
                  imgProps={{
                    onError: (e) => (e.currentTarget.src = AI_LOGOS.default),
                  }}
                />
                <Typography noWrap>{ua.ai?.model_use_name}</Typography>
              </Box>
            </MenuItem>
          ))}
        </Select>
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
            width: 300,
            height: 300,
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
                console.log(err);
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
              console.log("selected files:", files);
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
