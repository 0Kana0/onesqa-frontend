// components/NewProjectModal.jsx
"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  IconButton,
  TextField,
  Button,
  Box,
} from "@mui/material";
import CloseRounded from "@mui/icons-material/CloseRounded";

export default function NewProjectModal({
  open,
  onClose,
  onCreate,                 // (name: string) => void
  initialName = "",
  title = "สร้างกลุ่มใหม่",
  label = "ชื่อกลุ่ม",
  placeholder = "เช่น ระบบบริหารจัดการ X",
  confirmLabel = "สร้างกลุ่ม",
}) {
  const [name, setName] = useState(initialName);

  useEffect(() => {
    if (open) setName(initialName || "");
  }, [open, initialName]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const n = name.trim();
    if (!n) return;
    onCreate?.(n);
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="sm"
      PaperProps={{ sx: { borderRadius: 3, p: 0.5 } }}
    >
      <DialogTitle>
        <Typography sx={{ fontSize: 16 }}>{title}</Typography>
        <IconButton
          onClick={onClose}
          sx={{ position: "absolute", right: 8, top: 8 }}
          aria-label="close"
        >
          <CloseRounded />
        </IconButton>
      </DialogTitle>

      <Box component="form" onSubmit={handleSubmit}>
        <DialogContent sx={{ pt: 0.5 }}>
          <TextField
            autoFocus
            fullWidth
            size="small"
            label={label}
            placeholder={placeholder}
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Box sx={{ flex: 1 }} />
          <Button type="submit" variant="contained" disabled={!name.trim()}>
            {confirmLabel}
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  );
}
