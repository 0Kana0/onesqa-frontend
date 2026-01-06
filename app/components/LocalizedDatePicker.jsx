"use client";

import React, { useMemo } from "react";
import dayjs from "dayjs";
import buddhistEra from "dayjs/plugin/buddhistEra";
import "dayjs/locale/en";
import "dayjs/locale/th";

import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { enUS } from "@mui/x-date-pickers/locales";
import { useLanguage } from "@/app/context/LanguageContext";

// ✅ เปิดใช้ Buddhist Era (พ.ศ.)
dayjs.extend(buddhistEra);

// ✅ Thai localeText (เริ่มจาก en แล้ว override เฉพาะคำที่อยากแปล)
const thLocaleText = {
  ...enUS.components.MuiLocalizationProvider.defaultProps.localeText,
  cancelButtonLabel: "ยกเลิก",
  okButtonLabel: "ตกลง",
  clearButtonLabel: "ล้าง",
  todayButtonLabel: "วันนี้",
};

// แปลง format ที่ใช้ YYYY -> BBBB เฉพาะการ “แสดงผล” ปีแบบ พ.ศ.
const toThaiDisplayFormat = (fmt) => {
  if (!fmt) return fmt;
  if (fmt.includes("BBBB")) return fmt;
  return fmt.replace(/Y{4}/g, "BBBB"); // YYYY -> BBBB
};

export default function LocalizedDatePicker({
  label,
  value, // string: "YYYY-MM-DD" (แนะนำให้เก็บเป็น ค.ศ. เหมือนเดิม)
  onChange, // (v: string) => void
  valueFormat = "YYYY-MM-DD",
  displayFormat = "DD/MM/YYYY",
  textFieldProps = {},
  ...pickerProps
}) {
  const { locale } = useLanguage();

  const { localeText, adapterLocale, dateFormats, effectiveDisplayFormat } =
    useMemo(() => {
      if (locale === "th") {
        return {
          localeText: thLocaleText,
          adapterLocale: "th",
          // ✅ ทำให้ “ปี” ใน header + year view แสดงเป็น พ.ศ.
          //dateFormats: { year: "BBBB" },
          // ✅ ทำให้ input แสดงปีเป็น พ.ศ.
          //effectiveDisplayFormat: toThaiDisplayFormat(displayFormat),
          effectiveDisplayFormat: displayFormat,
        };
      }

      return {
        localeText: enUS.components.MuiLocalizationProvider.defaultProps.localeText,
        adapterLocale: "en",
        dateFormats: undefined,
        effectiveDisplayFormat: displayFormat,
      };
    }, [locale, displayFormat]);

  return (
    <LocalizationProvider
      dateAdapter={AdapterDayjs}
      adapterLocale={adapterLocale}
      localeText={localeText}
      dateFormats={dateFormats}
    >
      <DatePicker
        label={label}
        format={effectiveDisplayFormat}
        value={value ? dayjs(value, valueFormat) : null}
        onChange={(d) => onChange?.(d ? d.format(valueFormat) : "")}
        slotProps={{ 
          textField: { ...textFieldProps } 
        }}
        {...pickerProps}
      />
    </LocalizationProvider>
  );
}
