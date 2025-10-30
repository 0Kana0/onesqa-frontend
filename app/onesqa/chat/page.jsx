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

const ChatPage = () => {
  const { user } = useAuth();
  const [text, setText] = useState("");
  const [model, setModel] = useState("0");

  const tInit = useTranslations("Init");

  const isMobile = useMediaQuery("(max-width:600px)"); // < md คือจอเล็ก
  const isTablet = useMediaQuery("(max-width:1200px)"); // < md คือจอเล็ก

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
              {ua.ai?.model_name === "gpt-4o"
                ? "ChatGPT 4o"
                : ua.ai?.model_name === "gemini-2.5-pro"
                ? "Gemini 2.5 Pro"
                : ua.ai?.model_name}
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
            value={text}
            model={model}
            onChange={setText}
            onSend={(msg) => {
              // เรียก mutation/ฟังก์ชันส่งข้อความที่คุณมี
              console.log("send:", msg);
              setText(""); // ล้างหลังส่ง
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
            onFilesSelected={(files) => console.log("selected files:", files)}
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
