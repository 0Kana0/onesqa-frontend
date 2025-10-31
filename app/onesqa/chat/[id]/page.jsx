"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { NetworkStatus } from "@apollo/client";
import { useQuery, useMutation, useApolloClient } from "@apollo/client/react";
import {
  Box,
  CircularProgress,
  Container,
  Divider,
  IconButton,
  Paper,
  TextField,
  Typography,
  useMediaQuery,
} from "@mui/material";
import { GET_MESSAGES } from "@/graphql/message/queries";
import { CREATE_MESSAGE } from "@/graphql/message/mutations";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import SendIcon from "@mui/icons-material/Send";
import ScienceOutlinedIcon from "@mui/icons-material/ScienceOutlined";
import BrushOutlinedIcon from "@mui/icons-material/BrushOutlined";
import ChatThread from "@/app/components/chat/ChatThread";
import ChatInputBar from "@/app/components/chat/ChatInputBar";
import TypingDots from "@/app/components/chat/TypingDots";
import { useInitText } from "@/app/context/InitTextContext";

const MessagePage = () => {
  const { initText, setInitText } = useInitText();
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const { id } = params;
  const isNew = searchParams.get("new") === "true";

  const tInit = useTranslations("Init");

  const isMobile = useMediaQuery("(max-width:600px)");
  const isTablet = useMediaQuery("(max-width:1200px)");

  const [text, setText] = useState("");
  const [question, setQuestion] = useState([]);
  const [answer, setAnswer] = useState([]);

  const ranOnceRef = useRef(false);

  const {
    data: messagesData,
    loading: messagesLoading,
    error: messagesError,
    networkStatus,
    refetch
  } = useQuery(GET_MESSAGES, {
    fetchPolicy: "network-only",
    variables: { chat_id: id },
  });

  const [createMessage, { loading: sending }] = useMutation(CREATE_MESSAGE);

  // ---------- เพิ่มส่วน autoscroll ----------
  const listRef = useRef(null);   // กล่องที่เลื่อน
  const bottomRef = useRef(null); // หมุดท้ายรายการ (กันพลาดบางเคส)

  const scrollToBottom = useCallback((smooth = false) => {
    requestAnimationFrame(() => {
      if (listRef.current) {
        listRef.current.scrollTo({
          top: listRef.current.scrollHeight,
          behavior: smooth ? "smooth" : "auto",
        });
      } else {
        bottomRef.current?.scrollIntoView({
          behavior: smooth ? "smooth" : "auto",
          block: "end",
        });
      }
    });
  }, []);

  // โหลดเสร็จครั้งแรก → เลื่อนไปล่างสุดทันที
  useEffect(() => {
    if (!messagesLoading) scrollToBottom(false);
  }, [messagesLoading, scrollToBottom]);

  // มีข้อความใหม่ใน state → เลื่อนแบบ smooth
  useEffect(() => {
    scrollToBottom(true);
  }, [messagesData?.messages.length, scrollToBottom, answer]);

  const handleMessageInitSubmit = async () => {

    setAnswer([{
      id: 0,
      role: 'user',
      text: initText,
      createdAt: null
    }])

    try {
      const { data } = await createMessage({
        variables: {
          input: { 
            chat_id: id, 
            message: initText 
          },
        },
      });
      
      console.log("✅ Create success:", data.createMessage);
      
      refetch()
    } catch (error) {
      console.log(error);
    }
  }

  // ✅ trigger เมื่อเพิ่งสร้างแชตใหม่
  useEffect(() => {
    if (!isNew) return;            // ต้องเป็นเคสที่ new เท่านั้น
    if (ranOnceRef.current) return; // กันซ้ำ (รวมเคส Strict Mode)

    ranOnceRef.current = true;

    console.log("isNew", isNew);
    handleMessageInitSubmit();
    setInitText("");
    router.replace(`/onesqa/chat/${id}`); // ล้าง query ออก
  }, [isNew, router, id]);
  // -----------------------------------------

  // โชว์โหลดเฉพาะ "ครั้งแรกจริง ๆ" (ยังไม่มี data)
    const isInitialLoading =
      networkStatus === NetworkStatus.loading && !messagesData;

  // ก่อนหน้าเคยเขียน if (logsLoading) return ... → เปลี่ยนเป็นเช็ค isInitialLoading
  if (isInitialLoading)
    return (
      <Box sx={{ textAlign: "center", mt: 5 }}>
        <CircularProgress />
        <Typography>{tInit("loading")}...</Typography>
      </Box>
    );

  if (messagesError)
    return (
      <Typography color="error" sx={{ mt: 5 }}>
        ❌ {tInit("error")}
      </Typography>
    );

  console.log(messagesData?.messages); 

  const handleMessageSubmit = async () => {
    if (!text.trim() || sending) return; // กันกดซ้ำ

    setAnswer([{
      id: messagesData?.messages.length,
      role: 'user',
      text: text,
      createdAt: null
    }])

    try {
      const { data } = await createMessage({
        variables: {
          input: { 
            chat_id: id, 
            message: text 
          },
        },
      });
      
      console.log("✅ Create success:", data.createMessage);
      refetch()
    } catch (error) {
      console.log(error);
    }
  }

  return (
    <Container
      maxWidth="md"
      sx={{
        minHeight: { xs: "100svh", md: "100dvh" }, // สูงเต็ม viewport
        display: "flex",
        flexDirection: "column",
        p: 0,
      }}
    >
      {/* โซนข้อความ: เลื่อนเฉพาะส่วนนี้ */}
      <ChatThread messages={messagesData?.messages} />
      {sending && 
        <>
          <ChatThread messages={answer} />
          <TypingDots size={12} color="primary.main" />
        </>
      }
      <Box ref={bottomRef} sx={{ height: 140 }} /> {/* หมุดท้าย */}

      {/* แถบพิมพ์: อยู่ล่างเสมอ + กันชน safe-area */}
      <Box
        sx={{
          position: "sticky",
          bottom: 0,
          backgroundColor: "background.default",
          borderColor: "divider",
          zIndex: 1,
        }}
      >
        <Box sx={{ display: "flex", gap: 1 }}>
          <ChatInputBar
            value={text}
            sending={sending}
            onChange={setText}
            onSend={(msg) => {
              // เรียก mutation/ฟังก์ชันส่งข้อความที่คุณมี
              handleMessageSubmit();
              setText(""); // ล้างหลังส่ง
            }}
            placeholder="ป้อนข้อความ.."
            actions={[
              { key: "deep", label: "Deep Research", onClick: () => console.log("deep"), icon: <ScienceOutlinedIcon /> },
              { key: "canvas", label: "Canvas", onClick: () => console.log("canvas"), icon: <BrushOutlinedIcon /> },
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
              mb: 3,
              height: "100%",
              width: "100%"
            }} // ปรับแต่งเพิ่มเติมได้
          />
        </Box>

        {/* กันรอยบาก/แถบล่างมือถือ */}
        <Box sx={{ height: "env(safe-area-inset-bottom)" }} />
      </Box>
    </Container>
  );
};

export default MessagePage;
