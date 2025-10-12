"use client";

import { Box, Typography } from "@mui/material";
import { useTranslations } from 'next-intl';

export default function Footer() {
  const t = useTranslations('Footer');

    // วันที่ปัจจุบัน 
  const now = new Date();
  // เเสดงเวลาตามประเทศไทย 
  const thaiTime = now.toLocaleString("sv-SE", { timeZone: "Asia/Bangkok" }).replace(" ", "T");
  const year = new Date(thaiTime).getFullYear();

  return (
    <Box
      component="footer"
      sx={{
        py: 2,
        textAlign: "center",
        bgcolor: "background.paper",
        borderColor: "divider",
        mt: "auto",
      }}
    >
      <Typography variant="body2">
        {t('title1')} {year+543} {t('title2')}
      </Typography>
    </Box>
  );
}
