"use client";

import { Box, Typography } from "@mui/material";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import TrendingDownIcon from "@mui/icons-material/TrendingDown";
import { useTranslations } from 'next-intl';

export default function DashboardStatCard({
  title,
  value,
  percentChange,
  icon,
  bgColor = "#F6F7FE",
}) {
  const isPositive = percentChange >= 0;
  const t = useTranslations('DashboardStatCard');

  return (
    <Box
      sx={{
        bgcolor: bgColor,
        p: 3,
        borderRadius: 4,
        border: "1px solid #E5E7EB", // ✅ เส้นขอบสีเทาอ่อน
        boxShadow: "0 2px 6px rgba(0,0,0,0.03)",
        flex: 1,
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        minWidth: 250,
        transition: "all 0.25s ease-in-out",
        // "&:hover": {
        //   transform: "translateY(-4px)", // ✅ เด้งขึ้นเบา ๆ
        //   boxShadow: "0 6px 16px rgba(0,0,0,0.08)", // ✅ เงาชัดขึ้น
        // },
      }}
    >
      {/* 🔹 Title */}
      <Typography variant="subtitle1" fontWeight="bold">
        {title}
      </Typography>

      {/* 🔹 Value + Icon */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mt: 1,
        }}
      >
        <Typography variant="h5" fontWeight="bold">
          {value}
        </Typography>
        <Box sx={{ color: "#3E8EF7" }}>{icon}</Box>
      </Box>

      {/* 🔹 Percent Change */}
      <Box sx={{ display: "flex", alignItems: "center", mt: 1 }}>
        {isPositive ? (
          <TrendingUpIcon fontSize="small" sx={{ color: "green", mr: 0.5 }} />
        ) : (
          <TrendingDownIcon fontSize="small" sx={{ color: "red", mr: 0.5 }} />
        )}

        <Typography variant="body2">
          <Typography
            component="span"
            sx={{
              color: isPositive ? "green" : "red",
              fontWeight: 500,
            }}
          >
            {isPositive ? "+" : ""}
            {percentChange}%
          </Typography>{" "}
          {t('title1')}
        </Typography>
      </Box>
    </Box>
  );
}
