// components/FullScreenLoading.jsx
"use client";

import { Box, CircularProgress, Typography } from "@mui/material";

const FullScreenLoading = ({ text = "กำลังเข้าสู่ระบบ" }) => {
  return (
    <Box
      sx={{
        position: "fixed",
        inset: 0,
        bgcolor: "primary.main", // 🔵 ฟ้า (MUI primary)
        zIndex: 2000,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <CircularProgress size={60} sx={{ color: "#fff" }} />
      <Typography
        sx={{ color: "#fff", mt: 2, fontWeight: 500 }}
      >
        {text}
      </Typography>
    </Box>
  );
};

export default FullScreenLoading;
