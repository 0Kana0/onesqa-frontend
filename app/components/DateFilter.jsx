"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  Stack,
  ToggleButton,
  ToggleButtonGroup,
  TextField,
  MenuItem,
  useMediaQuery,
} from "@mui/material";
import { useTranslations, useLocale } from "next-intl";

import LocalizedDatePicker from "./LocalizedDatePicker";

/**
 * value รูปแบบ:
 *  - { mode: "daily", date: Dayjs|null }
 *  - { mode: "monthly", month: 1..12, year: 2026 }
 *  - { mode: "yearly", year: 2026 }
 */
export function DataFilter({ 
  value, 
  onChange,
  dailyDate,
  setDailyDate,
  month,
  setMonth,
  year,
  setYear,
  now,
  years
}) {
  const tDatePicker = useTranslations("DatePicker");

  const isMobile = useMediaQuery("(max-width:600px)"); // < md คือจอเล็ก
  const isTablet = useMediaQuery("(max-width:1200px)"); // < md คือจอเล็ก

  // internal state (รองรับทั้ง controlled/uncontrolled)
  const [mode, setMode] = useState(value?.mode ?? "daily");

  const locale = useLocale();

  // ทำชื่อเดือนตามภาษา: th => มกราคม..., en => January...
  const monthOptions = useMemo(() => {
    const intlLocale = locale?.startsWith("th") ? "th-TH" : "en-US";
    const fmt = new Intl.DateTimeFormat(intlLocale, { month: "long" });

    return Array.from({ length: 12 }, (_, i) => ({
      value: i + 1,
      label: fmt.format(new Date(2020, i, 1)),
    }));
  }, [locale]);

  // sync เมื่อ parent ส่ง value ใหม่
  useEffect(() => {
    if (!value) return;

    setMode(value.mode);
    if (value.mode === "daily") setDailyDate(value.date);
    if (value.mode === "monthly") {
      setMonth(value.month);
      setYear(value.year);
    }
    if (value.mode === "yearly") setYear(value.year);
  }, [value]);

  const emit = useCallback(
    (nextMode, next = {}) => {
      const y = next.year ?? year ?? years[0];
      const m = next.month ?? month ?? now.month() + 1;
      const d = next.date ?? dailyDate ?? now;

      if (!onChange) return;

      if (nextMode === "daily") onChange({ mode: "daily", date: d });
      if (nextMode === "monthly")
        onChange({ mode: "monthly", month: m, year: y });
      if (nextMode === "yearly") onChange({ mode: "yearly", year: y });
    },
    [onChange, year, month, dailyDate, years, now]
  );

  const handleModeChange = (_, newMode) => {
    if (!newMode) return;
    setMode(newMode);

    if (newMode === "daily") {
      const d = dailyDate ?? now;
      setDailyDate(d);
      emit("daily", { date: d });
    } else if (newMode === "monthly") {
      const y = years.includes(year) ? year : years[0];
      const m = month || now.month() + 1;
      setYear(y);
      setMonth(m);
      emit("monthly", { year: y, month: m });
    } else {
      const y = years.includes(year) ? year : years[0];
      setYear(y);
      emit("yearly", { year: y });
    }
  };

  return (
    <>
      <ToggleButtonGroup
        exclusive
        value={mode}
        onChange={handleModeChange}
        size="large"
        fullWidth
        orientation={isMobile ? "vertical" : "horizontal"}
        sx={{
          width: "100%",
          "& .MuiToggleButtonGroup-grouped": {
            flex: isMobile ? "unset" : 1,
            width: isMobile ? "100%" : "auto",
            py: 1.2,
            fontWeight: 700,
          },
        }}
      >
        <ToggleButton value="daily">{tDatePicker("choosedate")}</ToggleButton>
        <ToggleButton value="monthly">{tDatePicker("chooseweek")}</ToggleButton>
        <ToggleButton value="yearly">{tDatePicker("choosemonth")}</ToggleButton>
      </ToggleButtonGroup>

      {mode === "daily" && (
        <LocalizedDatePicker
          label={tDatePicker("date")}
          value={dailyDate}
          onChange={(v) => {
            setDailyDate(v);
            emit("daily", { date: v }); // ✅ ทำให้รายวันอัปข้อมูล (เรียก onChange)
          }}
          textFieldProps={{
            size: "small",
          }}
        />
      )}

      {mode === "monthly" && (
        <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
          <TextField
            select
            fullWidth
            size="small"
            label={tDatePicker("month")}
            value={month}
            onChange={(e) => {
              const m = Number(e.target.value);
              setMonth(m);
              emit("monthly", { month: m });
            }}
          >
            {monthOptions.map((x) => (
              <MenuItem key={x.value} value={x.value}>
                {x.label}
              </MenuItem>
            ))}
          </TextField>

          <TextField
            select
            fullWidth
            size="small"
            label={tDatePicker("year")}
            value={year}
            onChange={(e) => {
              const y = Number(e.target.value);
              setYear(y);
              emit("monthly", { year: y });
            }}
          >
            {years.map((y) => (
              <MenuItem key={y} value={y}>
                {y}
              </MenuItem>
            ))}
          </TextField>
        </Stack>
      )}

      {mode === "yearly" && (
        <TextField
          select
          fullWidth
          size="small"
          label={tDatePicker("year")}
          value={year}
          onChange={(e) => {
            const y = Number(e.target.value);
            setYear(y);
            emit("yearly", { year: y });
          }}
        >
          {years.map((y) => (
            <MenuItem key={y} value={y}>
              {y}
            </MenuItem>
          ))}
        </TextField>
      )}
    </>
  );
}
