"use client";

import React from "react";
import { Box, Button } from "@mui/material";
import { usePathname } from "next/navigation";
import RefreshIcon from "@mui/icons-material/Autorenew";
import DownloadIcon from "@mui/icons-material/Download";
import CleaningServicesIcon from "@mui/icons-material/CleaningServices";
import { useTranslations } from 'next-intl';

export default function UserTableToolbar({ onRefresh, onExport, onClearFilters }) {
  const pathname = usePathname();
  const t = useTranslations('UserTableToolbar');
  
  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        border: "1px solid #E5E7EB",
        p: 1.5,
        borderRadius: 3,
        bgcolor: "#fff",
        boxShadow: "0 3px 8px rgba(0,0,0,0.04)",
        mb: 2,
        bgcolor: "background.paper"
      }}
    >
      {pathname.startsWith("/onesqa/users") ? (
        <Box>
          {/* 🔵 ปุ่มเชื่อมต่อข้อมูลผู้ใช้งาน */}
          <Button
            variant="contained"
            startIcon={<RefreshIcon />}
            onClick={onRefresh}
            sx={{
              bgcolor: "#1976D2",
              color: "white",
              "&:hover": { bgcolor: "#1565C0" },
            }}
          >
            {t('sync')}
          </Button>
        </Box>
      ) : (
        <Box></Box>
      )}
      
      <Box
        sx={{
          display: "flex",
          gap: 1.5,
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
          onClick={onExport}
          sx={{
            bgcolor: "#02AA21",
            color: "white",
            "&:hover": { bgcolor: "#2E7D32" },
          }}
        >
          {t('export')}
        </Button>

        {/* 🔵 ปุ่มล้างตัวกรอง */}
        <Button
          variant="contained"
          startIcon={<CleaningServicesIcon />}
          onClick={onClearFilters}
          sx={{
            bgcolor: "#E3F2FD",
            color: "#1565C0",
            "&:hover": { bgcolor: "#BBDEFB" },
          }}
        >
          {t('clear')}
        </Button>
      </Box>
    </Box>
  );
}
