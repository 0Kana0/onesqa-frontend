// PlusAttachButton.jsx
"use client";

import { useState } from "react";
import {
  IconButton,
  Tooltip,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
} from "@mui/material";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import AttachFileRoundedIcon from "@mui/icons-material/AttachFileRounded";
import ImageRoundedIcon from "@mui/icons-material/ImageRounded";
import MovieRoundedIcon from "@mui/icons-material/MovieRounded";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import CloseRounded from "@mui/icons-material/CloseRounded";
import { useTranslations } from "next-intl";

// ✅ ปรับ path ให้ตรงโปรเจกต์คุณ
import { useInitText } from "@/app/context/InitTextContext";

export default function PlusAttachButton({
  triggerFile,
  onPickFromDrive,
  disabled = false,
}) {
  const tChatSidebar = useTranslations("ChatSidebar");
  const tPlusAttachButton = useTranslations("PlusAttachButton");
  const { setInitMessageType } = useInitText();

  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);

  // ✅ เพิ่ม state สำหรับ modal
  const [uploadModalOpen, setUploadModalOpen] = useState(false);

  const handleButtonClick = (e) => {
    if (!disabled) setAnchorEl(e.currentTarget);
  };
  const handleClose = () => setAnchorEl(null);

  const handleUploadClick = () => {
    handleClose();

    setTimeout(() => triggerFile?.(), 0);
  };

  const handleOpenUploadModal = (e) => {
    // ✅ สำคัญ: กันไม่ให้ไป trigger MenuItem (upload)
    e.stopPropagation();
    e.preventDefault();

    handleClose();              // ปิดเมนูก่อน
    setUploadModalOpen(true);   // เปิด modal
  };

  const handleDriveClick = (type) => {
    handleClose();

    if (type === "doc") setInitMessageType("DOC");
    else if (type === "image") setInitMessageType("IMAGE");
    else if (type === "video") setInitMessageType("VIDEO");

    onPickFromDrive?.(type);
  };

  return (
    <>
      <Tooltip title={tChatSidebar("uploadtooltip")}>
        <span>
          <IconButton
            size="small"
            onClick={handleButtonClick}
            disabled={disabled}
            aria-controls={open ? "plus-attach-menu" : undefined}
            aria-haspopup="true"
            aria-expanded={open ? "true" : undefined}
            sx={{ border: (t) => `1px solid ${t.palette.grey[200]}` }}
          >
            <AddRoundedIcon fontSize="small" />
          </IconButton>
        </span>
      </Tooltip>

      <Menu
        id="plus-attach-menu"
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        MenuListProps={{ dense: true }}
        anchorOrigin={{ vertical: "top", horizontal: "left" }}
        transformOrigin={{ vertical: "bottom", horizontal: "left" }}
        disableScrollLock
        slotProps={{
          paper: {
            sx: {
              mt: 0.5,
              minWidth: 220,
              boxShadow: 3,
              border: (t) => `1px solid ${t.palette.divider}`,
              borderRadius: 2,
            },
          },
        }}
      >
        <MenuItem onClick={() => handleDriveClick("image")}>
          <ListItemIcon>
            <ImageRoundedIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText primary={tPlusAttachButton("createImage")} />
        </MenuItem>

        <MenuItem onClick={() => handleDriveClick("video")}>
          <ListItemIcon>
            <MovieRoundedIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText primary={tPlusAttachButton("createVideo")} />
        </MenuItem>

        {/* ✅ แก้ MenuItem Upload: ใส่ปุ่มเล็กๆ ท้ายรายการ */}
        <MenuItem onClick={handleUploadClick} sx={{ pr: 1 }}>
          <ListItemIcon>
            <AttachFileRoundedIcon fontSize="small" />
          </ListItemIcon>

          <Box sx={{ display: "flex", alignItems: "center", width: "100%" }}>
            <ListItemText
              primary={tChatSidebar("uploadfile")}
              sx={{ mr: 1 }}
            />

            <Tooltip title={tPlusAttachButton("requirement")}>
              <IconButton
                size="small"
                edge="end"
                onClick={handleOpenUploadModal}
                aria-label="open upload modal"
                sx={{ ml: "auto" }}
              >
                <InfoOutlinedIcon fontSize="inherit" />
              </IconButton>
            </Tooltip>
          </Box>
        </MenuItem>
      </Menu>

      {/* ✅ Modal ที่เปิดจากปุ่มเล็ก */}
      <Dialog
        open={uploadModalOpen}
        onClose={() => setUploadModalOpen(false)}
        fullWidth
        maxWidth="sm"
        PaperProps={{ sx: { borderRadius: 3, p: 0.5 } }}
      >
        <DialogTitle sx={{ position: "relative" }}>
          <Typography sx={{ fontSize: 16 }}>
            {tPlusAttachButton("uploadModalTitle")}
          </Typography>

          <IconButton
            onClick={() => setUploadModalOpen(false)}
            sx={{ position: "absolute", right: 8, top: 8 }}
            aria-label={tPlusAttachButton("close")}
          >
            <CloseRounded />
          </IconButton>
        </DialogTitle>

        <DialogContent
          dividers
          sx={{
            py: 2,
            maxHeight: "70vh",
            overflowY: "auto",
          }}
        >
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
              {tPlusAttachButton("uploadRules")}
            </Typography>

            <Box component="ul" sx={{ m: 0, pl: 2.5 }}>
              <Box component="li">
                <Typography variant="body2">
                  {tPlusAttachButton("uploadRule1")}
                </Typography>
              </Box>
              <Box component="li">
                <Typography variant="body2">
                  {tPlusAttachButton("uploadRule2")}
                </Typography>
              </Box>
              <Box component="li">
                <Typography variant="body2">
                  {tPlusAttachButton("uploadRule3")}
                </Typography>
              </Box>
            </Box>

            <Box sx={{ pt: 0.5 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                {tPlusAttachButton("usageGuideTitle")}
              </Typography>
              <Box component="ul" sx={{ m: 0, pl: 2.5 }}>
                <Box component="li">
                  <Typography variant="body2">
                    {tPlusAttachButton("usageGuide1")}
                  </Typography>
                </Box>
                <Box component="li">
                  <Typography variant="body2">
                    {tPlusAttachButton("usageGuide2")}
                  </Typography>
                </Box>
              </Box>
            </Box>
          </Box>
        </DialogContent>
      </Dialog>
    </>
  );
}
