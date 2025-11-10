"use client";

import React, { useRef, useState, useEffect } from "react";
import {
  Box,
  Stack,
  Paper,
  Typography,
  Avatar,
  IconButton,
  Tooltip,
  InputBase,
} from "@mui/material";
import SmartToyOutlinedIcon from "@mui/icons-material/SmartToyOutlined";
import PersonOutlineOutlinedIcon from "@mui/icons-material/PersonOutlineOutlined";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import EditRoundedIcon from "@mui/icons-material/EditRounded";
import CheckRoundedIcon from "@mui/icons-material/CheckRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import FileCard from "./FileCard";
import { getAiLogo, AI_LOGOS } from "@/util/aiLogo";

function formatTime(dt) {
  try {
    const d = dt ? new Date(dt) : null;
    return d.toLocaleString("th-TH", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "";
  }
}

function toPlainString(val) {
  if (typeof val === "string") return val;
  if (React.isValidElement(val)) {
    const ch = val.props?.children;
    if (Array.isArray(ch))
      return ch.map((c) => (typeof c === "string" ? c : "")).join("");
    return typeof ch === "string" ? ch : "";
  }
  return val == null ? "" : String(val);
}

/**
 * ChatBubble
 * @param {'user'|'assistant'} role
 * @param {string|React.ReactNode} text
 * @param {string|number|Date} time
 * @param {Array} files
 * @param {boolean} showAvatar
 * @param {boolean} enableCopy
 * @param {(newText: string) => void} onEdit   // callback เมื่อกดบันทึกข้อความที่แก้
 * @param {boolean} editable                   // เปิด/ปิดปุ่มแก้ไข (default true เฉพาะ user)
 */
export default function ChatBubble({
  id,
  role = "assistant",
  text = "",
  time,
  files = [],
  showAvatar = true,
  enableCopy = true,
  onEdit,
  editable = true,
  onChangeEdit = () => {},
  chat = [],
  edit_status = true,
  sending = false
}) {
  const isUser = role === "user";
  //console.log(chat);

  // ====== Edit state ======
  const initialPlain = toPlainString(text);
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState(initialPlain);

  // sync draft ถ้า text จาก parent เปลี่ยน และตอนนี้ไม่ได้แก้ไขอยู่
  useEffect(() => {
    if (!isEditing) setDraft(toPlainString(text));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text]);
  useEffect(() => {
    if (sending) setIsEditing(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sending]);

  const startEdit = () => {
    console.log(id);

    setDraft(toPlainString(text));
    setIsEditing(true);
  };
  const cancelEdit = () => {
    setDraft(toPlainString(text));
    setIsEditing(false);
  };
  const saveEdit = () => {
    console.log(draft);
    onChangeEdit(id, draft);
    setIsEditing(false);
  };

  const bubbleSx = {
    px: 2,
    py: 1.5,
    // ขยายเต็มเมื่อแก้ไข
    maxWidth: isEditing && !sending ? "100%" : { xs: "85%", sm: "70%" },
    width: isEditing && !sending ? "100%" : "auto",
    bgcolor: isUser ? "primary.main" : "background.paper",
    color: isUser ? "primary.contrastText" : "text.primary",
    boxShadow: 0,
    borderRadius: 2,
    // มุมให้ความรู้สึกเป็น bubble
    borderTopLeftRadius: isUser ? 2 : 0,
    borderTopRightRadius: isUser ? 0 : 2,
    mt: 1,
  };

  const avatar = isUser ? (
    <Avatar sx={{ bgcolor: "primary.main", color: "white" }}>
      <PersonOutlineOutlinedIcon />
    </Avatar>
  ) : (
    <Avatar
      src={getAiLogo(chat)}
      alt={chat.model_type ?? "AI"}
      sx={{ bgcolor: "grey.200", color: "text.secondary" }}
      imgProps={{
        onError: (e) => (e.currentTarget.src = AI_LOGOS.default),
      }}
    />
  );

  const handleCopy = async () => {
    try {
      const plain = toPlainString(text);
      await navigator.clipboard.writeText(plain);
    } catch {}
  };

  return (
    <Stack
      direction={isUser ? "row-reverse" : "row"}
      spacing={1.5}
      alignItems="flex-start"
      sx={{ width: "100%" }}
    >
      {showAvatar ? avatar : <Box width={40} />}
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: isUser ? "flex-end" : "flex-start",
          width: "100%",
        }}
      >
        {files?.length > 0 && (
          <Stack spacing={1}>
            {files.map((f, i) => (
              <FileCard
                key={`${f?.original_name ?? "file"}-${i}`}
                title={f?.original_name ?? "ไฟล์แนบ"}
                href={
                  (process.env.NEXT_PUBLIC_FILE_URL || "") +
                  (f?.stored_path ?? "")
                }
              />
            ))}
          </Stack>
        )}

        {/* ====== Bubble area: switch between view / edit ====== */}
        <Paper sx={bubbleSx}>
          {isEditing && !sending ? (
            <InputBase
              autoFocus
              multiline
              fullWidth
              minRows={2}
              maxRows={12}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
                  e.preventDefault();
                  saveEdit();
                } else if (e.key === "Escape") {
                  e.preventDefault();
                  cancelEdit();
                }
              }}
              placeholder="แก้ไขข้อความ..."
              sx={{
                whiteSpace: "pre-wrap",
                wordBreak: "break-word",
                color: isUser ? "primary.contrastText" : "text.primary",
              }}
            />
          ) : (
            <Typography
              sx={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}
            >
              {text}
            </Typography>
          )}
        </Paper>

        {/* ====== Foot actions ====== */}
        <Stack
          direction="row"
          spacing={0.5}
          alignItems="center"
          sx={{ mt: 0.5, opacity: 0.7 }}
        >
          <Typography variant="caption">{formatTime(time)}</Typography>

          {/* โหมดแก้ไข: แสดงปุ่มบันทึก/ยกเลิก */}
          {isEditing && !sending ? (
            <>
              <Tooltip title="ยกเลิก">
                <IconButton size="small" onClick={cancelEdit} sx={{ ml: -0.5 }}>
                  <CloseRoundedIcon fontSize="inherit" />
                </IconButton>
              </Tooltip>
              <Tooltip title="บันทึก">
                <IconButton size="small" onClick={saveEdit} sx={{ ml: -0.5 }}>
                  <CheckRoundedIcon fontSize="inherit" />
                </IconButton>
              </Tooltip>
            </>
          ) : (
            <>
              {enableCopy && (
                <Tooltip title="คัดลอก">
                  <IconButton
                    size="small"
                    onClick={handleCopy}
                    sx={{ ml: -0.5 }}
                  >
                    <ContentCopyIcon fontSize="inherit" />
                  </IconButton>
                </Tooltip>
              )}
              {isUser && editable && edit_status && (
                <Tooltip title="แก้ไขข้อความ">
                  <IconButton
                    size="small"
                    onClick={startEdit}
                    sx={{ ml: -0.5 }}
                    disabled={Boolean(sending)}                     // ✅ disable เมื่อส่งอยู่
                  >
                    <EditRoundedIcon fontSize="inherit" />
                  </IconButton>
                </Tooltip>
              )}
            </>
          )}
        </Stack>
      </Box>
    </Stack>
  );
}
