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
import { CREATE_MESSAGE, UPDATE_MESSAGE } from "@/graphql/message/mutations";
import { MULTIPLE_UPLOAD } from "@/graphql/file/mutations";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import SendIcon from "@mui/icons-material/Send";
import ScienceOutlinedIcon from "@mui/icons-material/ScienceOutlined";
import BrushOutlinedIcon from "@mui/icons-material/BrushOutlined";
import ChatThread from "@/app/components/chat/ChatThread";
import ChatInputBar from "@/app/components/chat/ChatInputBar";
import TypingDots from "@/app/components/chat/TypingDots";
import { useInitText } from "@/app/context/InitTextContext";
import { useAuth } from "@/app/context/AuthContext";
import { GET_CHATGROUPS } from "@/graphql/chatgroup/queries";
import { GET_CHAT } from "@/graphql/chat/queries";
import PromptList from "@/app/components/chat/PromptList";
import { GET_PROMPTS } from "@/graphql/prompt/queries";

const MessagePage = () => {
  const client = useApolloClient();
  const { user } = useAuth();
  const { initText, setInitText, initAttachments, setInitAttachments } =
    useInitText();
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const { id } = params;
  const [attachments, setAttachments] = useState([]); // File[]
  const isNew = searchParams.get("new") === "true";

  const tInit = useTranslations("Init");

  const isMobile = useMediaQuery("(max-width:600px)");
  const isTablet = useMediaQuery("(max-width:1200px)");

  const [text, setText] = useState("");
  const [messages, setMessages] = useState([]);
  const [question, setQuestion] = useState([]);
  const [answer, setAnswer] = useState([]);

  const [active, setActive] = useState(null);

  const ranOnceRef = useRef(false);

  const { refetch: chatgroupsRefresh } = useQuery(GET_CHATGROUPS, {
    variables: { user_id: user?.id ?? "" },
    fetchPolicy: "network-only",
  });

  const {
    data: messagesData,
    loading: messagesLoading,
    error: messagesError,
    networkStatus,
    refetch,
  } = useQuery(GET_MESSAGES, {
    fetchPolicy: "network-only",
    variables: { chat_id: id },
  });

  const {
    data: chatData,
    loading: chatLoading,
    error: chatError,
  } = useQuery(GET_CHAT, {
    variables: {
      id: id ?? "",
    },
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

  const [createMessage, { loading: sending }] = useMutation(CREATE_MESSAGE);
  const [updateMessage, { loading: editSending }] = useMutation(UPDATE_MESSAGE);
  const [mutate, { loading, error }] = useMutation(MULTIPLE_UPLOAD, {
    client,
  });

  // ---------- เพิ่มส่วน autoscroll ----------
  const listRef = useRef(null); // กล่องที่เลื่อน
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

  // useEffect(() => {
  //   if (isNew) return;            // ต้องเป็นเคสที่ new เท่านั้น
  //   if (messagesData?.messages?.length === 0) router.push("/onesqa/chat");
  // }, [messagesData?.messages]);

  // โหลดเสร็จครั้งแรก → เลื่อนไปล่างสุดทันที
  useEffect(() => {
    if (!messagesLoading) scrollToBottom(false);
  }, [messagesLoading, scrollToBottom]);

  // มีข้อความใหม่ใน state → เลื่อนแบบ smooth
  useEffect(() => {
    scrollToBottom(true);
  }, [messagesData?.messages.length, scrollToBottom, answer, messages]);

  const handleMessageInitSubmit = async () => {
    console.log("initAttachments", initAttachments);

    setAnswer([
      {
        id: 0,
        role: "user",
        text: initText,
        files: initAttachments,
        createdAt: null,
      },
    ]);

    // เหลือแค่ id กับ filename
    const fileMessageList = (initAttachments ?? [])
      .map((it) => ({
        id: it?.id ?? it?.attachment_id ?? it?.file_id ?? null,
        filename: it?.filename ?? it?.name ?? it?.file_name ?? "",
      }))
      .filter((x) => x.id != null && x.filename); // กันของที่ยังไม่มี id/ชื่อไฟล์

    try {
      const { data } = await createMessage({
        variables: {
          input: {
            chat_id: id,
            message: initText,
            fileMessageList,
          },
        },
      });

      console.log("✅ Create success:", data.createMessage);

      refetch();
      chatgroupsRefresh();
    } catch (error) {
      console.log(error);
    }
  };

  // ✅ trigger เมื่อเพิ่งสร้างแชตใหม่
  useEffect(() => {
    if (!isNew) return; // ต้องเป็นเคสที่ new เท่านั้น
    if (ranOnceRef.current) return; // กันซ้ำ (รวมเคส Strict Mode)

    ranOnceRef.current = true;

    console.log("isNew", isNew);
    handleMessageInitSubmit();
    setInitText("");
    setInitAttachments([]);
    router.replace(`/onesqa/chat/${id}`); // ล้าง query ออก
  }, [isNew, router, id]);

  useEffect(() => {
    if (!messagesData?.messages.length) {
      return;
    }

    setMessages(messagesData?.messages)
  }, [messagesData]);
  // -----------------------------------------

  // โชว์โหลดเฉพาะ "ครั้งแรกจริง ๆ" (ยังไม่มี data)
  const isInitialLoading =
    networkStatus === NetworkStatus.loading && !messagesData;

  // ก่อนหน้าเคยเขียน if (logsLoading) return ... → เปลี่ยนเป็นเช็ค isInitialLoading
  if (isInitialLoading || promptsLoading)
    return (
      <Box sx={{ textAlign: "center", mt: 5 }}>
        <CircularProgress />
        <Typography>{tInit("loading")}...</Typography>
      </Box>
    );

  if (messagesError || chatError || promptsError)
    return (
      <Typography color="error" sx={{ mt: 5 }}>
        ❌ {tInit("error")}
      </Typography>
    );

  // if (messagesData?.messages?.length === 0)
  //   return (
  //     <Typography>
  //     </Typography>
  //   );

  console.log(messages);
  console.log("attachments", attachments);

  const onClear = () => setAttachments([]);
  const handleSubmitFile = async () => {
    if (!attachments.length) return;
    const { data } = await mutate({
      variables: {
        files: attachments,
      },
    });
    console.log(data?.multipleUpload);
    //onClear();
    handleMessageSubmitFile(data?.multipleUpload);
  };
  const handleMessageSubmitFile = async (uploads) => {
    if (!text.trim() || sending) return; // กันกดซ้ำ

    // เหลือแค่ id กับ filename
    const fileMessageList = (uploads ?? [])
      .map((it) => ({
        id: it?.id ?? it?.attachment_id ?? it?.file_id ?? null,
        filename: it?.filename ?? it?.name ?? it?.file_name ?? "",
      }))
      .filter((x) => x.id != null && x.filename); // กันของที่ยังไม่มี id/ชื่อไฟล์

    console.log(fileMessageList);

    setAnswer([
      {
        id: messages.length,
        role: "user",
        text: text,
        files: uploads,
        createdAt: null,
      },
    ]);

    try {
      const { data } = await createMessage({
        variables: {
          input: {
            chat_id: id,
            message: text,
            fileMessageList,
          },
        },
      });

      console.log("✅ Create success:", data.createMessage);
      refetch();
    } catch (error) {
      console.log(error);
    }
  };

  const handleMessageSubmit = async () => {
    if (!text.trim() || sending) return; // กันกดซ้ำ

    // เหลือแค่ id กับ filename
    const fileMessageList = (attachments ?? [])
      .map((it) => ({
        id: it?.id ?? it?.attachment_id ?? it?.file_id ?? null,
        filename: it?.filename ?? it?.name ?? it?.file_name ?? "",
      }))
      .filter((x) => x.id != null && x.filename); // กันของที่ยังไม่มี id/ชื่อไฟล์

    const sendAttachments = attachments;
    const sendText = text;

    setText(""); // ล้างหลังส่ง
    setAttachments([]);

    setAnswer([
      {
        id: messages.length,
        role: "user",
        text: sendText,
        files: sendAttachments,
        createdAt: null,
      },
    ]);

    try {
      const { data } = await createMessage({
        variables: {
          input: {
            chat_id: id,
            message: sendText,
            fileMessageList,
          },
        },
      });

      console.log("✅ Create success:", data.createMessage);
      refetch();
    } catch (error) {
      console.log(error);
    }
  };

  const handleMessageEdit = async (edit_id, edit_text) => {
    console.log(edit_id, edit_text);
    if (!edit_text.trim() || editSending) return; // กันกดซ้ำ

    const edit_message = messages.filter(m => Number(m.id) === Number(edit_id))
    console.log("edit_message", edit_message);

    // เหลือแค่ id กับ filename
    const fileMessageList = (edit_message[0].files ?? [])
      .map((it) => ({
        id: it?.id ?? it?.attachment_id ?? it?.file_id ?? null,
        filename: it?.filename ?? it?.name ?? it?.file_name ?? "",
      }))
      .filter((x) => x.id != null && x.filename); // กันของที่ยังไม่มี id/ชื่อไฟล์
    
    console.log(messages);
    setMessages(prev => prev.filter(m => Number(m.id) < Number(edit_id)));

    setAnswer([
      {
        id: edit_id + 1,
        role: "user",
        text: edit_text,
        files: edit_message[0].files,
        createdAt: null,
      },
    ]);

    try {
      const { data } = await updateMessage({
        variables: {
          id: edit_id,
          input: {
            chat_id: id,
            message: edit_text,
            fileMessageList
          },
        },
      });

      console.log("✅ Update success:", data.updateMessage);
      refetch();
    } catch (error) {
      console.log(error);
    }
  };

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
      <ChatThread
        messages={messages}
        onChangeEdit={handleMessageEdit}
        chat={chatData?.chat?.ai}
        sending={Boolean(sending || editSending)}
      />
      {(sending || editSending) && (
        <>
          <ChatThread messages={answer} edit_status={false} />
          <TypingDots size={12} color="primary.main" />
        </>
      )}
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
            attachments={attachments}
            setAttachments={setAttachments}
            onSend={async (msg) => {
              // เรียก mutation/ฟังก์ชันส่งข้อความที่คุณมี
              try {
                const hasFiles = (attachments?.length ?? 0) > 0;
                if (hasFiles) {
                  await handleSubmitFile(); // มีไฟล์ -> ใช้อันบน
                } else {
                  await handleMessageSubmit(); // ไม่มีไฟล์ -> ใช้อันล่าง
                  // หรือถ้าฟังก์ชันของคุณต้องการข้อความ: await handleCreateChat(msg);
                }
                // setInitText(""); // ล้างอินพุตหลังส่ง (ถ้าต้องการ)
              } catch (err) {
                console.error(err);
              }
              setText(""); // ล้างหลังส่ง
              setAttachments([]);
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
              mb: 3,
              height: "100%",
              width: "100%",
            }} // ปรับแต่งเพิ่มเติมได้
          />
        </Box>

        {/* กันรอยบาก/แถบล่างมือถือ */}
        <Box sx={{ height: "env(safe-area-inset-bottom)" }} />
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
  );
};

export default MessagePage;
