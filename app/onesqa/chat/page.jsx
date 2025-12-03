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

const ChatPage = () => {
  const client = useApolloClient();
  const { initText, setInitText, initAttachments, setInitAttachments } = useInitText();
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
    data: promptsData,
    loading: promptsLoading,
    error: promptsError,
    refetch: promptsRefetch,
  } = useQuery(GET_PROMPTS, {
    fetchPolicy: "network-only",
    notifyOnNetworkStatusChange: true, // ✅ ให้ re-render ตอนกำลัง refetch
  });

  const [createChat] = useMutation(CREATE_CHAT);
  const [mutate, { loading, error }] = useMutation(MULTIPLE_UPLOAD, {
    client,
  });

  if (userLoading || promptsLoading)
    return (
      <Box sx={{ textAlign: "center", mt: 5 }}>
        <CircularProgress />
        <Typography>{tInit("loading")}...</Typography>
      </Box>
    );

  if (userError || promptsError)
    return (
      <Typography color="error" sx={{ mt: 5 }}>
        ❌ {tInit("error")}
      </Typography>
    );

  console.log(initAttachments);

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
        title: "ส่งคำถามไปยัง Model ไม่สำเร็จ",
      });
    }
  };

  const handleCreateChat = async () => {
    try {
      const { data } = await createChat({
        variables: {
          input: {
            ai_id: model,
            user_id: user?.id,
            chat_name: initText,
          },
        },
      });

      console.log("✅ Create success:", data.createChat);
      refetch();
      // ✅ ส่งพารามิเตอร์ new=true ไปด้วย
      router.push(`/onesqa/chat/${data.createChat.id}?new=true`);
    } catch (error) {
      showErrorAlert(error, theme, {
        title: "ส่งคำถามไปยัง Model ไม่สำเร็จ",
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
          onChange={(e) => {
            setModel(e.target.value);
          }}
          size="small"
          sx={{
            border: "1px solid",
            borderColor: "primary.main",
            backgroundColor: "background.paper",
            width: "250px",
          }}
        >
          <MenuItem value="0">กรุณาเลือกโมเดลคำตอบ</MenuItem>
          {(userData?.user?.user_ai ?? []).map((ua) => (
            <MenuItem key={ua.id} value={ua.ai_id ?? ua.id}>
              <Avatar
                src={getAiLogo(ua.ai)}
                alt={ua.ai?.model_type ?? "AI"}
                sx={{ width: 20, height: 20, mr: 0.5 }}
                imgProps={{
                  onError: (e) => (e.currentTarget.src = AI_LOGOS.default),
                }}
              />
              {ua.ai?.model_use_name}
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
                console.error(err);
              }
            }}
            placeholder="ป้อนข้อความ.."
            actions={[
              {
                key: "deep",
                label: "Deep Research",
                onClick: () => console.log("deep"),
                icon: <ScienceOutlinedIcon />,
              },
              {
                key: "canvas",
                label: "Canvas",
                onClick: () => console.log("canvas"),
                icon: <BrushOutlinedIcon />,
              },
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
          />
        </Box>
      </Container>
    </>
  );
};

export default ChatPage;
