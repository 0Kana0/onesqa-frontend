import React from "react";
import {
  Card,
  CardContent,
  Typography,
  TextField,
  MenuItem,
  useMediaQuery,
  Stack,
  Divider,
  FormControlLabel,
  Switch,
} from "@mui/material";
import { useTranslations } from "next-intl";

export default function UserGroupSettingCard({
  roleName = "Admin",
  status = false,              // ✅ เพิ่ม

  // ✅ ข้อมูลใหม่: group default model + list ของ groupAis
  model = "",
  groupAis = [],
  modelOptions = [],

  // callbacks
  onGroupChange,     // (field, value) -> เปลี่ยนค่า group-level เช่น model_use_name
  onGroupAiChange,   // (index, field, value) -> เปลี่ยนค่าใน groupAis[index]
}) {
  const t = useTranslations("UserGroupSettingCard");
  const isMobile = useMediaQuery("(max-width:600px)");

  // เผื่อ status มาจาก DB เป็น 0/1
  const checked = status === true || status === 1;

  const toNumber = (v) => Number(v || 0);

  return (
    <Card
      elevation={0}
      sx={{
        border: "1px solid #e0e0e0",
        borderRadius: 3,
        p: isMobile ? 1.5 : 2,
      }}
    >
      {/* ✅ แถวเดียว: ชื่อกลุ่ม + Toggle */}
      <Stack direction="row" alignItems="center" justifyContent="space-between">
        <Typography variant="h6" fontWeight={700}>
          {roleName}
        </Typography>

        <FormControlLabel
          sx={{ m: 0 }}
          control={
            <Switch
              size="medium"
              checked={checked}
              onChange={(e) =>
                onGroupChange?.("status", e.target.checked ? true : false)
              }
            />
          }
        />
      </Stack>

      <CardContent sx={{ p: 0, mt: 1 }}>
        {/* ✅ Default Model (ของ Group) */}
        <Typography variant="subtitle2" color="text.secondary">
          {t("default")}
        </Typography>
        <TextField
          select
          fullWidth
          size="small"
          value={model}
          onChange={(e) => onGroupChange?.("model_use_name", e.target.value)}
          sx={{ mt: 0.5, mb: 2 }}
        >
          {modelOptions.map((option, index) => (
            <MenuItem key={index} value={option}>
              {option}
            </MenuItem>
          ))}
        </TextField>

        <Stack spacing={1.5}>
          {groupAis.map((aiRow, idx) => (
            <Card
              key={`${aiRow.ai_id || aiRow.model_use_name}-${idx}`}
              elevation={0}
              sx={{
                border: "1px solid #eee",
                borderRadius: 2,
                p: 1.5,
              }}
            >
              {/* Model */}
              <Typography variant="h6" fontWeight={700}>
                {aiRow.model_use_name}
              </Typography>

              {/* init_token */}
              <Typography variant="caption" color="text.secondary">
                {t("settoken")}
              </Typography>
              <TextField
                type="number"
                fullWidth
                size="small"
                value={aiRow.init_token ?? 0}
                onChange={(e) =>
                  onGroupAiChange?.(idx, "init_token", toNumber(e.target.value))
                }
                sx={{
                  mt: 0.5,
                  mb: 1.25,
                  "& .MuiInputBase-input": { textAlign: "right" },
                }}
              />

              {/* plus_token */}
              <Typography variant="caption" color="text.secondary">
                Token ที่ต้องการเพิ่ม
              </Typography>
              <TextField
                type="number"
                fullWidth
                size="small"
                value={aiRow.plus_token ?? 0}
                onChange={(e) =>
                  onGroupAiChange?.(idx, "plus_token", toNumber(e.target.value))
                }
                sx={{
                  mt: 0.5,
                  mb: 1.25,
                  "& .MuiInputBase-input": { textAlign: "right" },
                }}
              />

              {/* minus_token */}
              <Typography variant="caption" color="text.secondary">
                Token ที่ต้องการลด
              </Typography>
              <TextField
                type="number"
                fullWidth
                size="small"
                value={aiRow.minus_token ?? 0}
                onChange={(e) =>
                  onGroupAiChange?.(idx, "minus_token", toNumber(e.target.value))
                }
                sx={{
                  mt: 0.5,
                  "& .MuiInputBase-input": { textAlign: "right" },
                }}
              />
            </Card>
          ))}
        </Stack>
      </CardContent>
    </Card>
  );
}
