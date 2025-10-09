"use client";

import { Box, Typography, Chip } from "@mui/material";

export default function SystemStatusCard({
  title = "สถานะระบบ",
  subtitle = "ติดตามการใช้งานระบบ",
  items = [
    { label: "API Connection", status: "ปกติ" },
    { label: "Database", status: "ปกติ" },
    { label: "AI Service", status: "ปกติ" },
    { label: "SSL Certificate", status: "ปกติ" },
  ],
}) {
  // ฟังก์ชันสำหรับคืนค่าสีของสถานะ
  const getStatusColor = (status) => {
    switch (status) {
      case "ปกติ":
        return { bgcolor: "#2E7D32", color: "white" }; // เขียว
      case "ผิดพลาด":
        return { bgcolor: "#D32F2F", color: "white" }; // แดง
      case "เตือน":
        return { bgcolor: "#F9A825", color: "black" }; // เหลือง
      default:
        return { bgcolor: "#BDBDBD", color: "black" }; // เทา
    }
  };

  return (
    <Box>
      {/* หัวข้อ */}
      <Typography variant="h6" fontWeight="bold" gutterBottom>
        {title}
      </Typography>
      <Typography variant="body2" color="text.secondary" gutterBottom>
        {subtitle}
      </Typography>

      {/* รายการสถานะ */}
      {items.map((item, index) => (
        <Box
          key={index}
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            py: 1,
          }}
        >
          <Typography variant="body1">{item.label}</Typography>
          <Chip
            label={item.status}
            size="small"
            sx={{
              fontWeight: "bold",
              borderRadius: "16px",
              px: 1,
              ...getStatusColor(item.status),
            }}
          />
        </Box>
      ))}
    </Box>
  );
}
