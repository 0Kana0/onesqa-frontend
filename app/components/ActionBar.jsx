"use client";

import { Box, Button, ButtonGroup, useMediaQuery } from "@mui/material";
import SaveIcon from "@mui/icons-material/Save";
import ReplayIcon from "@mui/icons-material/Replay";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import CleaningServicesIcon from "@mui/icons-material/CleaningServices";
import GridViewIcon from "@mui/icons-material/GridView";
import { useTranslations } from 'next-intl';
import { useRouter, usePathname, useParams } from "next/navigation";

export default function ActionBar({
  onSubmit,
  onClearData,
  onClearFilters,
  viewMode,
  onViewChange,
  settingMode="Tokens",
}) {
  const pathname = usePathname(); // ✅ ได้ path ปัจจุบัน เช่น "/login", "/dashboard"

  const t = useTranslations('ActionBar');
  const isMobile = useMediaQuery("(max-width:600px)"); // < md คือจอเล็ก
  
  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: isMobile ? "column" : "row", // ✅ สลับแนวตามจอ
        alignItems: isMobile ? "flex-start" : "center",
        justifyContent: "space-between",
        p: 1.5,
        border: "1px solid #E0E0E0",
        borderRadius: 3,
        bgcolor: "background.paper",
        mb: 2,
        gap: isMobile ? 1 : 0,
      }}
    >
      {/* ปุ่มฝั่งซ้าย */}
      <Box sx={{ 
        display: "flex",
        flexDirection: isMobile ? "column" : "row", // ✅ สลับแนวตามจอ
        width: isMobile ? "100%" : "none",
        gap: 1 
      }}>
        <Button
          variant="contained"
          startIcon={<SaveIcon />}
          onClick={() => onSubmit()}
          sx={{
            bgcolor: "#1976d2",
            color: "white",
            px: 2.5,
            "&:hover": { bgcolor: "#1565c0" },
          }}
        >
          {t('save')}
        </Button>

        <Button
          variant="contained"
          startIcon={<ReplayIcon />}
          onClick={() => onClearData()}
          sx={{
            bgcolor: "#E3F2FD",
            color: "#1976d2",
            px: 2.5,
            "&:hover": { bgcolor: "#BBDEFB" },
          }}
        >
          {t('reset')}
        </Button>

        {/* 🔵 ปุ่มล้างตัวกรอง */}
        {pathname.startsWith("/onesqa/settings") && settingMode === "Tokens" && (
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
        )}
      </Box>

      {/* ปุ่มกลุ่มขวา */}
      {settingMode === "Tokens" ? (
        <ButtonGroup
          variant="contained"
          sx={{
            width: isMobile ? "100%" : "none",
            borderRadius: 2,
            overflow: "hidden",
            boxShadow: "none",
          }}
        >
          {/* ปุ่ม Card */}
          <Button
            onClick={() => onViewChange("card")}
            sx={{
              bgcolor: viewMode === "card" ? "#3E8EF7" : "#E3F2FD",
              "&:hover": {
                bgcolor: viewMode === "card" ? "#1976d2" : "#BBDEFB",
              },
              width: isMobile ? "100%" : "none",
            }}
          >
            <ContentCopyIcon
              sx={{
                color: viewMode === "card" ? "white" : "#3E8EF7",
              }}
            />
          </Button>

          {/* ปุ่ม Table */}
          <Button
            onClick={() => onViewChange("table")}
            sx={{
              bgcolor: viewMode === "table" ? "#3E8EF7" : "#E3F2FD",
              "&:hover": {
                bgcolor: viewMode === "table" ? "#1976d2" : "#BBDEFB",
              },
              width: isMobile ? "100%" : "none",
            }}
          >
            <GridViewIcon
              sx={{
                color: viewMode === "table" ? "white" : "#3E8EF7",
              }}
            />
          </Button>
        </ButtonGroup>
      ) : (
        <Box></Box>
      )}
    </Box>
  );
}
