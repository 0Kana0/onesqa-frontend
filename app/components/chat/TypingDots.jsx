// app/components/common/TypingDots.jsx
"use client";
import { Box, Avatar } from "@mui/material";
import SmartToyOutlinedIcon from "@mui/icons-material/SmartToyOutlined";
import { keyframes } from "@mui/system";

const blink = keyframes`
  0%, 80%, 100% { opacity: .25; transform: translateY(0); }
  40% { opacity: 1; transform: translateY(-3px); }
`;

export default function TypingDots({
  size = 8, // ขนาดจุด (px)
  color = "text.secondary", // สี
  gap = 0.6, // ระยะห่างสัมพันธ์กับ size
}) {
  const dotStyle = {
    width: size,
    height: size,
    borderRadius: "50%",
    bgcolor: color,
    animation: `${blink} 1.2s infinite`,
  };

  return (
    <Box sx={{
      display: "flex",
      gap: 1.5
    }}>
      <Avatar sx={{ bgcolor: "background.paper", color: "text.secondary" }}>
        <SmartToyOutlinedIcon />
      </Avatar>
      <Box
        sx={{
          display: "inline-flex",
          alignItems: "center",
          gap: `${size * gap}px`,
        }}
      >
        <Box sx={{ ...dotStyle, animationDelay: "0s" }} />
        <Box sx={{ ...dotStyle, animationDelay: "0.15s" }} />
        <Box sx={{ ...dotStyle, animationDelay: "0.30s" }} />
      </Box>
    </Box>
  );
}
