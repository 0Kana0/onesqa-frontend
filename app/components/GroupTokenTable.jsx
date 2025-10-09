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

export default function GroupTokenTable({
  rows = [],
  modelOptions = [],
  onChange = () => {},
}) {
  const renderProgress = (usage) => {
    const percent = (usage.used / usage.total) * 100;
    return (
      <Box>
        <Typography variant="body2" fontWeight={600}>
          {usage.used / 1000000}M / {usage.total / 1000000}M Tokens
        </Typography>
        <LinearProgress
          variant="determinate"
          value={percent}
          sx={{
            mt: 0.5,
            height: 8,
            borderRadius: 5,
            bgcolor: "#e3f2fd",
            "& .MuiLinearProgress-bar": { bgcolor: "#2196f3" },
          }}
        />
      </Box>
    );
  };

  return (
    <Paper
      elevation={0}
      sx={{
        p: 2,
        borderRadius: 3,
        border: "1px solid #e0e0e0",
        overflowX: "auto",
      }}
    >
      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 600 }}>กลุ่มงาน</TableCell>
              <TableCell sx={{ fontWeight: 600, width: 180 }}>
                Tokens
                <Typography variant="body2" color="text.secondary">
                  กำหนด Tokens ให้ผู้ใช้งาน
                </Typography>
              </TableCell>
              <TableCell sx={{ fontWeight: 600, width: 200 }}>
                โมเดลเริ่มต้น
                <Typography variant="body2" color="text.secondary">
                  กำหนดโมเดลเริ่มต้นให้ผู้ใช้งาน
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

                {/* Tokens */}
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

                {/* Default Model */}
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

                {/* แสดง progress ของแต่ละ model */}
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
