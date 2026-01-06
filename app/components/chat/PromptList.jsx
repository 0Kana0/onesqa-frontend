// components/PromptList.jsx
"use client";

import React, { useEffect } from "react";
import { Box, Stack, ButtonBase, Typography } from "@mui/material";
import { useLanguage } from "@/app/context/LanguageContext";

const PromptList = ({
  steps = [],
  activeIndex = null,
  onChange,
  onTextChange,
}) => {
  const { locale } = useLanguage();

  // ✅ reset เมื่อเปลี่ยนภาษา
  useEffect(() => {
    onChange?.(null);
    onTextChange?.("");
  }, [locale]);

  return (
    <Stack
      direction="row"
      spacing={2}
      sx={{
        flexWrap: "wrap",
        width: "100%",
        justifyContent: "center",
      }}
    >
      {steps.map((step, index) => {
        const selected = index === activeIndex;

        const handleClick = () => {
          if (selected) {
            // กดซ้ำ → reset
            onChange?.(null);
            onTextChange?.("");
          } else {
            // เลือกใหม่
            onChange?.(index);
            onTextChange?.(step.prompt_detail);
          }
        };

        return (
          <ButtonBase
            key={step.id || index}
            onClick={handleClick}
            sx={{
              borderRadius: 2,
              border: "1px solid",
              borderColor: "primary.main",
              bgcolor: selected ? "primary.main" : "background.paper",
              px: 2,
              py: 0.5,
              display: "flex",
              alignItems: "center",
              mb: 1,
            }}
          >
            {/* วงกลมตัวเลข */}
            <Box
              sx={{
                width: 28,
                height: 28,
                borderRadius: "50%",
                border: "1px solid",
                borderColor: selected ? "#fff" : "background.text",
                bgcolor: selected ? "#fff" : "background.paper",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                mr: 1,
              }}
            >
              <Typography
                variant="body2"
                sx={{
                  fontWeight: 600,
                  color: selected ? "primary.main" : "background.text",
                }}
              >
                {index + 1}
              </Typography>
            </Box>

            {/* ข้อความ */}
            <Typography
              variant="body2"
              sx={{
                whiteSpace: "nowrap",
                color: selected ? "#fff" : "background.text",
              }}
            >
              {step.prompt_title}
            </Typography>
          </ButtonBase>
        );
      })}
    </Stack>
  );
};

export default PromptList;
