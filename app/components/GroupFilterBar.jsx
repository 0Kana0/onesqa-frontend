"use client";

import React from "react";
import {
  Box,
  Typography,
  TextField,
  Select,
  MenuItem,
  InputAdornment,
  useMediaQuery,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import { useTranslations } from "next-intl";

export default function GroupFilterBar({
  search,
  setSearch,
  aiFilter,
  setAiFilter,
  setPage,
  modelOptions = [],
}) {
  const t = useTranslations("GroupFilterBar");

  const isMobile = useMediaQuery("(max-width:600px)");
  const isTablet = useMediaQuery("(max-width:900px)");

  return (
    <Box
      sx={{
        border: "1px solid #E5E7EB",
        boxShadow: "0 3px 8px rgba(0,0,0,0.04)",
        borderRadius: 4,
        p: isMobile ? 1.5 : 2,
        bgcolor: "background.paper",
        mb: 2,
      }}
    >
      <Typography variant="h6" fontWeight="bold" sx={{ mb: 1 }}>
        {t("title")} {/* เช่น "ตัวกรอง" */}
      </Typography>

      <Box
        sx={{
          display: "flex",
          flexDirection: isTablet ? "column" : "row",
          alignItems: isTablet ? "flex-start" : "center",
          gap: 2,
        }}
      >
        {/* 🔎 Search */}
        <TextField
          variant="outlined"
          placeholder={t("searchPlaceholder") /* เช่น "ค้นหากลุ่ม..." */}
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage?.(1);
          }}
          size="small"
          sx={{ width: isTablet ? "100%" : "none", flex: 1 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon color="action" />
              </InputAdornment>
            ),
          }}
        />

        {/* 🧠 Filter: model_use_name */}
        <Select
          value={aiFilter}
          onChange={(e) => {
            setAiFilter(e.target.value);
            setPage?.(1);
          }}
          size="small"
          sx={{ width: isTablet ? "100%" : "none", minWidth: isTablet ? "100%" : 220 }}
          displayEmpty
        >
          <MenuItem value="โมเดลทั้งหมด">
            {t("allModels") /* เช่น "โมเดลทั้งหมด" */}
          </MenuItem>

          {modelOptions.map((m, idx) => (
            <MenuItem key={idx} value={m}>
              {m}
            </MenuItem>
          ))}
        </Select>
      </Box>
    </Box>
  );
}
