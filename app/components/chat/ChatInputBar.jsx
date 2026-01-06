// app/components/chat/ChatInputBar.jsx
"use client";

import React, { useRef, useState, useEffect } from "react";
import Swal from "sweetalert2";
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
import MicNoneOutlinedIcon from "@mui/icons-material/MicNoneOutlined";
import SendRoundedIcon from "@mui/icons-material/SendRounded";
import PlusAttachButton from "./PlusAttachButton";
import FileCard from "./FileCard";
import { useLanguage } from "@/app/context/LanguageContext";
import { useTranslations } from "next-intl";

export default function ChatInputBar({
  theme = "light",
  value,
  sending = false,
  model,
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

  // limits
  maxFiles = 10,
  maxSizeMB = 20, // 1 ไฟล์ไม่เกิน 20MB
  maxTotalMB = 100, // รวมไฟล์ไม่เกิน 100MB

  onFilesSelected,
  sx,
}) {
  const fileRef = useRef(null);
  const { locale } = useLanguage();

  const tChatSidebar = useTranslations("ChatSidebar");
  const tChatInputError = useTranslations("ChatInputError");
  
  // ---------- state สำหรับอัดเสียง ----------
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef(null);
  const mediaStreamRef = useRef(null);
  const chunksRef = useRef([]);

  // เพิ่มใน state ด้านบน ๆ
  const [sendLock, setSendLock] = useState(false);
  const SEND_LOCK_MS = 700; // ปรับได้ตามต้องการ

  // helper: เช็คว่าไฟล์นี้เป็นไฟล์จาก mic หรือไม่
  const isMicFile = (file) => file && file.__fromMic === true;

  const hasMicFile = (attachments ?? []).some(isMicFile);

  // cleanup ตอน component ถูกถอด
  useEffect(() => {
    return () => {
      try {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
          mediaRecorderRef.current.stop();
        }
      } catch {}

      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((t) => t.stop());
      }
    };
  }, []);

  const trimmed = String(value ?? "").trim();
  const canSend =
    !loading &&
    !disabled &&
    model !== "0" &&
    !sendLock &&
    ((attachments?.length ?? 0) <= maxFiles) &&
    sending === false &&
    (trimmed.length > 0 || hasMicFile);


  const sendTooltip = canSend
    ? tChatSidebar("inputsend1")
    : model === "0"
    ? tChatSidebar("inputsend2")
    : hasMicFile
    ? tChatSidebar("inputsend3")
    : tChatSidebar("inputsend4");

  const safeSend = () => {
    if (!canSend || sendLock) return;

    setSendLock(true);
    try {
      onSend(trimmed);
    } finally {
      // ปลดล็อคหลังเวลาสั้น ๆ กัน double click / enter spam
      window.setTimeout(() => setSendLock(false), SEND_LOCK_MS);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      safeSend();
    }
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
      e.preventDefault();
      safeSend();
    }
  };

  const triggerFile = () => {
    if (onAttachClick) onAttachClick();
    if (onFilesSelected && fileRef.current) fileRef.current.click();
  };

  const matchAccept = (file) => {
    if (isMicFile(file)) return true; // ให้ไฟล์จาก mic ผ่าน accept เสมอ

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

  const getTotalSize = (files = []) =>
    files.reduce((acc, f) => acc + (f?.size ?? 0), 0);

  const addFiles = (incomingLike) => {
    let list = [];

    if (incomingLike?.length) {
      list = Array.from(incomingLike);
    } else if (incomingLike?.items?.length) {
      list = Array.from(incomingLike.items)
        .filter((it) => it.kind === "file")
        .map((it) => it.getAsFile())
        .filter(Boolean);
    } else if (incomingLike?.files?.length) {
      list = Array.from(incomingLike.files);
    }

    if (!list.length) return;

    const maxSizeBytes = maxSizeMB * 1024 * 1024;
    const maxTotalBytes = maxTotalMB * 1024 * 1024;

    const nextNew = [];
    const errors = [];

    for (const f of list) {
      if (!matchAccept(f)) {
        errors.push(`ชนิดไฟล์ไม่ตรงเงื่อนไข: ${f.name}`);
        continue;
      }
      if (!isMicFile(f) && f.size > maxSizeBytes) {
        errors.push(`ไฟล์ ${f.name} เกิน ${maxSizeMB}MB`);
        continue;
      }
      nextNew.push(f);
    }

    const currentAttachments = attachments ?? [];

    if (currentAttachments.length + nextNew.length > maxFiles) {
      if (theme === "dark") {
        Swal.fire({
          icon: "error",
          title: tChatInputError("title1"),
          text: `${tChatInputError("text11")} ${maxFiles} ${tChatInputError("text12")}`,
          background: "#2F2F30", // สีพื้นหลังดำ
          color: "#fff", // สีข้อความเป็นขาว
          titleColor: "#fff", // สี title เป็นขาว
          textColor: "#fff", // สี text เป็นขาว
        });
      } else {
        Swal.fire({
          icon: "error",
          title: tChatInputError("title1"),
          text: `${tChatInputError("text11")} ${maxFiles} ${tChatInputError("text12")}`,
        });
      }
      return;
    }

    const totalAfter = getTotalSize([...currentAttachments, ...nextNew]);

    if (totalAfter > maxTotalBytes) {
      if (theme === "dark") {
        Swal.fire({
          icon: "error",
          title: tChatInputError("title2"),
          text: `${tChatInputError("text2")} ${maxTotalMB}MB`,
          background: "#2F2F30", // สีพื้นหลังดำ
          color: "#fff", // สีข้อความเป็นขาว
          titleColor: "#fff", // สี title เป็นขาว
          textColor: "#fff", // สี text เป็นขาว
        });
      } else {
        Swal.fire({
          icon: "error",
          title: tChatInputError("title2"),
          text: `${tChatInputError("text2")} ${maxTotalMB}MB`,
        });
      }
      return;
    }

    setAttachments((prev = []) => {
      const seen = new Set(prev.map((f) => `${f.name}|${f.size}|${f.lastModified || 0}`));
      const merged = [...prev];

      for (const f of nextNew) {
        const key = `${f.name}|${f.size}|${f.lastModified || 0}`;
        if (!multiple && !isMicFile(f)) {
          merged.splice(0, merged.length, f);
          break;
        }
        if (!seen.has(key)) {
          seen.add(key);
          merged.push(f);
        }
      }

      const micFiles = merged.filter(isMicFile);
      const otherFiles = merged.filter((f) => !isMicFile(f));
      const ordered = micFiles.length ? [micFiles[0], ...otherFiles] : otherFiles;

      if (onFilesSelected) {
        try {
          const dt = new DataTransfer();
          nextNew.forEach((f) => dt.items.add(f));
          onFilesSelected(dt.files);
        } catch {}
      }

      if (errors.length) {
        if (theme === "dark") {
          Swal.fire({
            icon: "error",
            title: tChatInputError("title3"),
            html: errors.join("<br>"),
            background: "#2F2F30", // สีพื้นหลังดำ
            color: "#fff", // สีข้อความเป็นขาว
            titleColor: "#fff", // สี title เป็นขาว
            textColor: "#fff", // สี text เป็นขาว
          });
        } else {
          Swal.fire({
            icon: "error",
            title: tChatInputError("title3"),
            html: errors.join("<br>"),
          });
        }
      }

      return ordered;
    });
  };

  const handleFileChange = (e) => {
    addFiles(e.target.files);
    e.target.value = "";
  };

  const handlePaste = (e) => {
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

  // 3. เมื่อลบไฟล์ที่เกิดจาก mic ให้ set ข้อความเป็นค่าว่าง
  const removeAt = (idx) =>
    setAttachments((prev = []) => {
      const removed = prev[idx];
      const next = prev.filter((_, i) => i !== idx);

      if (isMicFile(removed) && onChange) {
        // ถ้าไฟล์ที่ลบเป็นไฟล์จาก mic → ล้างข้อความ
        onChange("");
      }

      return next;
    });

  // ---------- logic การอัดเสียง ----------
  const startRecording = async () => {
    if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      if (theme === "dark") {
        Swal.fire({
          icon: "error",
          title: tChatInputError("title4"),
          text: tChatInputError("text4"),
          background: "#2F2F30", // สีพื้นหลังดำ
          color: "#fff", // สีข้อความเป็นขาว
          titleColor: "#fff", // สี title เป็นขาว
          textColor: "#fff", // สี text เป็นขาว
        });
      } else {
        Swal.fire({
          icon: "error",
          title: tChatInputError("title4"),
          text: tChatInputError("text4"),
        });
      }
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;

      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      chunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      recorder.onerror = (e) => {
        console.error("MediaRecorder error:", e);
        if (theme === "dark") {
          Swal.fire({
            icon: "error",
            title: tChatInputError("title5"),
            background: "#2F2F30", // สีพื้นหลังดำ
            color: "#fff", // สีข้อความเป็นขาว
            titleColor: "#fff", // สี title เป็นขาว
            textColor: "#fff", // สี text เป็นขาว
          });
        } else {
          Swal.fire({
            icon: "error",
            title: tChatInputError("title5"),
          });
        }
        setIsRecording(false);
        if (mediaStreamRef.current) {
          mediaStreamRef.current.getTracks().forEach((t) => t.stop());
          mediaStreamRef.current = null;
        }
      };

      recorder.onstop = async () => {
        try {
          const blob = new Blob(chunksRef.current, { type: "audio/webm" });
          chunksRef.current = [];

          if (mediaStreamRef.current) {
            mediaStreamRef.current.getTracks().forEach((t) => t.stop());
            mediaStreamRef.current = null;
          }

          if (blob.size === 0) {
            setIsRecording(false);
            return;
          }

          const fileName =
            "recording-" +
            new Date().toISOString().replace(/[:.]/g, "-") +
            ".webm";

          const file = new File([blob], fileName, {
            type: "audio/webm",
            lastModified: Date.now(),
          });

          file.__fromMic = true;

          // 1. เมื่อมีไฟล์ที่เกิดจาก mic ให้ set ข้อความเป็น "แปลงคำพูดจากไฟล์นี้"
          // 2. ภาษาอังกฤษของข้อความนี้: "Transcribe speech from this file"
          if (onChange) {
            if (locale === "th") {
              onChange("ถอดคำพูดจากไฟล์ เอาเเค่คำพูดจากไฟล์ไม่ต้องใส่อะไรอย่างอื่น");
            } else {
              onChange("Transcribe speech from this file");
            }
          }

          addFiles([file]);
        } catch (err) {
          console.error(err);
          if (theme === "dark") {
            Swal.fire({
              icon: "error",
              title: tChatInputError("title6"),
              background: "#2F2F30", // สีพื้นหลังดำ
              color: "#fff", // สีข้อความเป็นขาว
              titleColor: "#fff", // สี title เป็นขาว
              textColor: "#fff", // สี text เป็นขาว
            });
          } else {
            Swal.fire({
              icon: "error",
              title: tChatInputError("title6"),
            });
          }
        } finally {
          setIsRecording(false);
          mediaRecorderRef.current = null;
        }
      };

      recorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error(err);
      if (theme === "dark") {
        Swal.fire({
          icon: "error",
          title: tChatInputError("title7"),
          text: tChatInputError("text7"),
          background: "#2F2F30", // สีพื้นหลังดำ
          color: "#fff", // สีข้อความเป็นขาว
          titleColor: "#fff", // สี title เป็นขาว
          textColor: "#fff", // สี text เป็นขาว
        });
      } else {
        Swal.fire({
          icon: "error",
          title: tChatInputError("title7"),
          text: tChatInputError("text7"),
        });
      }
    }
  };

  const stopRecording = () => {
    try {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
        mediaRecorderRef.current.stop();
      } else {
        setIsRecording(false);
      }
    } catch (err) {
      console.error(err);
      setIsRecording(false);
    }
  };

  const handleMicButtonClick = () => {
    if (hasMicFile) return;

    if (onMicClick) {
      onMicClick({ isRecording: !isRecording });
    }

    if (disabled || loading) return;

    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  return (
    <Paper
      elevation={0}
      onPaste={handlePaste}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      tabIndex={0}
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
        "&:focus-within": {
          borderColor: "primary.main",
        },
        ...sx,
      }}
    >
      <Stack direction="column" spacing={0.5}>
        {attachments?.length > 0 && (
          <Box
            sx={{
              pt: 1,
              pb: 2,
              overflowX: "auto",
            }}
          >
            <Stack direction="row" spacing={1}>
              {attachments.map((f, i) => (
                <Box key={`${f?.name}-${i}`}>
                  <FileCard title={f?.name} onClose={() => removeAt(i)} />
                </Box>
              ))}
            </Stack>
          </Box>
        )}

        {!hasMicFile && (
          <InputBase
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={disabled}
            multiline
            maxRows={maxRows}
            sx={{ px: 1, py: 0.5 }}
          />
        )}
      </Stack>

      <Box sx={{ display: "flex", justifyContent: "space-between" }}>
        <Box sx={{ display: "flex", alignItems: "center" }}>
          <PlusAttachButton triggerFile={triggerFile} disabled={disabled} />

          {actions?.length > 0 && (
            <Box sx={{ display: "flex", gap: 1, pl: 0.5 }}>
              {actions.map((a) => (
                <Chip
                  key={a.key}
                  label={a.label}
                  onClick={a.onClick}
                  disabled={a.disabled}
                  variant="outlined"
                  size="small"
                />
              ))}
            </Box>
          )}
        </Box>

        <Box sx={{ display: "flex", alignItems: "center" }}>
          <Tooltip
            title={
              hasMicFile
                ? tChatSidebar("inputsoundbreak")
                : isRecording
                ? tChatSidebar("inputsoundstop")
                : tChatSidebar("inputsoundstart")
            }
          >
            <span>
              <IconButton
                size="small"
                onClick={handleMicButtonClick}
                disabled={disabled || loading || hasMicFile}
                sx={{
                  mr: 0.5,
                  bgcolor: isRecording ? "error.light" : "transparent",
                  color: isRecording ? "error.main" : "inherit",
                }}
              >
                <MicNoneOutlinedIcon fontSize="small" />
              </IconButton>
              
            </span>
          </Tooltip>

          <Tooltip title={sendTooltip}>
            <span>
              <IconButton
                size="medium"
                onClick={safeSend}
                disabled={!canSend}
                sx={{
                  bgcolor: "primary.main",
                  color: "white",
                  opacity: sendLock ? 0.7 : 1,
                }}
              >
                {loading ? <CircularProgress size={20} /> : <SendRoundedIcon />}
              </IconButton>
            </span>
          </Tooltip>
        </Box>
      </Box>

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
