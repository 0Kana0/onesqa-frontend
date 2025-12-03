"use client";

import { Box, Typography, Button, useMediaQuery } from "@mui/material";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import { useTranslations } from 'next-intl';

export default function AlertCard({
  title = "แจ้งเตือนการใช้งาน Token",
  message = "การใช้งาน Token อยู่ที่ 75% กรุณาติดตามการใช้งานอย่างใกล้ชิด",
  onDetailClick = () => {},
}) {
  const t = useTranslations('AlertCard');
  const isMobile = useMediaQuery("(max-width:600px)"); // < md คือจอเล็ก
  
  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: isMobile ? "column" : "row", // ✅ สลับแนวตามจอ
        alignItems: isMobile ? "flex-start" : "center",
        justifyContent: "space-between",
        bgcolor: "primary.alert",
        border: "1px solid #FFCC80",
        borderRadius: 2,
        p: 2,
        gap: isMobile ? 2 : 0,
        color: "#E65100",
      }}
    >
      {/* ฝั่งซ้าย: ไอคอน + ข้อความ */}
      <Box sx={{ 
        display: "flex", 
        alignItems: "center", 
        gap: 2,
      }}>
        <WarningAmberIcon sx={{ fontSize: 28, color: "#FB8C00" }} />
        <Box>
          <Typography variant="subtitle1" fontWeight="bold" color="inherit" sx={{ color: "background.text" }}>
            {title}
          </Typography>
          <Typography variant="body2" sx={{ color: "#F57C00" }}>
            {message}
          </Typography>
        </Box>
      </Box>

      {/* ปุ่มขวา */}
      {/* <Button
        variant="outlined"
        size="small"
        onClick={onDetailClick}
        sx={{
          width: isMobile ? "100%" : "none",
          borderColor: "#FB8C00",
          color: "#FB8C00",
          textWrap: "nowrap",
          "&:hover": {
            bgcolor: "#FFF3E0",
            borderColor: "#EF6C00",
          },
        }}
      >
        {t('button1')}
      </Button> */}
    </Box>
  );
}
