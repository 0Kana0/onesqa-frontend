"use client";

import React from "react";
import { Box, Button, useMediaQuery } from "@mui/material";
import { usePathname, useRouter } from "next/navigation";
import RefreshIcon from "@mui/icons-material/Autorenew";
import HistoryIcon from "@mui/icons-material/History";
import { useTranslations } from "next-intl";

export default function AcademyToolbar({
  onRefresh,
  onExport,
  onClearFilters,
}) {
  const router = useRouter();
  const pathname = usePathname();
  const t = useTranslations("AcademyToolbar");

  const isMobile = useMediaQuery("(max-width:600px)"); // < md คือจอเล็ก

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: isMobile ? "column" : "row", // ✅ สลับแนวตามจอ
        alignItems: isMobile ? "flex-start" : "center",
        justifyContent: "space-between",
        border: "1px solid #E5E7EB",
        p: 1.5,
        borderRadius: 3,
        bgcolor: "#fff",
        boxShadow: "0 3px 8px rgba(0,0,0,0.04)",
        mb: 2,
        bgcolor: "background.paper",
        gap: isMobile ? 1 : 0,
      }}
    >
      <Box
        sx={{
          width: isMobile ? "100%" : "none",
        }}
      >
        {/* 🔵 ปุ่มเชื่อมต่อข้อมูลผู้ใช้งาน */}
        <Button
          variant="contained"
          startIcon={<RefreshIcon />}
          onClick={onRefresh}
          sx={{
            width: isMobile ? "100%" : "none",
            bgcolor: "#1976D2",
            color: "white",
            "&:hover": { bgcolor: "#1565C0" },
          }}
        >
          {t("sync")}
        </Button>
      </Box>

      <Box
        sx={{
          display: "flex",
          flexDirection: isMobile ? "column" : "row", // ✅ สลับแนวตามจอ
          width: isMobile ? "100%" : "none",
          gap: 1,
        }}
      >
        {/* 🟢 ปุ่มส่งออก */}
        <Button
          variant="contained"
          startIcon={<HistoryIcon />}
          onClick={() => router.push(`/onesqa/sarhistory`)}
          sx={{
            width: isMobile ? "100%" : "none",
            bgcolor: "#02AA21",
            color: "white",
            "&:hover": { bgcolor: "#2E7D32" },
          }}
        >
          {t("sarhistory")}
        </Button>
      </Box>
    </Box>
  );
}
