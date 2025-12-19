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
import { useTheme } from "next-themes";
import { GET_CHATGROUPS } from "@/graphql/chatgroup/queries";
import { GET_CHAT, GET_CHATS } from "@/graphql/chat/queries";
import PromptList from "@/app/components/chat/PromptList";
import { GET_PROMPTS } from "@/graphql/prompt/queries";
import { extractErrorMessage, showErrorAlert } from "@/util/errorAlert"; // ปรับ path ให้ตรงโปรเจกต์จริง

const MessagePage = () => {
  const client = useApolloClient();
  const { user } = useAuth();
  const { initText, setInitText, initAttachments, setInitAttachments } = useInitText();
  const router = useRouter();
  const { theme } = useTheme();
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
  const [sending, setSending] = useState(false);

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
    variables: { 
      chat_id: id,
      user_id: user?.id
    },
  });

  const {
    data: chatData,
    loading: chatLoading,
    error: chatError,
  } = useQuery(GET_CHAT, {
    variables: {
      id: id ?? "",
      user_id: user?.id
    },
    fetchPolicy: "network-only",
  });
  console.log("chatData", chatData);

  const {
    refetch: chatsRefresh,
  } = useQuery(GET_CHATS, {
    variables: {
      user_id: user?.id ?? "",
      chatgroupMode: "NULL",
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

  const [createMessage, { loading: createSending }] = useMutation(CREATE_MESSAGE);
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

  useEffect(() => {
    // รอให้โหลดเสร็จก่อน
    if (chatLoading) return;

    // ถ้า query ตอบกลับมาแล้วว่า chat เป็น null -> กลับหน้า list
    if (chatData && chatData.chat === null) {
      router.replace("/onesqa/chat");
    }
  }, [chatLoading, chatData, router]);

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
      chatsRefresh();
      refetch();
      chatgroupsRefresh();
    } catch (error) {
      showErrorAlert(error, theme, {
        title: "ส่งคำถามไปยัง Model ไม่สำเร็จ",
      });
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
    try {
      const { data } = await mutate({
        variables: {
          files: attachments,
          ai_id: chatData?.chat?.ai_id,
          user_id: user?.id,
        },
      });
      console.log(data?.multipleUpload);
      //onClear();
      handleMessageSubmitFile(data?.multipleUpload);
    } catch (error) {
      showErrorAlert(error, theme, {
        title: "ส่งคำถามไปยัง Model ไม่สำเร็จ",
      });
    }
  };
  const handleMessageSubmitFile = async (uploads) => {
    if (!text.trim() || createSending) return; // กันกดซ้ำ / กันข้อความว่าง

    // เตรียมข้อมูลไฟล์ส่งหลังบ้าน
    const fileMessageList = (uploads ?? [])
      .map((it) => ({
        id: it?.id ?? it?.attachment_id ?? it?.file_id ?? null,
        filename: it?.filename ?? it?.name ?? it?.file_name ?? "",
      }))
      .filter((x) => x.id != null && x.filename); // กันของที่ยังไม่มี id/ชื่อไฟล์

    console.log(fileMessageList);

    // เก็บค่าเดิมไว้เผื่อ restore ตอน error
    const sendText = text;
    const sendUploads = uploads;

    // เริ่มส่งแล้ว กันกดซ้ำ
    setSending(true);

    // โชว์ข้อความ user แบบ optimistic ก่อน
    setAnswer([
      {
        id: messages.length,
        role: "user",
        text: sendText,
        files: sendUploads,
        createdAt: null,
      },
    ]);

    // 🔹 เคลียร์ input ตอนเริ่มส่งไปหลังบ้านเลย
    setText("");
    setAttachments([]); // ถ้า state ชื่อไม่ตรงก็เปลี่ยนเป็นของโปรเจคจริง

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
      chatgroupsRefresh();
      chatsRefresh();
      refetch();
    } catch (error) {
      // 🔹 ถ้าหลังบ้าน error → เอาค่ากลับมา
      setText(sendText);
      setAttachments(sendUploads);

      showErrorAlert(error, theme, {
        title: "ส่งคำถามไปยัง Model ไม่สำเร็จ",
      });
    } finally {
      setSending(false);
    }
  };

  const handleMessageSubmit = async () => {
    if (!text.trim() || createSending) return; // กันกดซ้ำ / กันข้อความว่าง

    // เตรียมข้อมูลไฟล์ส่งหลังบ้าน
    const fileMessageList = (attachments ?? [])
      .map((it) => ({
        id: it?.id ?? it?.attachment_id ?? it?.file_id ?? null,
        filename: it?.filename ?? it?.name ?? it?.file_name ?? "",
      }))
      .filter((x) => x.id != null && x.filename);

    // เก็บค่าเดิมไว้เผื่อ restore ตอน error
    const sendAttachments = attachments;
    const sendText = text;

    // เริ่มส่งแล้ว กันกดซ้ำ
    setSending(true);

    // โชว์ message ฝั่ง user แบบ optimistic ก่อน
    setAnswer([
      {
        id: messages.length,
        role: "user",
        text: sendText,
        files: sendAttachments,
        createdAt: null,
      },
    ]);

    // 🔹 เคลียร์ช่องกรอก + ไฟล์ ตอน "เริ่มส่ง" เลย
    setText(""); // ล้างหลังส่ง
    setAttachments([]);

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
      chatgroupsRefresh();
      chatsRefresh();
      refetch();
    } catch (error) {
      // 🔹 ถ้ามี error จากหลังบ้าน: เอาข้อความ + ไฟล์กลับคืน
      setText(sendText);
      setAttachments(sendAttachments);

      showErrorAlert(error, theme, {
        title: "ส่งคำถามไปยัง Model ไม่สำเร็จ",
      });
    } finally {
      setSending(false);
    }
  };

  const handleMessageEdit = async (edit_id, edit_text) => {
    console.log(edit_id, edit_text);
    if (!edit_text.trim() || editSending) return; // กันกดซ้ำ / กันข้อความว่าง

    const edit_message = messages.filter(
      (m) => Number(m.id) === Number(edit_id)
    );
    console.log("edit_message", edit_message);

    // ถ้าไม่เจอข้อความที่จะ edit ก็ไม่ต้องทำต่อ
    if (!edit_message[0]) return;

    // เหลือแค่ id กับ filename
    const fileMessageList = (edit_message[0].files ?? [])
      .map((it) => ({
        id: it?.id ?? it?.attachment_id ?? it?.file_id ?? null,
        filename: it?.filename ?? it?.name ?? it?.file_name ?? "",
      }))
      .filter((x) => x.id != null && x.filename); // กันของที่ยังไม่มี id/ชื่อไฟล์

    // 🔹 backup ไว้เผื่อ rollback ตอน error
    const prevMessages = messages;

    console.log(messages);

    // เริ่มส่งแล้ว กันกดซ้ำ
    setSending(true);

    // 🔹 ตัด history message ตั้งแต่ edit_id ขึ้นไป (ทำตอนเริ่มส่งเลย)
    setMessages((prev) => prev.filter((m) => Number(m.id) < Number(edit_id)));

    // โชว์ข้อความใหม่ของ user แบบ optimistic
    setAnswer([
      {
        id: Number(edit_id) + 1,
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
            fileMessageList,
          },
        },
      });

      console.log("✅ Update success:", data.updateMessage);
      chatgroupsRefresh();
      chatsRefresh();
      refetch();
    } catch (error) {
      // 🔹 ถ้ามี error จากหลังบ้าน → rollback messages กลับของเดิม
      setMessages(prevMessages);

      showErrorAlert(error, theme, {
        title: "ส่งคำถามไปยัง Model ไม่สำเร็จ",
      });
    } finally {
      setSending(false);
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
        sending={Boolean(createSending || editSending)}
      />
      {(createSending || editSending) && (
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
            sending={createSending}
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
              // setText(""); // ล้างหลังส่ง
              // setAttachments([]);
            }}
            placeholder="ป้อนข้อความ.."
            actions={[
              {
                key: "deep",
                label: "Deep Research",
                onClick: () => console.log("deep"),
                icon: <ScienceOutlinedIcon />,
              },
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
            onTextChange={setText}
          />
        </Box>
    </Container>
  );
};

export default MessagePage;
