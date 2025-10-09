import React, { useState } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  MenuItem,
} from "@mui/material";

export default function UserGroupSettingCard({
  roleName = "Admin",
  defaultLimit = 1000000,
  modelOptions = ["Gemini 2.5 Pro", "ChatGPT 4o"],
  defaultModel = "Gemini 2.5 Pro",
  onChange,
}) {
  const [limit, setLimit] = useState(defaultLimit);
  const [model, setModel] = useState(defaultModel);

  // ✅ แจ้งกลับไปยัง parent (optional)
  const handleChange = (field, value) => {
    if (onChange) onChange(field, value);
  };

  return (
    <Card
      elevation={0}
      sx={{
        border: "1px solid #e0e0e0",
        borderRadius: 3,
        p: 2,
      }}
    >
      <Typography variant="h6" fontWeight={700}>
        {roleName}
      </Typography>

      <CardContent sx={{ p: 0, mt: 1 }}>
        {/* 🔹 จำนวน Tokens */}
        <Typography variant="subtitle2" color="text.secondary">
          กำหนด Tokens ให้ผู้ใช้งาน
        </Typography>
        <TextField
          type="number"
          fullWidth
          size="small"
          variant="outlined"
          value={limit}
          onChange={(e) => {
            const value = Number(e.target.value);
            setLimit(value);
            handleChange("limit", value);
          }}
          sx={{
            mt: 0.5,
            mb: 2,
            "& .MuiInputBase-input": { textAlign: "right" },
          }}
        />

        {/* 🔹 Default Model */}
        <Typography variant="subtitle2" color="text.secondary">
          กำหนด Default Model
        </Typography>
        <TextField
          select
          fullWidth
          size="small"
          value={model}
          onChange={(e) => {
            setModel(e.target.value);
            handleChange("model", e.target.value);
          }}
        >
          {modelOptions.map((option, index) => (
            <MenuItem key={index} value={option}>
              {option}
            </MenuItem>
          ))}
        </TextField>
      </CardContent>
    </Card>
  );
}
