"use client";

import React from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  LinearProgress,
  Divider,
  useMediaQuery,
} from "@mui/material";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";
import { useTranslations } from "next-intl";

/**
 * TokensChart Component
 * @param {Array} data - [{ date: '1 Oct', gpt: 900, gemini: 1800, total: 2700 }, ...]
 * @param {string} title - ชื่อกราฟ
 * @param {number} height - ความสูงของกราฟ (ค่าเริ่มต้น 350)
 */
export default function TokensChart({
  data = [],
  subtitle = "สถิติ",
  title = "สถิติการใช้ Tokens รายวัน",
  height = 350,
  aiGraph = [],
}) {
  const t = useTranslations("TokensChart");
  const isMobile = useMediaQuery("(max-width:600px)"); // < md คือจอเล็ก

  // ด้านบนไฟล์
  const trimYear = (v) =>
    typeof v === "string" ? v.replace(/\s+\d{4}$/, "") : v;

  return (
    <Box
      elevation={3}
      sx={{
        border: "1px solid #E5E7EB",
        borderRadius: 3,
        p: 3,
        mb: 2,
        boxShadow: "0 3px 8px rgba(0,0,0,0.04)",
        bgcolor: "background.paper",
      }}
    >
      <Typography variant="body2" color="text.secondary" gutterBottom>
        {subtitle}
      </Typography>
      <Typography variant="h6" sx={{ fontWeight: "bold" }}>
        {title}
      </Typography>
      <ResponsiveContainer width="100%" height={height}>
        <LineChart
          data={data}
          margin={{ top: 20, right: 30, left: 0, bottom: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 12 }}
            tickFormatter={trimYear}
          />
          <YAxis tick={{ fontSize: 12 }} />
          <Tooltip
            contentStyle={{
              backgroundColor: "#1e1e2f",
              borderRadius: "6px",
              border: "none",
              color: "#fff",
            }}
            formatter={(value) => value.toLocaleString()}
          />
          {!isMobile && (
            <Legend
              verticalAlign="top"
              align="right"
              iconType="circle"
              wrapperStyle={{ fontSize: 12, marginBottom: 10 }}
            />
          )}
          {aiGraph?.map((ai, index) => (
            <Line
              key={ai.model_type}
              type="monotone"
              dataKey={ai.model_type}        // 👈 model_type
              name={ai.model_use_name}       // 👈 model_use_name
              stroke={index === 0 ? "#22c55e" : "#3b82f6"} // หรือใช้ map สี
              strokeWidth={2}
              dot={{ r: 5, fill: "#fff", strokeWidth: 2 }}
              activeDot={{ r: 6 }}
            />
          ))}
          {/* เส้น 3: รวม */}
          <Line
            type="monotone"
            dataKey="total"
            name={t("all")}
            stroke="#c084fc"
            strokeWidth={2}
            dot={{ r: 5, fill: "#fff", strokeWidth: 2 }}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </Box>
  );
}
