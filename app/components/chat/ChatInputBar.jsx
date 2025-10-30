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
 * - onAttachClick?: () => void            // คลิกปุ่ม +
 * - onMicClick?: () => void               // คลิกไมค์
 * - maxRows?: number                      // เริ่มต้น 6
 * - accept?: string                       // สำหรับ input file
 * - multiple?: boolean                    // เลือกหลายไฟล์
 * - onFilesSelected?: (files: FileList) => void
 * - sx?: SxProps                          // override style เพิ่มเติม
 */
export default function ChatInputBar({
  value,
  model = "1",
  onChange,
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
  onFilesSelected,
  sx,
}) {
  const fileRef = useRef(null);

  const canSend =
    !loading && !disabled && model !== "0" && String(value ?? "").trim().length > 0;

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

  const handleFileChange = (e) => {
    const files = e.target.files;
    if (files && files.length && onFilesSelected) onFilesSelected(files);
    // รีเซ็ตค่า เพื่อให้เลือกไฟล์เดิมซ้ำได้
    e.target.value = "";
  };

  return (
    <Paper
      elevation={0}
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
      <Stack direction="row" alignItems="center" spacing={0.5}>
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

      <Box sx={{
        display: "flex",
        justifyContent: "space-between"
      }}>
        {/* แถวล่าง: ชิป actions (Deep Research / Canvas ฯลฯ) */}
      <Box sx={{
        display: "flex",
        alignItems: "center"
      }}>
        {/* ปุ่ม + (แนบไฟล์/เมนูอื่น) */}
        <Tooltip title="เพิ่ม/แนบไฟล์">
          <span>
            <IconButton
              size="small"
              onClick={triggerFile}
              disabled={disabled}
              sx={{
                //bgcolor: "common.white",
                border: (t) => `1px solid ${t.palette.grey[200]}`,
              }}
            >
              <AddRoundedIcon fontSize="small" />
            </IconButton>
          </span>
        </Tooltip>

        {actions?.length > 0 && (
          <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", pl: 0.5 }}>
            {actions.map((a) => (
              <Chip
                key={a.key}
                label={a.label}
                onClick={a.onClick}
                disabled={a.disabled}
                icon={a.icon}
                variant="outlined"
                size="small"
                sx={{
                  p: 2,
                  //bgcolor: "common.white",
                  borderColor: "grey.300",
                  borderRadius: 2,
                }}
              />
            ))}
          </Box>
        )}
      </Box>

      <Box sx={{
        display: "flex",
        alignItems: "center"
      }}>
        {/* ปุ่มไมค์ */}
        <Tooltip title="พูดด้วยเสียง">
          <span>
            <IconButton
              size="small"
              onClick={onMicClick}
              disabled={disabled}
              sx={{
                //bgcolor: "common.white",
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
                "&:disabled": {
                  bgcolor: "action.disabledBackground",
                },
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
