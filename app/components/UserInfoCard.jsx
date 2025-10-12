"use client";

import React from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Chip,
  Divider,
  Stack,
} from "@mui/material";
import StarIcon from "@mui/icons-material/Star";
import { useTranslations } from 'next-intl';

export default function UserInfoCard({ user }) {
  const t = useTranslations('UserInfoCard');
  if (!user) return null;

  return (
    <Box
      sx={{
        borderRadius: 3,
        p: 2,
        boxShadow: "0 3px 10px rgba(0,0,0,0.08)",
        bgcolor: "background.paper",
        width: "100%",
      }}
    >
      {/* 🔹 ส่วนหัว */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          border: "1px solid #E5E7EB",
          boxShadow: "0 3px 8px rgba(0,0,0,0.04)",
          borderRadius: 4,
          p: 2,
          mb: 2,
          bgcolor: "background.paper"
        }}
      >
        <Box>
          <Typography variant="subtitle1" fontWeight="bold">
            {t('usage')}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            ผู้ใช้งานอันดับต้น
          </Typography>
        </Box>
        <StarIcon sx={{ color: "#3E8EF7" }} />
      </Box>

      {/* 🔹 รายละเอียดผู้ใช้ */}
      <Card
        variant="outlined"
        sx={{
          mb: 2,
          border: "1px solid #E5E7EB",
          boxShadow: "0 3px 8px rgba(0,0,0,0.04)",
          borderRadius: 4,
          p: 2,
        }}
      >
        <Typography variant="subtitle1" fontWeight="bold">
          {t('username')}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {user.id || "-"}
        </Typography>
        <Typography variant="subtitle1" fontWeight="bold">
          {t('name')}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {user.name || "-"}
        </Typography>
        <Typography variant="subtitle1" fontWeight="bold">
          {t('position')}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {user.position || "-"}
        </Typography>
        <Typography variant="subtitle1" fontWeight="bold">
          {t('email')}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {user.email || "-"}
        </Typography>
        <Typography variant="subtitle1" fontWeight="bold">
          {t('phone')}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {user.phone || "-"}
        </Typography>
      </Card>

      {/* 🔹 สถานะ + สิทธิ์ */}
      <Box
        sx={{
          display: "flex",
          flexDirection: "column", // ✅ เรียงในแนวตั้ง
          justifyContent: "space-between",
          gap: 2,
          border: "1px solid #E5E7EB",
          boxShadow: "0 3px 8px rgba(0,0,0,0.04)",
          borderRadius: 4,
          p: 2,
          bgcolor: "background.paper"
        }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Typography variant="body2" sx={{ mb: 0.5 }}>
            {t('status')}:
          </Typography>
          <Chip
            label={user.status === "active" ? "ใช้งานอยู่" : "ไม่ใช้งาน"}
            size="small"
            sx={{
              bgcolor: user.status === "active" ? "#E8F5E9" : "#F5F5F5",
              color: user.status === "active" ? "#2E7D32" : "#757575",
              fontWeight: 500,
            }}
          />
        </Box>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Typography variant="body2" sx={{ mb: 0.5 }}>
            {t('permissions')}:
          </Typography>
          <Chip
            label={user.role || "-"}
            size="small"
            sx={{
              bgcolor: "#ECEFF1",
              color: "#37474F",
              fontWeight: 500,
            }}
          />
        </Box>
      </Box>
    </Box>
  );
}
