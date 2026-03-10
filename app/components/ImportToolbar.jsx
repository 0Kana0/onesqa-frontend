"use client";

import React from "react";
import { Box, Button, useMediaQuery } from "@mui/material";
import { usePathname } from "next/navigation";
import RefreshIcon from "@mui/icons-material/Autorenew";
import DownloadIcon from "@mui/icons-material/Download";
import CleaningServicesIcon from "@mui/icons-material/CleaningServices";
import { useTranslations } from 'next-intl';

export default function ImportToolbar({ onimport }) {
  const pathname = usePathname();
  const t = useTranslations('UserTableToolbar');
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
      <Box></Box>
      
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
          startIcon={<DownloadIcon />}
          endIcon={
            <img
              src="/icons/XLSX.svg" // ✅ เปลี่ยน path เป็นรูปจริงของคุณ
              alt="excel"
              style={{ width: 20, height: 20, marginLeft: 4 }}
            />
          }
          onClick={onimport}
          sx={{
            bgcolor: "#FFC107",
            color: "white",
            "&:hover": { bgcolor: "#FFB300" },
          }}
        >
          {t('import')}
        </Button>
      </Box>
    </Box>
  );
}
