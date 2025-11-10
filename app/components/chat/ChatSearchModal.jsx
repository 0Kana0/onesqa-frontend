// app/components/ChatSearchDialog.jsx
"use client";

import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { NetworkStatus } from "@apollo/client";
import { useMutation, useQuery, useApolloClient } from "@apollo/client/react";
import { GET_CHATS } from "@/graphql/chat/queries";
import Link from "next/link";
import {
  Box,
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  Paper,
  InputBase,
  List,
  ListSubheader,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider,
  Typography,
  Alert,
  CircularProgress,
  Avatar,
  useMediaQuery
} from "@mui/material";
import CloseRounded from "@mui/icons-material/CloseRounded";
import SearchRounded from "@mui/icons-material/SearchRounded";
import ChatBubbleOutlineRounded from "@mui/icons-material/ChatBubbleOutlineRounded";
import { AI_LOGOS, getAiLogo } from "@/util/aiLogo";
import { useSidebar } from "@/app/context/SidebarContext";

const normalizeText = (v) => {
  const s = (v ?? "").trim();
  return s === "" ? null : s;
};

export default function ChatSearchModal({
  open,
  onClose,
  onSelect, // (item) => void
  placeholder = "ค้นหาแชต...",
}) {
  const { user } = useAuth();
  const { toggle } = useSidebar(); // ✅ ดึงจาก Context

  const isMobile = useMediaQuery("(max-width:600px)");
  const isTablet = useMediaQuery("(max-width:1200px)"); // < md คือจอเล็ก

  const [q, setQ] = useState("");
  const [first, setFirst] = useState(5);

  // ตัวอย่างข้อมูลให้เหมือนภาพตัวอย่าง
  // const sections = [
  //   { id: "t1", chat_name: "การแก้ไขข้อผิดพลาด slui" },
  //   { id: "t2", chat_name: "Next.js MUI UI toggle" },
  //   { id: "t3", chat_name: "คำว่า saber คืออะไร" },
  //   { id: "t4", chat_name: "การแก้ไขข้อผิดพลาด slui" },
  //   { id: "t5", chat_name: "Next.js MUI UI toggle" },
  //   { id: "t6", chat_name: "คำว่า saber คืออะไร" },
  //   { id: "t7", chat_name: "การแก้ไขข้อผิดพลาด slui" },
  //   { id: "t8", chat_name: "Next.js MUI UI toggle" },
  //   { id: "t9", chat_name: "คำว่า saber คืออะไร" },
  //   { id: "t10", chat_name: "การแก้ไขข้อผิดพลาด slui" },
  //   { id: "t11", chat_name: "Next.js MUI UI toggle" },
  //   { id: "t12", chat_name: "คำว่า saber คืออะไร" },
  //   { id: "t13", chat_name: "การแก้ไขข้อผิดพลาด slui" },
  //   { id: "t14", chat_name: "Next.js MUI UI toggle" },
  //   { id: "t15", chat_name: "คำว่า saber คืออะไร" },
  //   { id: "t16", chat_name: "การแก้ไขข้อผิดพลาด slui" },
  //   { id: "t17", chat_name: "Next.js MUI UI toggle" },
  //   { id: "t18", chat_name: "คำว่า saber คืออะไร" },
  // ];

  const vars = {
    user_id: user?.id ?? "",
    search: normalizeText(q),
    ...(q?.trim() ? {} : { first }), // ถ้า q มีค่า → ไม่ใส่ first
  };

  const {
    data: chatsData,
    loading: chatsLoading,
    error: chatsError,
    refetch,
    networkStatus,
  } = useQuery(GET_CHATS, {
    variables: vars,
    fetchPolicy: "network-only",
    notifyOnNetworkStatusChange: true,
    skip: !open || !user?.id, // ❗ รอให้ modal เปิดและมี user.id ก่อนค่อยยิง
  });

  console.log("data modal", chatsData?.chats?.edges);
  console.log(q, first);

  useEffect(() => {
    if (!open) setQ("");
  }, [open]);

  if (chatsLoading && !open)
    return (
      <Box sx={{ textAlign: "center", mt: 5 }}>
        <Typography>
          <CircularProgress />
        </Typography>
      </Box>
    );

  // ----- สถานะโหลด/ผิดพลาดรวมสองฝั่ง -----
  if (chatsError)
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">❌</Alert>
      </Box>
    );

  const sections = chatsData?.chats?.edges.map((edge) => ({
    id: edge.node.id,
    chat_name: edge.node.chat_name,
    model_type: edge.node.ai.model_type,
  }));

  console.log(sections);

  // // filter แบบง่าย
  // const filter = (text) => text.toLowerCase().includes(q.toLowerCase());

  // // เตรียมข้อมูลสำหรับโหมด flat
  // const flat = Array.isArray(sections)
  //   ? sections.filter((it) => filter(it.chat_name))
  //   : [];

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="sm"
      PaperProps={{
        sx: {
          borderRadius: 4, // โค้งมนเหมือนภาพ
          overflow: "hidden",
          boxShadow: "0 16px 50px rgba(0,0,0,.12), 0 3px 10px rgba(0,0,0,.06)",
        },
      }}
    >
      {/* แถบบน: ช่องค้นหา + ปุ่มกากบาทขวาบน */}
      <DialogTitle
        sx={{
          px: 3,
          py: 1,
          position: "relative",
        }}
      >
        <Box
          sx={{
            pl: 1.5,
            pr: 5,
            py: 0.5,
            borderRadius: 5,
            display: "flex",
            alignItems: "center",
            gap: 1,
          }}
        >
          <SearchRounded fontSize="small" />
          <InputBase
            autoFocus
            placeholder={placeholder}
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
            }}
            sx={{ flex: 1, fontSize: 14.5, py: 0.5 }}
          />
        </Box>

        <IconButton
          aria-label="close"
          onClick={onClose}
          sx={{ position: "absolute", right: 8, top: 8 }}
        >
          <CloseRounded />
        </IconButton>
      </DialogTitle>

      <Divider />

      {/* เนื้อหา: รายการผลลัพธ์แบบกลุ่ม วันนี้/เมื่อวาน ฯลฯ */}
      <DialogContent
        dividers={false}
        sx={{ p: 0, maxHeight: "68vh", overflow: "auto" }}
      >
        <List
          disablePadding
          onClick={isTablet ? toggle : undefined} // ✅ toggle เฉพาะใน mobile
          sx={{
            px: 2.5,
            py: 1,
            "& .MuiListItemButton-root": {
              borderRadius: 3,
              px: 1.25,
              py: 0.9,
              mb: 0.5,
            },
            "& .MuiListItemIcon-root": { minWidth: 32 },
          }}
        >
          {sections?.map((it, idx) => (
            <Link
              key={idx}
              href={`/onesqa/chat/${it.id}`}
              style={{ textDecoration: "none", color: "inherit" }}
            >
              <ListItemButton
                key={it.id}
                onClick={() => {
                  onSelect?.(it);
                  onClose?.();
                }}
              >
                <ListItemIcon>
                  <Avatar
                    src={getAiLogo(it)}
                    alt={it.model_type ?? "AI"}
                    sx={{ width: 20, height: 20, mr: 0.5 }}
                    imgProps={{
                      onError: (e) => (e.currentTarget.src = AI_LOGOS.default),
                    }}
                  />
                </ListItemIcon>
                <ListItemText
                  primary={it.chat_name}
                  primaryTypographyProps={{ fontSize: 14.5 }}
                />
              </ListItemButton>
            </Link>
          ))}

          {/* ถ้าไม่มีข้อมูล */}
          {sections?.length === 0 && (
            <Box
              sx={{
                p: 3,
                textAlign: "center",
              }}
            >
              ไม่พบข้อมูล
            </Box>
          )}
        </List>
      </DialogContent>
    </Dialog>
  );
}
