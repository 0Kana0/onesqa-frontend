"use client";

import React, { useMemo } from "react";
import { Box, useMediaQuery } from "@mui/material";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from "recharts";
import dayjs from "dayjs";
import "dayjs/locale/th";

import { useTranslations } from "next-intl";

/**
 * events ตัวอย่าง:
 *  - เส้นเดียว:
 *    [{ ts: "2026-01-08T10:15:00+07:00", value: 12 }, ...]
 *  - หลายเส้นตาม aiGraph:
 *    [{ ts: "...", model_type: "gpt", value: 10 }, { ts: "...", model_type: "gemini", value: 5 }]
 *
 * period:
 *  - { mode: "daily", date: dayjs() }
 *  - { mode: "monthly", month: 1..12, year: 2026 }
 *  - { mode: "yearly", year: 2026 }
 */

function pad2(n) {
  return String(n).padStart(2, "0");
}

/** ---------- Buckets แกน X ---------- */
function buildDailyBuckets() {
  // 00:00 - 23:00
  return Array.from({ length: 24 }, (_, h) => ({
    key: `H${h}`,
    label: `${pad2(h)}:00`, // ✅ เปลี่ยนจาก .00 เป็น :00
    hour: h,
  }));
}

function buildMonthlyWeekBuckets(year, month /* 1..12 */) {
  const daysInMonth = dayjs(`${year}-${pad2(month)}-01`).daysInMonth();
  const buckets = [];
  let weekIndex = 1;

  for (let start = 1; start <= daysInMonth; start += 7) {
    const end = Math.min(start + 6, daysInMonth);
    buckets.push({
      key: `W${weekIndex}`,
      label: `${pad2(start)}–${pad2(end)}`, // 01–07, 08–14, ...
      startDay: start,
      endDay: end,
      weekIndex,
    });
    weekIndex += 1;
  }
  return buckets;
}

function buildYearlyMonthBuckets(locale) {
  const intlLocale = locale?.startsWith("th") ? "th-TH" : "en-US";
  const fmt = new Intl.DateTimeFormat(intlLocale, { month: "short" }); // Jan / ม.ค.
  return Array.from({ length: 12 }, (_, i) => ({
    key: `M${i + 1}`,
    label: fmt.format(new Date(2020, i, 1)),
    month: i + 1,
  }));
}

/** ---------- Aggregate to chart data ---------- */
function aggregateToChartData({ period, events, locale, aiGraph }) {
  if (!period) return [];

  let buckets = [];
  if (period.mode === "daily") buckets = buildDailyBuckets();
  else if (period.mode === "monthly")
    buckets = buildMonthlyWeekBuckets(period.year, period.month);
  else if (period.mode === "yearly") buckets = buildYearlyMonthBuckets(locale);

  const seriesKeys = Array.isArray(aiGraph)
    ? aiGraph.map((a) => a.model_type)
    : [];

  // init rows ให้ครบทุก bucket
  const rows = buckets.map((b) => {
    const base = { key: b.key, label: b.label, total: 0 };
    // ถ้ามี aiGraph → เตรียม key ของแต่ละ model เป็น 0
    for (const k of seriesKeys) base[k] = 0;
    return base;
  });

  const rowByKey = new Map(rows.map((r) => [r.key, r]));

  for (const ev of events || []) {
    if (!ev?.ts) continue;

    const t = dayjs(ev.ts);
    const v = Number(ev.value ?? 0) || 0;

    // หา bucketKey ตาม mode
    let bucketKey = null;

    if (period.mode === "daily") {
      if (!period.date) continue;
      if (!t.isSame(period.date, "day")) continue;
      bucketKey = `H${t.hour()}`;
    }

    if (period.mode === "monthly") {
      const sameMonth =
        t.year() === Number(period.year) &&
        t.month() + 1 === Number(period.month);
      if (!sameMonth) continue;

      const day = t.date(); // 1..31
      const weekIndex = Math.floor((day - 1) / 7) + 1; // 1..5
      bucketKey = `W${weekIndex}`;
    }

    if (period.mode === "yearly") {
      if (t.year() !== Number(period.year)) continue;
      bucketKey = `M${t.month() + 1}`; // 1..12
    }

    const row = rowByKey.get(bucketKey);
    if (!row) continue;

    // รวม total
    row.total += v;

    // ถ้ามี aiGraph → รวมตาม model ด้วย
    if (seriesKeys.length > 0) {
      const k = ev.model_type ?? ev.model; // รองรับ 2 ชื่อ
      if (k && Object.prototype.hasOwnProperty.call(row, k)) {
        row[k] += v;
      }
    }
  }

  return rows;
}

export default function PeriodReportChart({
  type = "model",
  period,
  events = [],
  locale,
  height = 350,
  aiGraph = [], // [{ model_type, model_use_name }]
}) {
  const t = useTranslations("PeriodReportChart");

  const isMobile = useMediaQuery("(max-width:600px)");

  const data = useMemo(() => {
    return aggregateToChartData({ period, events, locale, aiGraph });
  }, [period, events, locale, aiGraph]);

  const rotate = period?.mode === "daily" ? -45 : 0;

  // สีเส้นแบบเรียง index (คุมให้สวยและอ่านง่าย)
  const strokes = [
    "#22c55e",
    "#3b82f6",
    "#f59e0b",
    "#ef4444",
    "#14b8a6",
    "#8b5cf6",
  ];

  return (
    <Box
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
        <LineChart
          data={data}
          margin={{ top: 20, right: 30, left: 0, bottom: rotate ? 18 : 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />

          <XAxis
            dataKey="label"
            interval={0}
            angle={rotate}
            textAnchor={rotate ? "end" : "middle"}
            height={rotate ? 46 : 30}
            tick={{ fontSize: 12 }}
          />

          <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />

          <Tooltip
            contentStyle={{
              backgroundColor: "#1e1e2f",
              borderRadius: "6px",
              border: "none",
              color: "#fff",
            }}
            formatter={(value) => Number(value || 0).toLocaleString()}
            labelFormatter={(label) => label}
          />

          {!isMobile && (
            <Legend
              verticalAlign="top"
              align="right"
              iconType="circle"
              wrapperStyle={{ fontSize: 12, marginBottom: 10 }}
            />
          )}

          {/* ถ้ามี aiGraph: วาดหลายเส้นตาม model_type */}
          {/* ถ้ามี aiGraph: วาดหลายเส้นตาม model_type */}
          {Array.isArray(aiGraph) && aiGraph.length > 0 ? (
            <>
              {aiGraph.map((ai, index) => (
                <Line
                  key={ai.model_type}
                  type="monotone"
                  dataKey={ai.model_type}
                  name={ai.model_use_name}
                  stroke={strokes[index % strokes.length]}
                  strokeWidth={2}
                  dot={{ r: 4, fill: "#fff", strokeWidth: 2 }}
                  activeDot={{ r: 6 }}
                />
              ))}

              {/* total (all) */}
              {type !== "user" && (
                <Line
                  type="monotone"
                  dataKey="total"
                  name={t("all")}
                  stroke="#c084fc"
                  strokeWidth={2}
                  dot={{ r: 4, fill: "#fff", strokeWidth: 2 }}
                  activeDot={{ r: 6 }}
                />
              )}
            </>
          ) : (
            // ถ้าไม่มี aiGraph: วาดเส้นเดียว total (แต่ถ้า type=user ก็ไม่ต้องแสดง)
            type !== "user" && (
              <Line
                type="monotone"
                dataKey="total"
                name={t("all")}
                stroke="#3b82f6"
                strokeWidth={2}
                dot={{ r: 4, fill: "#fff", strokeWidth: 2 }}
                activeDot={{ r: 6 }}
              />
            )
          )}
        </LineChart>
      </ResponsiveContainer>
    </Box>
  );
}
