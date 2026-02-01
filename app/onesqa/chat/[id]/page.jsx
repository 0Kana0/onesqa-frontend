"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { NetworkStatus } from "@apollo/client";
import { useQuery, useMutation, useApolloClient } from "@apollo/client/react";
import {
  Box,
  Button,
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
import { CREATE_MESSAGE, CREATE_MESSAGE_DOC, CREATE_MESSAGE_IMAGE, CREATE_MESSAGE_VIDEO, UPDATE_MESSAGE } from "@/graphql/message/mutations";
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
import { useLanguage } from "@/app/context/LanguageContext";
import AcademySearchModal from "@/app/components/chat/AcademyButtonModal";

const MessagePage = () => {
  const client = useApolloClient();
  const { user } = useAuth();
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
  const { theme } = useTheme();
  const params = useParams();
  const searchParams = useSearchParams();
  const { id } = params;
  const [attachments, setAttachments] = useState([]); // File[]
  const isNew = searchParams.get("new") === "true";

  const tInit = useTranslations("Init");
  const tChatSidebar = useTranslations("ChatSidebar");
  const tchaterror = useTranslations('ChatError');

  const isMobile = useMediaQuery("(max-width:600px)");
  const isTablet = useMediaQuery("(max-width:1200px)");

  const [text, setText] = useState("");
  const [messages, setMessages] = useState([]);
  const [question, setQuestion] = useState([]);
  const [answer, setAnswer] = useState([]);

  const [active, setActive] = useState(null);
  const [sending, setSending] = useState(false);
  const [open, setOpen] = useState(false);

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
    variables: {
      locale: locale,
    },
    fetchPolicy: "network-only",
    notifyOnNetworkStatusChange: true, // ✅ ให้ re-render ตอนกำลัง refetch
  });

  const [createMessage, { loading: creatingText }] = useMutation(CREATE_MESSAGE);
  const [createMessageImage, { loading: creatingImage }] = useMutation(CREATE_MESSAGE_IMAGE);
  const [createMessageVideo, { loading: creatingVideo }] = useMutation(CREATE_MESSAGE_VIDEO);
  const [createMessageDoc, { loading: creatingDoc }] = useMutation(CREATE_MESSAGE_DOC);
  const [updateMessage, { loading: editSending }] = useMutation(UPDATE_MESSAGE);
  const [mutate, { loading, error }] = useMutation(MULTIPLE_UPLOAD, {
    client,
  });

  const isSending = Boolean(
    creatingText || creatingImage || creatingVideo || creatingDoc || editSending
  );

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
        message_type: initMessageType,
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

    if (initMessageType === "IMAGE") {
      try {
        const { data } = await createMessageImage({
          variables: {
            input: {
              message_type: initMessageType,
              chat_id: id,
              message: initText,
              locale: locale,
              fileMessageList,
            },
          },
        });

        console.log("✅ Create success:", data.createMessageImage);
        //chatsRefresh();
        await client.refetchQueries({
          include: [GET_CHATS],
        });
        refetch();
        chatgroupsRefresh();
      } catch (error) {
        showErrorAlert(error, theme, {
          title: tchaterror('error1'),
        });
      }
    } else if (initMessageType === "VIDEO") {
      try {
        const { data } = await createMessageVideo({
          variables: {
            input: {
              message_type: initMessageType,
              chat_id: id,
              message: initText,
              locale: locale,
              fileMessageList,
            },
          },
        });

        console.log("✅ Create success:", data.createMessageVideo);
        //chatsRefresh();
        await client.refetchQueries({
          include: [GET_CHATS],
        });
        refetch();
        chatgroupsRefresh();
      } catch (error) {
        showErrorAlert(error, theme, {
          title: tchaterror('error1'),
        });
      }
    } else if (initMessageType === "DOC") {
      try {
        const { data } = await createMessageDoc({
          variables: {
            input: {
              message_type: initMessageType,
              chat_id: id,
              message: initText,
              locale: locale,
              fileMessageList,
            },
          },
        });

        console.log("✅ Create success:", data.createMessageDoc);
        //chatsRefresh();
        await client.refetchQueries({
          include: [GET_CHATS],
        });
        refetch();
        chatgroupsRefresh();
      } catch (error) {
        showErrorAlert(error, theme, {
          title: tchaterror('error1'),
        });
      }
    } else {
      try {
        const { data } = await createMessage({
          variables: {
            input: {
              message_type: initMessageType,
              chat_id: id,
              message: initText,
              locale: locale,
              fileMessageList,
            },
          },
        });

        console.log("✅ Create success:", data.createMessage);
        //chatsRefresh();
        await client.refetchQueries({
          include: [GET_CHATS],
        });
        refetch();
        chatgroupsRefresh();
      } catch (error) {
        showErrorAlert(error, theme, {
          title: tchaterror('error1'),
        });
      }
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
    setInitMessageType('TEXT');
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
        title: tchaterror('error1'),
      });
    }
  };
  const handleMessageSubmitFile = async (uploads) => {
    if (!text.trim() || isSending) return; // กันกดซ้ำ / กันข้อความว่าง

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
        message_type: initMessageType,
        text: sendText,
        files: sendUploads,
        createdAt: null,
      },
    ]);

    // 🔹 เคลียร์ input ตอนเริ่มส่งไปหลังบ้านเลย
    setText("");
    setAttachments([]); // ถ้า state ชื่อไม่ตรงก็เปลี่ยนเป็นของโปรเจคจริง
    setInitMessageType('TEXT');

    if (initMessageType === "IMAGE") {
      try {
        const { data } = await createMessageImage({
          variables: {
            input: {
              message_type: initMessageType,
              chat_id: id,
              message: sendText,
              fileMessageList,
              locale: locale,
            },
          },
        });

        console.log("✅ Create success:", data.createMessageImage);
        await client.refetchQueries({
          include: [GET_CHATS],
        });
        chatgroupsRefresh();
        //chatsRefresh();
        refetch();
      } catch (error) {
        // 🔹 ถ้าหลังบ้าน error → เอาค่ากลับมา
        setText(sendText);
        setAttachments(sendUploads);
        setInitMessageType(initMessageType);

        showErrorAlert(error, theme, {
          title: tchaterror('error1'),
        });
      } finally {
        setSending(false);
      }
    } else if (initMessageType === "VIDEO") {
      try {
        const { data } = await createMessageVideo({
          variables: {
            input: {
              message_type: initMessageType,
              chat_id: id,
              message: sendText,
              fileMessageList,
              locale: locale,
            },
          },
        });

        console.log("✅ Create success:", data.createMessageVideo);
        await client.refetchQueries({
          include: [GET_CHATS],
        });
        chatgroupsRefresh();
        //chatsRefresh();
        refetch();
      } catch (error) {
        // 🔹 ถ้าหลังบ้าน error → เอาค่ากลับมา
        setText(sendText);
        setAttachments(sendUploads);
        setInitMessageType(initMessageType);

        showErrorAlert(error, theme, {
          title: tchaterror('error1'),
        });
      } finally {
        setSending(false);
      }
    } else if (initMessageType === "DOC") {
      try {
        const { data } = await createMessageDoc({
          variables: {
            input: {
              message_type: initMessageType,
              chat_id: id,
              message: sendText,
              fileMessageList,
              locale: locale,
            },
          },
        });

        console.log("✅ Create success:", data.createMessageDoc);
        await client.refetchQueries({
          include: [GET_CHATS],
        });
        chatgroupsRefresh();
        //chatsRefresh();
        refetch();
      } catch (error) {
        // 🔹 ถ้าหลังบ้าน error → เอาค่ากลับมา
        setText(sendText);
        setAttachments(sendUploads);
        setInitMessageType(initMessageType);

        showErrorAlert(error, theme, {
          title: tchaterror('error1'),
        });
      } finally {
        setSending(false);
      }
    } else {
      try {
        const { data } = await createMessage({
          variables: {
            input: {
              message_type: initMessageType,
              chat_id: id,
              message: sendText,
              fileMessageList,
              locale: locale,
            },
          },
        });

        console.log("✅ Create success:", data.createMessage);
        await client.refetchQueries({
          include: [GET_CHATS],
        });
        chatgroupsRefresh();
        //chatsRefresh();
        refetch();
      } catch (error) {
        // 🔹 ถ้าหลังบ้าน error → เอาค่ากลับมา
        setText(sendText);
        setAttachments(sendUploads);
        setInitMessageType(initMessageType);

        showErrorAlert(error, theme, {
          title: tchaterror('error1'),
        });
      } finally {
        setSending(false);
      }
    }
  };

  const handleMessageSubmit = async () => {
    if (!text.trim() || isSending) return; // กันกดซ้ำ / กันข้อความว่าง

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
        message_type: initMessageType,
        text: sendText,
        files: sendAttachments,
        createdAt: null,
      },
    ]);

    // 🔹 เคลียร์ช่องกรอก + ไฟล์ ตอน "เริ่มส่ง" เลย
    setText(""); // ล้างหลังส่ง
    setAttachments([]);
    setActive(null);
    setInitMessageType('TEXT');

    if (initMessageType === "IMAGE") {
      try {
        const { data } = await createMessageImage({
          variables: {
            input: {
              message_type: initMessageType,
              chat_id: id,
              message: sendText,
              fileMessageList,
              locale: locale,
            },
          },
        });

        console.log("✅ Create success:", data.createMessageImage);
        await client.refetchQueries({
          include: [GET_CHATS],
        });
        chatgroupsRefresh();
        //chatsRefresh();
        refetch();
      } catch (error) {
        // 🔹 ถ้ามี error จากหลังบ้าน: เอาข้อความ + ไฟล์กลับคืน
        setText(sendText);
        setAttachments(sendAttachments);
        setInitMessageType(initMessageType);

        showErrorAlert(error, theme, {
          title: tchaterror('error1'),
        });
      } finally {
        setSending(false);
      }
    } else if (initMessageType === "VIDEO") {
      try {
        const { data } = await createMessageVideo({
          variables: {
            input: {
              message_type: initMessageType,
              chat_id: id,
              message: sendText,
              fileMessageList,
              locale: locale,
            },
          },
        });

        console.log("✅ Create success:", data.createMessageVideo);
        await client.refetchQueries({
          include: [GET_CHATS],
        });
        chatgroupsRefresh();
        //chatsRefresh();
        refetch();
      } catch (error) {
        // 🔹 ถ้ามี error จากหลังบ้าน: เอาข้อความ + ไฟล์กลับคืน
        setText(sendText);
        setAttachments(sendAttachments);
        setInitMessageType(initMessageType);

        showErrorAlert(error, theme, {
          title: tchaterror('error1'),
        });
      } finally {
        setSending(false);
      }
    } else if (initMessageType === "DOC") {
      try {
        const { data } = await createMessageDoc({
          variables: {
            input: {
              message_type: initMessageType,
              chat_id: id,
              message: sendText,
              fileMessageList,
              locale: locale,
            },
          },
        });

        console.log("✅ Create success:", data.createMessageDoc);
        await client.refetchQueries({
          include: [GET_CHATS],
        });
        chatgroupsRefresh();
        //chatsRefresh();
        refetch();
      } catch (error) {
        // 🔹 ถ้ามี error จากหลังบ้าน: เอาข้อความ + ไฟล์กลับคืน
        setText(sendText);
        setAttachments(sendAttachments);
        setInitMessageType(initMessageType);

        showErrorAlert(error, theme, {
          title: tchaterror('error1'),
        });
      } finally {
        setSending(false);
      }
    } else {
      try {
        const { data } = await createMessage({
          variables: {
            input: {
              message_type: initMessageType,
              chat_id: id,
              message: sendText,
              fileMessageList,
              locale: locale,
            },
          },
        });

        console.log("✅ Create success:", data.createMessage);
        await client.refetchQueries({
          include: [GET_CHATS],
        });
        chatgroupsRefresh();
        //chatsRefresh();
        refetch();
      } catch (error) {
        // 🔹 ถ้ามี error จากหลังบ้าน: เอาข้อความ + ไฟล์กลับคืน
        setText(sendText);
        setAttachments(sendAttachments);
        setInitMessageType(initMessageType);

        showErrorAlert(error, theme, {
          title: tchaterror('error1'),
        });
      } finally {
        setSending(false);
      }
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
        message_type: initMessageType,
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
            message_type: initMessageType,
            chat_id: id,
            message: edit_text,
            fileMessageList,
            locale: locale,
          },
        },
      });

      console.log("✅ Update success:", data.updateMessage);
      await client.refetchQueries({
        include: [GET_CHATS],
      });
      chatgroupsRefresh();
      //chatsRefresh();
      refetch();
    } catch (error) {
      // 🔹 ถ้ามี error จากหลังบ้าน → rollback messages กลับของเดิม
      setMessages(prevMessages);

      showErrorAlert(error, theme, {
        title: tchaterror('error1'),
      });
    } finally {
      setSending(false);
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
    <Container
      maxWidth="md"
      sx={{
        minHeight: { xs: "100svh", md: "100dvh" }, // สูงเต็ม viewport
        display: "flex",
        flexDirection: "column",
        p: 0,
      }}
    >
      {user?.role_name_th === "ผู้ประเมินภายนอก" && (
        <>
          <Box sx={{ width: "100%", display: "flex", justifyContent: "flex-end" }}>
            <Button
              variant="contained"
              onClick={handleOpen}
              sx={{
                display: "flex",
                flexDirection: "column-reverse",
                width: isMobile ? "100%" : "105px",
                bgcolor: "#1976D2",
                color: "white",
                "&:hover": { bgcolor: "#1565C0" },
                mb: 1,
              }}
            >
              {tChatSidebar("academy")}
            </Button>
          </Box>

          <AcademySearchModal
            open={open}
            onClose={() => setOpen(false)}
            onUpload={async ({ selectedUrls }) => {
              try {
                const remain = MAX_FILES - (initAttachments?.length ?? 0);
                if (remain <= 0) return;

                const urls = selectedUrls.slice(0, remain);
                const files = await Promise.all(urls.map(urlToFile));
                setAttachments((prev = []) => mergeDedup(prev, files));
                setOpen(false);
              } catch (err) {
                showErrorAlert(err, theme, { title: "ไม่สามารถนำเข้าไฟล์ได้" });
              }
            }}
          />

          <Divider sx={{ mb: 1 }} />
        </>
      )}

      {/* โซนข้อความ: เลื่อนเฉพาะส่วนนี้ */}
      <ChatThread
        messages={messages}
        onChangeEdit={handleMessageEdit}
        chat={chatData?.chat?.ai}
        sending={isSending}
      />
      {isSending && (
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
            theme = {theme}
            messageType = {initMessageType}
            setMessageType = {setInitMessageType}
            value={text}
            sending={isSending}
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
                console.log(err);
              }
              // setText(""); // ล้างหลังส่ง
              // setAttachments([]);
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
