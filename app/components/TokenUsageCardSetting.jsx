import React, { useState } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  LinearProgress,
  Switch,
  TextField,
} from "@mui/material";

export default function TokenUsageCardSetting({
  title,
  used,
  total,
  today,
  average,
  enabled = false,
  onToggle = () => {},
  defaultLimit = 1000000,
}) {
  // ✅ เก็บค่า limit ใน state
  const [limit, setLimit] = useState(defaultLimit);
  const percent = Math.min((used / total) * 100, 100);

  return (
    <Card
      elevation={0}
      sx={{
        borderRadius: 3,
        border: "1px solid #e0e0e0",
        p: 2,
      }}
    >
      <Box display="flex" justifyContent="space-between" alignItems="center">
        <Typography variant="h6" fontWeight={700}>
          {title}
        </Typography>
        <Switch checked={enabled} onChange={onToggle} />
      </Box>

      <CardContent sx={{ p: 0, pt: 1 }}>
        {/* 🔹 ฟิลด์กรอกข้อมูล Tokens */}
        <Typography variant="subtitle2" color="text.secondary">
          กำหนด Tokens
        </Typography>
        <TextField
          type="number"
          fullWidth
          size="small"
          variant="outlined"
          value={limit}
          onChange={(e) => setLimit(Number(e.target.value))} // ✅ อัปเดต state
          sx={{
            mt: 0.5,
            mb: 1.5,
            "& .MuiInputBase-input": { textAlign: "right" },
          }}
        />

        {/* 🔹 แถบการใช้งาน */}
        <Box display="flex" justifyContent="space-between">
          <Typography variant="body2" fontWeight={600}>
            ใช้งานแล้ว
          </Typography>
          <Typography variant="body2">
            {Math.round(used / 1000000)}M / {Math.round(total / 1000000)}M Tokens
          </Typography>
        </Box>

        <LinearProgress
          variant="determinate"
          value={percent}
          sx={{
            height: 8,
            borderRadius: 5,
            my: 1,
            bgcolor: "#e3f2fd",
            "& .MuiLinearProgress-bar": { bgcolor: "#2196f3" },
          }}
        />

        {/* 🔹 วันนี้ / เฉลี่ยต่อวัน */}
        <Box display="flex" justifyContent="space-between">
          <Box>
            <Typography variant="body2" color="text.secondary">
              วันนี้
            </Typography>
            <Typography variant="body2" fontWeight={600}>
              {today.toLocaleString()} Tokens
            </Typography>
          </Box>

          <Box textAlign="right">
            <Typography variant="body2" color="text.secondary">
              เฉลี่ยต่อวัน
            </Typography>
            <Typography variant="body2" fontWeight={600}>
              {average.toLocaleString()} Tokens
            </Typography>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
}
