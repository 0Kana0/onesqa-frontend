"use client";

import React, { useMemo, useState } from "react";
import {
  Box,
  Typography,
  LinearProgress,
  useMediaQuery,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  Divider,
} from "@mui/material";
import CloseRounded from "@mui/icons-material/CloseRounded";
import { useLazyQuery } from "@apollo/client/react";
import { formatTokens } from "@/util/formatTokens";
import { useTranslations } from "next-intl";
import { GET_SUM_TOKEN_BY_MODEL } from "@/graphql/ai/queries";

function TokenSummaryCard({ row, always, t }) {
  const isMobile = useMediaQuery("(max-width:600px)");

  const aiTotal = Number(row?.ai_token_count ?? 0);
  const usedTotal = Number(row?.total_token_count ?? 0);
  const diff = Number(row?.diff_token_count ?? 0);

  const percent = useMemo(() => {
    if (!aiTotal) return 0;
    return Math.min((usedTotal / aiTotal) * 100, 100);
  }, [aiTotal, usedTotal]);

  // 🎨 สีตามระดับการใช้งาน (ยิ่งใช้เยอะยิ่งเตือน)
  const progressColor = useMemo(() => {
    if (percent >= 85) return "#E53935";
    if (percent >= 70) return "#FFA726";
    return "#3E8EF7";
  }, [percent]);

  return (
    <Box
      sx={{
        borderRadius: 3,
        display: "flex",
        flexDirection: "column",
        border: "1px solid #E5E7EB",
        boxShadow: "0 3px 8px rgba(0,0,0,0.04)",
        p: isMobile ? 1.5 : 2,
        gap: 1.2,
        bgcolor: "background.paper",
      }}
    >
      {/* 🔹 ชื่อโมเดล */}
      <Typography variant="subtitle1" fontWeight="bold">
        {row.model_use_name}
      </Typography>

      {/* 🔹 used/total */}
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Typography color="text.secondary" fontSize={14}>
          {t("used")}
        </Typography>
        <Typography fontWeight="bold" fontSize={14}>
          {formatTokens(usedTotal, isMobile, always)} / {formatTokens(aiTotal, isMobile, always)} Tokens
        </Typography>
      </Box>

      {/* 🔹 progress */}
      <LinearProgress
        variant="determinate"
        value={percent}
        sx={{
          height: 10,
          borderRadius: 5,
          backgroundColor: "#e3f2fd",
          "& .MuiLinearProgress-bar": { backgroundColor: progressColor },
        }}
      />

      {/* 🔹 diff */}
      <Box
        sx={{
          mt: 0.5,
          p: 1.2,
          borderRadius: 2,
          border: "1px solid #E5E7EB",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Typography color="text.secondary" fontSize={14}>
          {t("diff")}
        </Typography>
        <Typography fontWeight="bold">
          {diff >= 0 ? "+" : ""}
          {formatTokens(diff, isMobile, always)} Tokens
        </Typography>
      </Box>
    </Box>
  );
}

export default function TokenSummaryModalButton({
  message_type = null, // optional: "TEXT" | "IMAGE" | "VIDEO" | "DOC"
  always = false,
}) {
  const isMobile = useMediaQuery("(max-width:600px)");
  const [open, setOpen] = useState(false);

  const t = useTranslations("TokenSummaryModalButton");

  const [load, { data, loading, error }] = useLazyQuery(GET_SUM_TOKEN_BY_MODEL, {
    fetchPolicy: "network-only",
  });

  const rows = data?.sumTokenCountByModel || [];

  const handleOpen = () => {
    setOpen(true);
    load({ variables: { message_type } }); // ✅ เรียก API ตอนเปิด modal
  };

  return (
    <>
      <Box
        sx={{
          display: "flex",
          flexDirection: isMobile ? "column" : "row",
          alignItems: isMobile ? "flex-start" : "center",
          justifyContent: isMobile ? "flex-start" : "flex-end", // ✅ desktop ชิดขวา
          p: 1.5,
          border: "1px solid #E0E0E0",
          borderRadius: 3,
          bgcolor: "background.paper",
          mb: 2,
          gap: isMobile ? 1 : 0,
        }}
      >
        <Box
          sx={{
            display: "flex",
            flexDirection: isMobile ? "column" : "row",
            width: isMobile ? "100%" : "auto",
            gap: 1,
            ml: isMobile ? 0 : "auto", // ✅ desktop ดันไปขวาสุด
            justifyContent: isMobile ? "flex-start" : "flex-end",
          }}
        >
          <Button
            variant="contained"
            onClick={handleOpen}
            fullWidth={isMobile} // ✅ มือถือเต็มความกว้าง (ถ้าต้องการ)
            sx={{
              bgcolor: "#1976d2",
              color: "white",
              px: 2.5,
              "&:hover": { bgcolor: "#1565c0" },
            }}
          >
            {t("button")}
          </Button>
        </Box>
      </Box>

      <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="md">
        <DialogTitle
          sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", pr: 1 }}
        >
          <Box>
            <Typography fontWeight="bold">{t("title")}</Typography>
          </Box>

          <IconButton onClick={() => setOpen(false)}>
            <CloseRounded />
          </IconButton>
        </DialogTitle>

        <DialogContent>
          {loading && (
            <Box sx={{ mb: 2 }}>
              <LinearProgress />
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                {t("loading")}
              </Typography>
            </Box>
          )}

          {!!error && (
            <Box sx={{ mb: 2, p: 1.2, borderRadius: 2, border: "1px solid #FCA5A5" }}>
              <Typography color="error" fontSize={14}>
                {t("error")}: {error.message}
              </Typography>
            </Box>
          )}

          {!loading && !error && rows.length === 0 && (
            <Typography color="text.secondary">{t("notfound")}</Typography>
          )}

          {!loading && !error && rows.length > 0 && (
            <>
              <Divider sx={{ mb: 2 }} />
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: isMobile ? "1fr" : "1fr",
                  gap: 2,
                }}
              >
                {rows.map((row) => (
                  <TokenSummaryCard key={String(row.ai_id)} row={row} always={always} t={t} />
                ))}
              </Box>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
