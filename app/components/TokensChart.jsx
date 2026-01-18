"use client";

import React, { useMemo } from "react";
import { Box, useMediaQuery } from "@mui/material";
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

export default function TokensChart({
  data = [],
  subtitle = "สถิติ",
  title = "สถิติการใช้ Tokens รายวัน",
  height = 350,
  aiGraph = [],
  locale = "th", // ✅ รับ locale เข้ามา (th / en / th-TH / en-US)
}) {
  const t = useTranslations("TokensChart");
  const isMobile = useMediaQuery("(max-width:600px)");

  // formatter เดือนตามภาษา
  const monthFmt = useMemo(() => {
    const intlLocale = String(locale).startsWith("th") ? "th-TH" : "en-US";
    return new Intl.DateTimeFormat(intlLocale, { month: "short" }); // ม.ค. / Jan
  }, [locale]);

  // แปลง tick เช่น "30 Oct 2025" -> "30 ต.ค." หรือ "30 Oct"
  const formatDateLabel = (v, { showYear = false } = {}) => {
    if (typeof v !== "string") return v;

    // รองรับ "30 Oct 2025" หรือ "30 Oct"
    const m = v.match(/^(\d{1,2})\s+([A-Za-z]{3,})\s*(\d{4})?$/);
    if (!m) return v;

    const day = Number(m[1]);
    const engMonth = m[2].toLowerCase();
    const year = m[3] ? Number(m[3]) : null;

    const monthMap = {
      jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5,
      jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11,
    };

    const idx = monthMap[engMonth.slice(0, 3)];
    if (idx === undefined) return v;

    const localMonth = monthFmt.format(new Date(2020, idx, 1));

    if (showYear && year) return `${day} ${localMonth} ${year}`; // ✅ มีปี
    return `${day} ${localMonth}`; // ✅ ไม่มีปี
  };

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
      <ResponsiveContainer width="100%" height={height}>
        <LineChart data={data} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />

          <XAxis
            dataKey="date"
            tick={{ fontSize: 12 }}
            tickFormatter={(label) => formatDateLabel(label, { showYear: false })}
          />

          <YAxis tick={{ fontSize: 12 }} />

          <Tooltip
            contentStyle={{
              backgroundColor: "#1e1e2f",
              borderRadius: "6px",
              border: "none",
              color: "#fff",
            }}
            formatter={(value) => Number(value || 0).toLocaleString()}
            labelFormatter={(label) => formatDateLabel(label, { showYear: true })}
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
              dataKey={ai.model_type}
              name={ai.model_use_name}
              stroke={index === 0 ? "#22c55e" : "#3b82f6"}
              strokeWidth={2}
              dot={{ r: 5, fill: "#fff", strokeWidth: 2 }}
              activeDot={{ r: 6 }}
            />
          ))}

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
