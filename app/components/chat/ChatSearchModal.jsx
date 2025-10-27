// app/components/ChatSearchDialog.jsx
"use client";

import { useEffect, useState } from "react";
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
} from "@mui/material";
import CloseRounded from "@mui/icons-material/CloseRounded";
import SearchRounded from "@mui/icons-material/SearchRounded";
import ChatBubbleOutlineRounded from "@mui/icons-material/ChatBubbleOutlineRounded";

export default function ChatSearchModal({
  open,
  onClose,
  onSelect, // (item) => void
  sections = [], // [{ label: "วันนี้", items: [{ id, title }] }, ...]
  placeholder = "ค้นหาแชต...",
}) {
  const [q, setQ] = useState("");

  useEffect(() => {
    if (!open) setQ("");
  }, [open]);

  // filter แบบง่าย
  const filter = (text) => text.toLowerCase().includes(q.toLowerCase());

  // เตรียมข้อมูลสำหรับโหมด flat
  const flat = Array.isArray(sections)
    ? sections.filter((it) => filter(it.title))
    : [];

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
            onChange={(e) => setQ(e.target.value)}
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
          {flat.map((it, idx) => (
            <ListItemButton
              key={it.id}
              onClick={() => {
                onSelect?.(it);
                onClose?.();
              }}
            >
              <ListItemIcon>
                <ChatBubbleOutlineRounded fontSize="small" />
              </ListItemIcon>
              <ListItemText
                primary={it.title}
                primaryTypographyProps={{ fontSize: 14.5 }}
              />
            </ListItemButton>
          ))}
        </List>
      </DialogContent>
    </Dialog>
  );
}
