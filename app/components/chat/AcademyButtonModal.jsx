// components/AcademySearchModal.jsx
"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  IconButton,
  TextField,
  Button,
  Box,
  useMediaQuery,
  Stack,
  CircularProgress,
  Divider,
  Paper,
  Checkbox,
} from "@mui/material";
import CloseRounded from "@mui/icons-material/CloseRounded";
import { useSidebar } from "@/app/context/SidebarContext";
import { useTranslations } from "next-intl";
import { useQuery } from "@apollo/client/react";

import { GET_ACADEMY_BY_CODE_CHAT } from "@/graphql/academy/queries";
import FileCard from "@/app/components/chat/FileCard"; // ✅ ปรับ path ให้ตรงโปรเจกต์คุณ

const normalizeText = (v) => {
  const s = (v ?? "").trim();
  return s === "" ? null : s;
};

export default function AcademySearchModal({
  open,
  onClose,
  onSearch, // (query: string) => void  (optional)
  onUpload, // ✅ เพิ่มใหม่ (optional): ({ academy, selectedFiles, selectedUrls }) => void
  initialQuery = "",
  placeholder,
}) {
  const { toggle } = useSidebar();
  const tChatSidebar = useTranslations("ChatSidebar");
  const tInit = useTranslations("Init");

  const isTablet = useMediaQuery("(max-width:1200px)");

  const [query, setQuery] = useState(initialQuery);
  const [submittedCode, setSubmittedCode] = useState("");

  // ✅ checkbox state: { [url]: true }
  const [selected, setSelected] = useState({});

  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (open) {
      setQuery(initialQuery || "");
      setSubmittedCode("");
      setSelected({});
    }
  }, [open, initialQuery]);

  const searchCode = useMemo(() => normalizeText(submittedCode), [submittedCode]);

  const {
    data: academyData,
    loading: academyLoading,
    error: academyError,
  } = useQuery(GET_ACADEMY_BY_CODE_CHAT, {
    fetchPolicy: "cache-and-network",
    notifyOnNetworkStatusChange: true,
    variables: { code: searchCode },
    skip: !searchCode,
  });

  const academy = academyData?.academyByCodeChat ?? null;
  const sarFiles = Array.isArray(academy?.sar_file) ? academy.sar_file : [];
  const hasSarFiles = sarFiles.length > 0;

  const selectedUrls = useMemo(
    () => Object.keys(selected).filter((k) => selected[k]),
    [selected]
  );

  const toggleOne = (url) => {
    if (!url) return;
    setSelected((prev) => {
      const next = { ...prev };
      if (next[url]) delete next[url];
      else next[url] = true;
      return next;
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const q = query.trim();
    if (!q) return;

    setSubmittedCode(q);
    setSelected({}); // ✅ ค้นหาใหม่ เคลียร์การเลือก

    onSearch?.(q);

    if (isTablet) toggle();
    // ❌ ไม่ปิด modal เพื่อแสดงผลลัพธ์ใน modal
  };

  const handleUpload = async () => {
    const selectedFiles = sarFiles.filter((x) => selectedUrls.includes(x?.file));

    try {
      setUploading(true);
      // ✅ ส่งออกไปให้ ChatPage จัดการใส่ attachments
      await onUpload?.({ academy, selectedFiles, selectedUrls });
      // ถ้าอยากปิด modal หลัง upload สำเร็จ:
      // onClose?.();
    } finally {
      setUploading(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="sm"
      PaperProps={{ sx: { borderRadius: 3, p: 0.5 } }}
    >
      <DialogTitle>
        <Typography sx={{ fontSize: 16 }}>
          {tChatSidebar("academytitle")}
        </Typography>

        <IconButton
          onClick={onClose}
          sx={{ position: "absolute", right: 8, top: 8 }}
          aria-label={tChatSidebar("academyclose")}
        >
          <CloseRounded />
        </IconButton>
      </DialogTitle>

      <Box component="form" onSubmit={handleSubmit}>
        <DialogContent
          sx={{
            pt: 0.5,
            maxHeight: "70vh",
            overflowY: "auto",
          }}
        >
          <TextField
            autoFocus
            fullWidth
            size="small"
            placeholder={tChatSidebar("academysearch")}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />

          {/* ✅ ผลลัพธ์ค้นหา */}
          <Box sx={{ mt: 2 }}>
            {!searchCode ? null : (
              <>
                <Divider sx={{ mb: 2 }} />

                {/* loading */}
                {academyLoading && (
                  <Stack direction="row" spacing={1} alignItems="center">
                    <CircularProgress size={16} />
                    <Typography variant="body2">{tInit("loading")}...</Typography>
                  </Stack>
                )}

                {/* error */}
                {!academyLoading && academyError && (
                  <Typography color="error" variant="body2">
                    ❌ {tInit("error")}
                  </Typography>
                )}

                {/* not found academy */}
                {!academyLoading && !academyError && !academy && (
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    align="center"
                    sx={{ py: 2 }}
                  >
                    {tChatSidebar("academynotfound")}
                  </Typography>
                )}

                {/* found academy */}
                {!academyLoading && !academyError && academy && (
                  <Box>
                    <Paper variant="outlined" sx={{ p: 1.5, borderRadius: 3 }}>
                      <Typography fontWeight={800}>{academy.name ?? "-"}</Typography>
                    </Paper>

                    <Box sx={{ mt: 2 }}>
                      {!hasSarFiles ? (
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          align="center"
                          sx={{ py: 2 }}
                        >
                          {tChatSidebar("academynotfound2")}
                        </Typography>
                      ) : (
                        <Stack spacing={0.75}>
                          {sarFiles.map((f, idx) => {
                            const url = f?.file || "";
                            const title =
                              (url.split("/").pop() || `SAR ${f?.year ?? "-"}`);
                            const checked = Boolean(selected[url]);

                            return (
                              <Stack
                                key={`${f?.year ?? "NA"}-${idx}`}
                                direction="row"
                                spacing={1}
                                alignItems="center"
                              >
                                {/* ✅ Checkbox (ไม่มีลบ) */}
                                <Checkbox
                                  checked={checked}
                                  onChange={() => toggleOne(url)}
                                  disabled={!url}
                                />

                                <FileCard
                                  title={title}
                                  href={url}
                                  typeLabel={`SAR ${f?.year ?? ""}`}
                                  sx={{ width: "100%" }}
                                />
                              </Stack>
                            );
                          })}
                        </Stack>
                      )}
                    </Box>
                  </Box>
                )}
              </>
            )}
          </Box>
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 2, gap: 1 }}>
          <Box sx={{ flex: 1 }} />

          {/* ✅ ปุ่ม Upload โผล่เมื่อ: พบ academy และมี sar_file */}
          {academy && hasSarFiles && (
            <Button
              type="button"
              variant="contained"
              onClick={handleUpload}
              disabled={selectedUrls.length === 0 || uploading}
            >
              {uploading ? tChatSidebar("academyuploading") : tChatSidebar("academyupload")}
            </Button>
          )}

          <Button type="submit" variant="contained" disabled={!query.trim()}>
            {tChatSidebar("academyenter")}
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  );
}
