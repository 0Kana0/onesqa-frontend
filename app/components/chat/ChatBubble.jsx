"use client";

import * as React from "react";
import {
  Box,
  Stack,
  Paper,
  Typography,
  Avatar,
  IconButton,
  Tooltip,
} from "@mui/material";
import SmartToyOutlinedIcon from "@mui/icons-material/SmartToyOutlined";
import PersonOutlineOutlinedIcon from "@mui/icons-material/PersonOutlineOutlined";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";

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

/**
 * ChatBubble
 * @param {'user'|'assistant'} role   - ผู้พูด (user=ฟ้า, assistant=เทา)
 * @param {string|React.ReactNode} text - เนื้อความ
 * @param {string|number|Date} time - เวลา (optional)
 * @param {boolean} showAvatar - แสดง avatar หรือไม่ (default: true)
 * @param {boolean} enableCopy - แสดงปุ่มคัดลอกข้อความ (default: true)
 */
export default function ChatBubble({
  role = "assistant",
  text = "",
  time,
  showAvatar = true,
  enableCopy = true,
}) {
  const isUser = role === "user";

  const bubbleSx = {
    px: 2,
    py: 1.5,
    maxWidth: { xs: "85%", sm: "70%" },
    bgcolor: isUser ? "primary.main" : "background.paper",
    color: isUser ? "primary.contrastText" : "text.primary",
    boxShadow: 0,
    borderRadius: 2,
    // มุมให้ความรู้สึกเป็น bubble
    borderTopLeftRadius: isUser ? 2 : 0,
    borderTopRightRadius: isUser ? 0 : 2,
  };

  const avatar = isUser ? (
    <Avatar sx={{ bgcolor: "primary.main" }}>
      <PersonOutlineOutlinedIcon />
    </Avatar>
  ) : (
    <Avatar sx={{ bgcolor: "grey.200", color: "text.secondary" }}>
      <SmartToyOutlinedIcon />
    </Avatar>
  );

  const handleCopy = async () => {
    try {
      const plain =
        typeof text === "string" ? text : text?.props?.children ?? "";
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
          width: "100%"
        }}
      >
        <Paper sx={bubbleSx}>
          <Typography sx={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
            {text}
          </Typography>
        </Paper>

        <Stack
          direction="row"
          spacing={1}
          alignItems="center"
          sx={{ mt: 0.5, opacity: 0.7 }}
        >
          <Typography variant="caption">{formatTime(time)}</Typography>
          {enableCopy && (
            <Tooltip title="คัดลอกข้อความ">
              <IconButton size="small" onClick={handleCopy} sx={{ ml: -0.5 }}>
                <ContentCopyIcon fontSize="inherit" />
              </IconButton>
            </Tooltip>
          )}
        </Stack>
      </Box>
    </Stack>
  );
}
