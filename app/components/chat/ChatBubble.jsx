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
  Link as MuiLink,           // ⭐ NEW
} from "@mui/material";
import SmartToyOutlinedIcon from "@mui/icons-material/SmartToyOutlined";
import PersonOutlineOutlinedIcon from "@mui/icons-material/PersonOutlineOutlined";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import EditRoundedIcon from "@mui/icons-material/EditRounded";
import CheckRoundedIcon from "@mui/icons-material/CheckRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import FileCard from "./FileCard";
import { getAiLogo, AI_LOGOS } from "@/util/aiLogo";

// ⭐ NEW: สำหรับ render markdown (รองรับ table / list / bold / code / ฯลฯ)
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

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

function CodeBlock({ children, ...props }) {
  const [copied, setCopied] = React.useState(false);

  const textToCopy = Array.isArray(children)
    ? children.join("")
    : String(children || "").replace(/\n$/, "");

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch (e) {
      console.error("Copy failed", e);
    }
  };

  return (
    <Box sx={{ position: "relative", my: 1 }}>
      <Box
        component="pre"
        sx={{
          fontFamily: "monospace",
          fontSize: "0.875rem",
          p: 1.5,
          borderRadius: 1,
          overflowX: "auto",
          bgcolor: "background.default",
        }}
      >
        <Box component="code" {...props}>
          {textToCopy}
        </Box>
      </Box>

      <Tooltip title={copied ? "คัดลอกแล้ว" : "คัดลอกโค้ด"}>
        <IconButton
          size="small"
          onClick={handleCopy}
          sx={{
            position: "absolute",
            top: 4,
            right: 4,
          }}
        >
          <ContentCopyIcon fontSize="inherit" />
        </IconButton>
      </Tooltip>
    </Box>
  );
}

function normalizeGeminiText(raw) {
  if (typeof raw !== "string") return raw;

  // รวม line ending ให้เหลือ \n เดียว
  let text = raw.replace(/\r\n/g, "\n");

  // บีบช่องว่าง “หลัง bullet/ตัวเลข” ให้เหลือ 1 ช่อง
  //    เคสแบบ: "*         รูปภาพ..." หรือ "1.      ข้อความ..."
  text = text
    // bullet list: *, -, +
    .replace(
      /^([ \t]*[*\-+])[ \t]+(.*)$/gm,
      (m, marker, rest) => `${marker} ${rest.trimStart()}`
    )
    // numbered list: 1. 2. ฯลฯ
    .replace(
      /^([ \t]*\d+\.)[ \t]+(.*)$/gm,
      (m, marker, rest) => `${marker} ${rest.trimStart()}`
    );

  return text;
}

/**
 * ⭐ NEW: ตัวแปลงข้อความ Gemini (Markdown/GFM) → MUI component
 */
function GeminiMarkdown({ content }) {
  const rawText = typeof content === "string" ? content : toPlainString(content);
  const text = normalizeGeminiText(rawText);   // 👈 แทรกตรงนี้
  //console.log(text);
  
  if (!text) return null;

  return (
    <Box
      sx={{
        // ปรับ margin ย่อหน้าให้สวยใน bubble
        "& p": { mb: 1 },
        "& p:last-of-type": { mb: 0 },
        "& ul, & ol": { mb: 1.2, pl: 3 },
        "& h1, & h2, & h3, & h4": { mt: 1, mb: 0.5, fontWeight: 700 },
        "& table": {
          borderCollapse: "collapse",
          width: "100%",
          my: 1,
        },
        "& th, & td": {
          border: (theme) => `1px solid ${theme.palette.divider}`,
          px: 1,
          py: 0.5,
          fontSize: "0.875rem",
        },
        "& th": {
          fontWeight: 600,
          bgcolor: "action.hover",
        },
      }}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        // ไม่อนุญาต HTML ตรง ๆ เพื่อกัน XSS
        skipHtml
        components={{
          h1: ({ node, ...props }) => (
            <Typography variant="h5" {...props} />
          ),
          h2: ({ node, ...props }) => (
            <Typography variant="h6" {...props} />
          ),
          h3: ({ node, ...props }) => (
            <Typography variant="subtitle1" fontWeight={700} {...props} />
          ),
          h4: ({ node, ...props }) => (
            <Typography variant="subtitle2" fontWeight={700} {...props} />
          ),
          p: ({ node, ...props }) => (
            <Typography
              {...props}
              sx={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}
            />
          ),
          strong: ({ node, ...props }) => (
            <Box component="strong" fontWeight={700} {...props} />
          ),
          em: ({ node, ...props }) => (
            <Box component="em" sx={{ fontStyle: "italic" }} {...props} />
          ),
          del: ({ node, ...props }) => (
            <Box
              component="del"
              sx={{ textDecoration: "line-through" }}
              {...props}
            />
          ),
          ul: ({ node, ordered, ...props }) => <Box component="ul" {...props} />,
          ol: ({ node, ordered, ...props }) => <Box component="ol" {...props} />,
          li: ({ node, ...props }) => <Box component="li" {...props} />,
          hr: () => (
            <Box
              component="hr"
              sx={{ my: 1.5, border: 0, borderTop: "1px solid", borderColor: "divider" }}
            />
          ),
          blockquote: ({ node, ...props }) => (
            <Box
              component="blockquote"
              sx={{
                borderLeft: 3,
                borderColor: "divider",
                pl: 2,
                ml: 0,
                my: 1,
                py: 0.5,
                fontStyle: "italic",
                bgcolor: "action.hover",
              }}
              {...props}
            />
          ),
          a: ({ node, href, ...props }) => (
            <MuiLink
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              color="inherit"              // กันไม่ให้ theme primary มาเปลี่ยนสี
              sx={{
                color: "#3E8EF7",
                textDecorationColor: "#3E8EF7",
                "&:hover": {
                  color: "#3E8EF7",
                  textDecorationColor: "#3E8EF7",
                  textDecoration: "underline",
                },
              }}
              {...props}
            />
          ),
          code: ({ node, inline, className, children, ...props }) => {
            if (inline) {
              // inline code: `foo`
              return (
                <Box
                  component="code"
                  sx={{
                    fontFamily: "monospace",
                    fontSize: "0.875rem",
                    px: 0.5,
                    borderRadius: 0.5,
                    bgcolor: "action.hover",
                  }}
                  {...props}
                >
                  {children}
                </Box>
              );
            }

            // block code: ``` ... ```
            return <CodeBlock {...props}>{children}</CodeBlock>;
          },
          table: ({ node, ...props }) => (
            <Box component="table" {...props} />
          ),
          thead: ({ node, ...props }) => (
            <Box component="thead" {...props} />
          ),
          tbody: ({ node, ...props }) => (
            <Box component="tbody" {...props} />
          ),
          tr: ({ node, isHeader, ...props }) => <Box component="tr" {...props} />,
          th: ({ node, ...props }) => <Box component="th" {...props} />,
          td: ({ node, ...props }) => <Box component="td" {...props} />,
        }}
      >
        {text}
      </ReactMarkdown>
    </Box>
  );
}

/**
 * ChatBubble
 * @param {'user'|'assistant'} role
 * @param {string|React.ReactNode} text
 * @param {string|number|Date} time
 * @param {Array} files
 * @param {boolean} showAvatar
 * @param {boolean} enableCopy
 * @param {(newText: string) => void} onEdit
 * @param {boolean} editable
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
  sending = false,
}) {
  const isUser = role === "user";

  // ====== Edit state ======
  const initialPlain = toPlainString(text);
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState(initialPlain);

  useEffect(() => {
    if (!isEditing) setDraft(toPlainString(text));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text]);

  useEffect(() => {
    if (sending) setIsEditing(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sending]);

  const startEdit = () => {
    setDraft(toPlainString(text));
    setIsEditing(true);
  };
  const cancelEdit = () => {
    setDraft(toPlainString(text));
    setIsEditing(false);
  };
  const saveEdit = () => {
    onChangeEdit(id, draft);
    setIsEditing(false);
  };

  const bubbleSx = {
    px: 2,
    py: 1.5,
    maxWidth: isEditing && !sending ? "100%" : { xs: "100%", sm: "100%" },
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

        {/* ====== Bubble area: view / edit ====== */}
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
            <>
              {isUser ? (
                // ⭐ ฝั่ง user: ยังใช้ Typography ธรรมดา → flow เดิม
                <Typography
                  sx={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}
                >
                  {text}
                </Typography>
              ) : (
                // ⭐ ฝั่ง assistant: ใช้ GeminiMarkdown แทน Typography
                <GeminiMarkdown content={text} />
              )}
            </>
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
                    disabled={Boolean(sending)}
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
