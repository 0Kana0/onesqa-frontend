"use client";

import React from "react";
import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  MenuItem,
  LinearProgress,
  Paper,
  Typography,
} from "@mui/material";
import { useTranslations } from "next-intl";

export default function GroupTokenTable({
  rows = [],
  modelOptions = [],
  onChange = () => {},
}) {
  const t = useTranslations('GroupTokenTable');
  // 🔹 ฟังก์ชันเรนเดอร์แถบความคืบหน้า
  const renderProgress = (usage) => {
    const percent = Math.min((usage.used / usage.total) * 100, 100);

    // ✅ กำหนดสีตามระดับการใช้งาน
    let progressColor = "#3E8EF7"; // 🔵 ปกติ
    if (percent >= 70 && percent <= 85) {
      progressColor = "#FFA726"; // 🟠 เตือน
    } else if (percent > 85) {
      progressColor = "#E53935"; // 🔴 เตือนมาก
    }

    return (
      <Box>
        <Typography variant="body2" fontWeight={600}>
          {usage.used / 1_000_000}M / {usage.total / 1_000_000}M Tokens
        </Typography>
        <LinearProgress
          variant="determinate"
          value={percent}
          sx={{
            mt: 0.5,
            height: 8,
            borderRadius: 5,
            bgcolor: "#e3f2fd",
            "& .MuiLinearProgress-bar": { bgcolor: progressColor },
          }}
        />
      </Box>
    );
  };

  // 🔹 ส่วนของตาราง
  return (
    <Paper
      elevation={0}
      sx={{
        p: 2,
        overflowX: "auto",
      }}
    >
      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 600 }}>{t('tablecell1')}</TableCell>
              <TableCell sx={{ fontWeight: 600, width: 180 }}>
                {t('tablecell2')}
                <Typography variant="body2" color="text.secondary">
                  {t('tablecell2sub')}
                </Typography>
              </TableCell>
              <TableCell sx={{ fontWeight: 600, width: 200 }}>
                {t('tablecell3')}
                <Typography variant="body2" color="text.secondary">
                  {t('tablecell3sub')}
                </Typography>
              </TableCell>
              {modelOptions.map((model) => (
                <TableCell key={model} sx={{ fontWeight: 600, width: 220 }}>
                  {model}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>

          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.id}>
                <TableCell>
                  <Typography fontWeight={600}>{row.group}</Typography>
                </TableCell>

                {/* 🔸 Tokens */}
                <TableCell>
                  <TextField
                    type="number"
                    size="small"
                    value={row.tokens}
                    onChange={(e) =>
                      onChange(row.id, "tokens", Number(e.target.value))
                    }
                    fullWidth
                    sx={{
                      "& .MuiInputBase-input": { textAlign: "right" },
                    }}
                  />
                </TableCell>

                {/* 🔸 Default Model */}
                <TableCell>
                  <TextField
                    select
                    size="small"
                    value={row.model}
                    onChange={(e) =>
                      onChange(row.id, "model", e.target.value)
                    }
                    fullWidth
                  >
                    {modelOptions.map((option, i) => (
                      <MenuItem key={i} value={option}>
                        {option}
                      </MenuItem>
                    ))}
                  </TextField>
                </TableCell>

                {/* 🔸 Progress ของแต่ละโมเดล */}
                {modelOptions.map((model) => (
                  <TableCell key={model}>
                    {row.models?.[model]
                      ? renderProgress(row.models[model])
                      : "-"}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  );
}
