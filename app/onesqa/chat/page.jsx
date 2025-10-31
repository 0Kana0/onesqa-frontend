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
} from "@mui/material";
import { useTranslations } from "next-intl";
import { GET_USER } from "@/graphql/user/queries";
import ScienceOutlinedIcon from "@mui/icons-material/ScienceOutlined";
import BrushOutlinedIcon from "@mui/icons-material/BrushOutlined";
import ChatInputBar from "@/app/components/chat/ChatInputBar";
import { useAuth } from "@/app/context/AuthContext";
import { CREATE_CHAT } from "@/graphql/chat/mutations";
import { useRouter } from "next/navigation";
import { GET_CHATS } from "@/graphql/chat/queries";
import { useInitText } from "@/app/context/InitTextContext";

const ChatPage = () => {
  const { initText, setInitText } = useInitText();
  const router = useRouter();
  const { user } = useAuth();
  const [attachments, setAttachments] = useState([]); // File[]

  const [model, setModel] = useState("0");

  const tInit = useTranslations("Init");

  const isMobile = useMediaQuery("(max-width:600px)"); // < md คือจอเล็ก
  const isTablet = useMediaQuery("(max-width:1200px)"); // < md คือจอเล็ก

  const {
    refetch,
  } = useQuery(GET_CHATS, {
    variables: { user_id: user?.id ?? "" },
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
  console.log(userData?.user?.user_ai);

  const [createChat] = useMutation(CREATE_CHAT);

  if (userLoading)
    return (
      <Box sx={{ textAlign: "center", mt: 5 }}>
        <CircularProgress />
        <Typography>{tInit("loading")}...</Typography>
      </Box>
    );

  if (userError)
    return (
      <Typography color="error" sx={{ mt: 5 }}>
        ❌ {tInit("error")}
      </Typography>
    );

  const handleCreateChat = async () => {
    try {
      const { data } = await createChat({
        variables: {
          input: { 
            ai_id: model, 
            user_id: user?.id,
            chat_name: "แชตใหม่"
          },
        },
      });

      console.log("✅ Create success:", data.createChat);
      refetch()
      // ✅ ส่งพารามิเตอร์ new=true ไปด้วย
      router.push(`/onesqa/chat/${data.createChat.id}?new=true`);
    } catch (error) {
      console.log(error);
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
            mb: 5,
          }}
        >
          <ChatInputBar
            value={initText}
            model={model}
            onChange={setInitText}
            onSend={(msg) => {
              // เรียก mutation/ฟังก์ชันส่งข้อความที่คุณมี
              handleCreateChat()
              //setInitText(""); // ล้างหลังส่ง
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
                console.log("selected files:", files)
              }
            }
            accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
            sx={{
              backgroundColor: "background.paper",
              boxShadow: "0 3px 8px rgba(0,0,0,0.05)",
              height: "100%",
              width: "100%",
            }} // ปรับแต่งเพิ่มเติมได้
          />
        </Box>
      </Container>
    </>
  );
};

export default ChatPage;
