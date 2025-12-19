// PlusAttachButton.jsx
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
import DriveFolderUploadRoundedIcon from "@mui/icons-material/DriveFolderUploadRounded";

export default function PlusAttachButton({
  triggerFile, // () => void  เปิด input[type=file] ที่คุณมีอยู่แล้ว
  onPickFromDrive, // () => void  เปิดตัวเลือกจากไดรฟ์ (ถ้ายังไม่ทำให้ไม่ต้องส่งมาก็ได้)
  disabled = false,
}) {
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);

  const handleButtonClick = (e) => {
    if (!disabled) setAnchorEl(e.currentTarget);
  };
  const handleClose = () => setAnchorEl(null);

  const handleUploadClick = () => {
    handleClose();
    // ปล่อย event หลังเมนูปิดเพื่อให้ input.click() ติด 100%
    setTimeout(() => triggerFile?.(), 0);
  };

  const handleDriveClick = () => {
    handleClose();
    onPickFromDrive?.();
  };

  return (
    <>
      <Tooltip title="เพิ่ม/แนบไฟล์">
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
        // ⬆️ ให้แสดงเหนือปุ่ม
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
        <MenuItem onClick={handleUploadClick}>
          <ListItemIcon>
            <AttachFileRoundedIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText primary="อัปโหลดไฟล์" />
        </MenuItem>

        {/* <MenuItem onClick={handleDriveClick} disabled={!onPickFromDrive}>
          <ListItemIcon>
            <DriveFolderUploadRoundedIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText primary="เพิ่มจากไดรฟ์" />
        </MenuItem> */}
      </Menu>
    </>
  );
}
