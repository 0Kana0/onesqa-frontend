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
} from "@mui/material";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import AttachFileRoundedIcon from "@mui/icons-material/AttachFileRounded";
import ImageRoundedIcon from "@mui/icons-material/ImageRounded";
import MovieRoundedIcon from "@mui/icons-material/MovieRounded";
import DescriptionRoundedIcon from "@mui/icons-material/DescriptionRounded";
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

  const handleButtonClick = (e) => {
    if (!disabled) setAnchorEl(e.currentTarget);
  };
  const handleClose = () => setAnchorEl(null);

  const handleUploadClick = () => {
    handleClose();

    setTimeout(() => triggerFile?.(), 0);
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

        <MenuItem onClick={() => handleDriveClick("doc")}>
          <ListItemIcon>
            <DescriptionRoundedIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText primary={tPlusAttachButton("createDoc")} />
        </MenuItem>

        <MenuItem onClick={handleUploadClick}>
          <ListItemIcon>
            <AttachFileRoundedIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText primary={tChatSidebar("uploadfile")} />
        </MenuItem>
      </Menu>
    </>
  );
}
