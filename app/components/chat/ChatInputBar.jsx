// app/components/chat/ChatInputBar.jsx
"use client";

import React, { useRef } from "react";
import {
  Box,
  Paper,
  Stack,
  Chip,
  IconButton,
  InputBase,
  CircularProgress,
  Tooltip,
} from "@mui/material";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import MicNoneOutlinedIcon from "@mui/icons-material/MicNoneOutlined";
import SendRoundedIcon from "@mui/icons-material/SendRounded";
import PlusAttachButton from "./PlusAttachButton";
import FileCard from "./FileCard";

/**
 * ChatInputBar – แถบพิมพ์ข้อความสำหรับแชต (ใช้ซ้ำได้)
 *
 * props:
 * - value: string
 * - onChange: (text: string) => void
 * - onSend: (text: string) => void
 * - placeholder?: string
 * - actions?: Array<{ key: string; label: string; onClick: () => void; icon?: React.ReactNode; disabled?: boolean; }>
 * - loading?: boolean
 * - disabled?: boolean
 * - onAttachClick?: () => void
 * - onMicClick?: () => void
 * - maxRows?: number
 * - accept?: string                      // ".pdf,.jpg,image/*"
 * - multiple?: boolean                   // เลือกหลายไฟล์
 * - maxFiles?: number                    // เริ่มต้น 10
 * - maxSizeMB?: number                   // เริ่มต้น 10 MB
 * - onFilesSelected?: (files: FileList) => void
 * - sx?: SxProps
 */
export default function ChatInputBar({
  value,
  sending = false,
  model = "1",
  onChange,
  attachments,
  setAttachments,
  onSend,
  placeholder = "พิมพ์ข้อความ...",
  actions = [],
  loading = false,
  disabled = false,
  onAttachClick,
  onMicClick,
  maxRows = 6,
  accept,
  multiple = true,
  maxFiles = 10,
  maxSizeMB = 10,
  onFilesSelected,
  sx,
}) {
  const fileRef = useRef(null);

  const canSend =
    !loading &&
    !disabled &&
    model !== "0" &&
    (attachments?.length ?? 0) <= maxFiles &&
    sending === false &&
    String(value ?? "").trim().length > 0;

  const handleKeyDown = (e) => {
    // Enter เพื่อส่ง | Shift+Enter ขึ้นบรรทัดใหม่
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (canSend) onSend(value.trim());
    }
    // Ctrl/Cmd+Enter บังคับส่ง
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
      e.preventDefault();
      if (String(value ?? "").trim().length >= 0 && !loading && !disabled) {
        onSend(value.trim());
      }
    }
  };

  const triggerFile = () => {
    if (onAttachClick) onAttachClick();
    if (onFilesSelected && fileRef.current) fileRef.current.click();
  };

  const matchAccept = (file) => {
    if (!accept) return true;
    const accepts = accept.split(",").map((s) => s.trim().toLowerCase());
    const name = file.name?.toLowerCase() || "";
    const type = file.type?.toLowerCase() || "";
    return accepts.some((rule) => {
      if (rule.startsWith(".")) return name.endsWith(rule);
      if (rule.endsWith("/*")) return type.startsWith(rule.slice(0, -1));
      return type === rule;
    });
  };

  const addFiles = (incomingLike) => {
    // normalize เป็น array ของ File
    let list = [];
    if (incomingLike?.length) {
      // FileList
      list = Array.from(incomingLike);
    } else if (incomingLike?.items?.length) {
      // DataTransferItemList (จาก paste/drop)
      list = Array.from(incomingLike.items)
        .filter((it) => it.kind === "file")
        .map((it) => it.getAsFile())
        .filter(Boolean);
    } else if (incomingLike?.files?.length) {
      // ClipboardEvent/DataTransfer
      list = Array.from(incomingLike.files);
    }

    if (!list.length) return;

    const maxSizeBytes = maxSizeMB * 1024 * 1024;

    const nextNew = [];
    const errors = [];

    for (const f of list) {
      if (!matchAccept(f)) {
        errors.push(`ชนิดไฟล์ไม่ตรงเงื่อนไข: ${f.name}`);
        continue;
      }
      if (f.size > maxSizeBytes) {
        errors.push(`ไฟล์เกิน ${maxSizeMB}MB: ${f.name}`);
        continue;
      }
      nextNew.push(f);
    }

    setAttachments((prev = []) => {
      const seen = new Set(prev.map((f) => `${f.name}|${f.size}|${f.lastModified || 0}`));
      const merged = [...prev];

      for (const f of nextNew) {
        const key = `${f.name}|${f.size}|${f.lastModified || 0}`;
        if (!multiple) {
          // ถ้าไม่อนุญาตหลายไฟล์ ให้แทนที่ด้วยไฟล์แรกที่ผ่านเงื่อนไข
          merged.splice(0, merged.length, f);
          break;
        }
        if (!seen.has(key)) {
          seen.add(key);
          merged.push(f);
        }
      }

      // จำกัดจำนวนไฟล์รวม
      const limited = merged.slice(0, maxFiles);

      // แจ้ง callback (คืนเฉพาะไฟล์ "ใหม่" ที่เพิ่งเลือก/วาง/ลากมา)
      if (onFilesSelected) {
        try {
          const dt = new DataTransfer();
          nextNew.forEach((f) => dt.items.add(f));
          onFilesSelected(dt.files);
        } catch {
          // ข้ามหากบราวเซอร์ไม่รองรับ DataTransfer constructor
        }
      }

      if (errors.length) {
        console.warn("[ChatInputBar:file]", errors.join(" | "));
      }
      return limited;
    });
  };

  const handleFileChange = (e) => {
    addFiles(e.target.files);
    // รีเซ็ตเพื่อให้เลือกไฟล์เดิมได้อีก
    e.target.value = "";
  };

  const handlePaste = (e) => {
    // อนุญาตให้แปะ "ข้อความ" ลง InputBase ได้ตามปกติ
    // หากคลิปบอร์ดมีไฟล์ ให้ intercept แล้วเพิ่มเป็นไฟล์แทน
    const hasFiles =
      (e.clipboardData?.files?.length ?? 0) > 0 ||
      Array.from(e.clipboardData?.items ?? []).some((it) => it.kind === "file");
    if (!hasFiles) return;

    e.preventDefault();
    addFiles(e.clipboardData);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "copy";
  };

  const handleDrop = (e) => {
    e.preventDefault();
    addFiles(e.dataTransfer);
  };

  const openDrivePicker = () => {};

  const removeAt = (idx) =>
    setAttachments((prev) => prev.filter((_, i) => i !== idx));

  return (
    <Paper
      elevation={0}
      onPaste={handlePaste}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      tabIndex={0} // โฟกัสเพื่อรับ Ctrl/Cmd+V ได้
      sx={{
        border: "1px solid",
        borderColor: "primary.light",
        borderRadius: 5,
        px: 1.5,
        py: 1,
        outline: "none",
        display: "flex",
        flexDirection: "column",
        gap: 3,
        transition: "box-shadow .15s ease, border-color .15s ease",
        "&:focus-within": {
          borderColor: "primary.main",
          boxShadow: (theme) => `0 0 0 3px ${theme.palette.primary.main}22`,
        },
        ...sx,
      }}
    >
      {/* แถวบน: ปุ่ม +, ช่องพิมพ์, ปุ่มไมค์ & ส่ง */}
      <Stack direction="column" spacing={0.5}>
        {attachments?.length > 0 && (
          <Box
            sx={{
              pt: 1,
              pb: 2,
              maxWidth: "100%",
              overflowX: "auto",
              overflowY: "hidden",
              scrollbarWidth: "thin",
              "&::-webkit-scrollbar": { height: 8 },
              "&::-webkit-scrollbar-thumb": (t) => ({
                backgroundColor: t.palette.grey[300],
                borderRadius: 999,
              }),
            }}
          >
            <Stack
              direction="row"
              spacing={1}
              sx={{
                flexWrap: "nowrap",
                alignItems: "stretch",
                width: "max-content",
                minWidth: "100%",
              }}
            >
              {attachments.map((f, i) => (
                <Box key={`${f?.name ?? "file"}-${i}`} sx={{ flex: "0 0 auto" }}>
                  <FileCard title={f?.name ?? "ไฟล์แนบ"} onClose={() => removeAt(i)} />
                </Box>
              ))}
            </Stack>
          </Box>
        )}

        {/* ช่องพิมพ์ข้อความ */}
        <InputBase
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          multiline
          maxRows={maxRows}
          sx={{
            flex: 1,
            px: 1,
            py: 0.5,
            alignSelf: "stretch",
          }}
        />
      </Stack>

      <Box sx={{ display: "flex", justifyContent: "space-between" }}>
        {/* แถวล่าง: ชิป actions และปุ่มแนบไฟล์ */}
        <Box sx={{ display: "flex", alignItems: "center" }}>
          <PlusAttachButton
            triggerFile={triggerFile}
            onPickFromDrive={openDrivePicker}
            disabled={disabled}
          />

          {actions?.length > 0 && (
            <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", pl: 0.5 }}>
              {actions.map((a) => (
                <Chip
                  key={a.key}
                  label={a.label}
                  onClick={a.onClick}
                  disabled={a.disabled}
                  variant="outlined"
                  size="small"
                  sx={{ p: 2, borderColor: "grey.300", borderRadius: 2 }}
                />
              ))}
            </Box>
          )}
        </Box>

        <Box sx={{ display: "flex", alignItems: "center" }}>
          {/* ปุ่มไมค์ */}
          <Tooltip title="พูดด้วยเสียง">
            <span>
              <IconButton
                size="small"
                onClick={onMicClick}
                disabled={disabled}
                sx={{
                  border: (t) => `1px solid ${t.palette.grey[200]}`,
                  mr: 0.5,
                }}
              >
                <MicNoneOutlinedIcon fontSize="small" />
              </IconButton>
            </span>
          </Tooltip>

          {/* ปุ่มส่ง */}
          <Tooltip title={canSend ? "ส่ง" : "พิมพ์ข้อความก่อน"}>
            <span>
              <IconButton
                size="medium"
                onClick={() => canSend && onSend(value.trim())}
                disabled={!canSend}
                sx={{
                  bgcolor: "primary.main",
                  color: "primary.contrastText",
                  "&:disabled": { bgcolor: "action.disabledBackground" },
                }}
              >
                {loading ? <CircularProgress size={20} /> : <SendRoundedIcon />}
              </IconButton>
            </span>
          </Tooltip>
        </Box>
      </Box>

      {/* input file ซ่อน */}
      <input
        ref={fileRef}
        type="file"
        hidden
        accept={accept}
        multiple={multiple}
        onChange={handleFileChange}
      />
    </Paper>
  );
}
