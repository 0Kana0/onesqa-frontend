// components/PromptList.jsx
"use client";

import React from "react";
import { Box, Stack, ButtonBase, Typography } from "@mui/material";

const PromptList = ({ 
  steps = [], 
  activeIndex = 0, 
  onChange,
  onTextChange 
}) => {
  console.log(steps);
  
  return (
    <Stack 
      direction="row"
      spacing={2}
      sx={{
        flexWrap: "wrap",      // 👈 ให้ห่อขึ้นบรรทัดใหม่
        width: "100%",         // 👈 จำกัดให้กว้างไม่เกินกล่อง
        justifyContent: "center", // หรือ "flex-start" ตามที่อยากให้เรียง
      }}
    >
      {steps.map((step, index) => {
        const selected = index === activeIndex;

        return (
          <ButtonBase
            key={step.id || index}
            onClick={() => {
              onChange && onChange(index);                    // หรือ onChange?.(index)
              onTextChange && onTextChange(step.prompt_detail); // หรือ onTextChange?.(...)
            }}
            sx={{
              borderRadius: 2,
              border: "1px solid",
              borderColor: "primary.main",
              bgcolor: selected ? "primary.main" : "background.paper",
              px: 2,
              py: 0.5,
              display: "flex",
              alignItems: "center",
              mb: 1, // เผื่อระยะห่างระหว่างบรรทัด
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
