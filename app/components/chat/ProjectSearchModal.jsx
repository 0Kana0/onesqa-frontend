// app/components/ProjectSearchModal.jsx
"use client";

import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { NetworkStatus } from "@apollo/client";
import { useMutation, useQuery, useApolloClient } from "@apollo/client/react";
import { GET_CHATGROUPS } from "@/graphql/chatgroup/queries";
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
  useMediaQuery
} from "@mui/material";
import CloseRounded from "@mui/icons-material/CloseRounded";
import SearchRounded from "@mui/icons-material/SearchRounded";
import FolderOutlined from "@mui/icons-material/FolderOutlined";
import { useSidebar } from "@/app/context/SidebarContext";
import { useTranslations } from "next-intl";

const normalizeText = (v) => {
  const s = (v ?? "").trim();
  return s === "" ? null : s;
};

export default function ProjectSearchModal({
  open,
  onClose,
  onSelect, // (item) => void
  placeholder,
  group_id
}) {
  const { user } = useAuth();
  const { toggle } = useSidebar(); // ✅ ดึงจาก Context
  
  const tChatSidebar = useTranslations("ChatSidebar");

  const isMobile = useMediaQuery("(max-width:600px)");
  const isTablet = useMediaQuery("(max-width:1200px)"); // < md คือจอเล็ก

  const [q, setQ] = useState("");
  const [first, setFirst] = useState(5);

  const vars = {
    user_id: user?.id ?? "",
    id: group_id ?? null,
    search: normalizeText(q),
    ...(q?.trim() ? {} : { first }), // ถ้า q มีค่า → ไม่ใส่ first
  };

  const {
    data: chatgroupsData,
    loading: chatgroupsLoading,
    error: chatgroupsError,
    refetch,
    networkStatus,
  } = useQuery(GET_CHATGROUPS, {
    variables: vars,
    fetchPolicy: "network-only",
    notifyOnNetworkStatusChange: true,
    skip: !open || !user?.id, // ❗ รอให้ modal เปิดและมี user.id ก่อนค่อยยิง
  });

  console.log("data modal", chatgroupsData?.chatgroups?.edges);
  console.log(q, first);

  useEffect(() => {
    if (!open) setQ("");
  }, [open]);

  if (chatgroupsLoading && !open)
    return (
      <Box sx={{ textAlign: "center", mt: 5 }}>
        <Typography>
          <CircularProgress />
        </Typography>
      </Box>
    );

  // ----- สถานะโหลด/ผิดพลาดรวมสองฝั่ง -----
  if (chatgroupsError)
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">❌</Alert>
      </Box>
    );

  const sections = chatgroupsData?.chatgroups?.edges.map((edge) => ({
    id: edge.node.id,
    chatgroup_name: edge.node.chatgroup_name,
  }));

  console.log(sections);

  // // filter แบบง่าย
  // const filter = (text) => text.toLowerCase().includes(q.toLowerCase());

  // // เตรียมข้อมูลสำหรับโหมด flat
  // const flat = Array.isArray(sections)
  //   ? sections.filter((it) => filter(it.chatgroup_name))
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
            placeholder={tChatSidebar("groupsearch")}
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
              href={`/onesqa/chat/group/${it.id}`}
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
                <FolderOutlined fontSize="small" />
              </ListItemIcon>
              <ListItemText
                primary={it.chatgroup_name}
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
              {tChatSidebar("groupnotfound")}
            </Box>
          )}
        </List>
      </DialogContent>
    </Dialog>
  );
}
