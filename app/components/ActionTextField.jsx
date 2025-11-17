"use client";

import React from "react";
import {
  Paper,
  InputBase,
  IconButton,
  Stack,
  Tooltip,
  alpha,
} from "@mui/material";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
// ลบ EditRoundedIcon ทิ้งได้เพราะไม่ได้ใช้
// import EditRoundedIcon from "@mui/icons-material/EditRounded";

/**
 * ActionTextField – ช่องกรอกหัวข้อ + รายละเอียด พร้อมปุ่มแอ็กชันด้านขวา
 *
 * props:
 * - titleValue?: string
 * - onTitleChange?: (value: string) => void
 * - titlePlaceholder?: string
 *
 * - detailValue?: string
 * - onDetailChange?: (value: string) => void
 * - detailPlaceholder?: string
 * - detailMinRows?: number (default: 3)
 *
 * - onDelete?: () => void
 * - endActions?: React.ReactNode
 * - disabled?: boolean
 * - sx?: object
 *
 * ✅ Backward compatible:
 * - ถ้าส่ง value/onChange แบบเดิม (ของ title) จะยังทำงาน:
 *   - value -> ใช้เป็น titleValue
 *   - onChange(e) -> จะถูกเรียกเมื่อแก้ไข title (ในกรณีไม่ได้ส่ง onTitleChange)
 */
export default function ActionTextField({
  // ใหม่
  titleValue,
  onTitleChange,
  titlePlaceholder = "หัวข้อ (prompt_title)",
  detailValue,
  onDetailChange,
  detailPlaceholder = "รายละเอียด (prompt_detail)",
  detailMinRows = 3,

  // เดิม / backward ของ title
  value,       // backward: ใช้เป็น titleValue ถ้าไม่ส่ง titleValue มา
  onChange,    // backward: จะถูกเรียกด้วย event ถ้าไม่ส่ง onTitleChange มา

  // action อื่น ๆ
  onDelete,
  endActions,
  disabled = false,
  sx,
}) {
  const toText = (v) => (typeof v === "string" ? v : ""); // กัน object/undefined/null

  // title value + handler (normalized)
  const finalTitleValue = toText(titleValue ?? value);
  const handleTitleChange = (e) => {
    const val = e?.target?.value ?? "";
    if (onTitleChange) onTitleChange(val); // ✅ ส่ง string ออกไปเสมอ
    else if (onChange) onChange(e);        // ✅ รักษา compatibility เดิม
  };

  // detail handler (ส่ง string เสมอ)
  const handleDetailChange = (e) => {
    const val = e?.target?.value ?? "";
    onDetailChange?.(val);
  };

  return (
    <Paper
      elevation={0}
      sx={{
        px: 1.25,
        py: 1,
        borderRadius: 2,
        border: (t) => `1px solid ${alpha(t.palette.text.primary, 0.15)}`,
        "&:focus-within": (t) => ({
          outline: `3px solid ${alpha(t.palette.primary.main, 0.18)}`,
          borderColor: t.palette.primary.main,
        }),
        ...sx,
      }}
    >
      {/* แถวบน: prompt_title + ปุ่มแอ็กชัน */}
      <Stack direction="row" alignItems="center" spacing={0.5}>
        <InputBase
          value={finalTitleValue}
          onChange={handleTitleChange}
          placeholder={titlePlaceholder}
          disabled={disabled}
          sx={{ flex: 1, fontSize: 14, lineHeight: 1.5, pr: 1 }}
        />
        <Stack direction="row" spacing={0.5} alignItems="center">
          {onDelete && (
            <Tooltip title="ลบ">
              <IconButton size="small" onClick={onDelete} color="error">
                <DeleteOutlineRoundedIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
          {endActions}
        </Stack>
      </Stack>

      {/* แถวล่าง: prompt_detail (textarea) */}
      <InputBase
        value={toText(detailValue)}
        onChange={handleDetailChange}
        placeholder={detailPlaceholder}
        disabled={disabled}
        multiline
        minRows={detailMinRows}
        sx={{
          mt: 1,
          width: "100%",
          fontSize: 14,
          lineHeight: 1.6,
        }}
      />
    </Paper>
  );
}
