// components/ActionKebabMenu.jsx
"use client";

import * as React from "react";
import { Menu, MenuItem, Divider, ListItemIcon } from "@mui/material";
import EditRounded from "@mui/icons-material/EditRounded";
import DeleteOutlineRounded from "@mui/icons-material/DeleteOutlineRounded";
import { FolderOutlined } from "@mui/icons-material";
import RedoOutlinedIcon from '@mui/icons-material/RedoOutlined';

export default function ActionKebabMenu({
  anchorEl,
  open,
  onClose,
  onRename,
  onChangeGroup,
  onDeleteGroup,
  onDelete,
  renameLabel = "เปลี่ยนชื่อโครงการ",
  changeGroupLabel = null,
  deleteGroupLabel = null,
  deleteLabel = "ลบโครงการ",
  dense = true,
  paperSx, // ปรับแต่งสไตล์เพิ่มเติมได้
}) {
  const handleClick = (fn) => () => {
    fn?.();
    onClose?.();
  };

  return (
    <Menu
      anchorEl={anchorEl}
      open={open}
      onClose={onClose}
      anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      transformOrigin={{ vertical: "top", horizontal: "right" }}
      PaperProps={{
        elevation: 0,
        sx: {
          borderRadius: 3,
          minWidth: 220,
          p: 0.5,
          overflow: "hidden",
          boxShadow: "0 2px 8px rgba(0,0,0,0.06), 0 12px 24px rgba(0,0,0,0.08)",
          ...paperSx,
        },
      }}
      MenuListProps={{ dense }}
    >
      <MenuItem
        onClick={handleClick(onRename)}
        sx={{ py: 1, px: 1, fontSize: 13.5, "& .MuiListItemIcon-root": { minWidth: 30 } }}
      >
        <ListItemIcon>
          <EditRounded fontSize="small" />
        </ListItemIcon>
        {renameLabel}
      </MenuItem>

      {
        changeGroupLabel !== null && (
          <MenuItem
            onClick={handleClick(onChangeGroup)}
            sx={{ py: 1, px: 1, fontSize: 13.5, "& .MuiListItemIcon-root": { minWidth: 30 } }}
          >
            <ListItemIcon>
              <FolderOutlined fontSize="small" />
            </ListItemIcon>
            {changeGroupLabel}
          </MenuItem>
        )
      }    

      {
        deleteGroupLabel !== null && (
          <MenuItem
            onClick={handleClick(onDeleteGroup)}
            sx={{ py: 1, px: 1, fontSize: 13.5, "& .MuiListItemIcon-root": { minWidth: 30 } }}
          >
            <ListItemIcon>
              <RedoOutlinedIcon fontSize="small" />
            </ListItemIcon>
            {deleteGroupLabel}
          </MenuItem>
        )
      }    

      <Divider sx={{ my: 0.25 }} />

      <MenuItem
        onClick={handleClick(onDelete)}
        sx={{
          py: 1,
          px: 1,
          fontSize: 13.5,
          color: "error.main",
          "& .MuiListItemIcon-root": { minWidth: 30, color: "error.main" },
        }}
      >
        <ListItemIcon>
          <DeleteOutlineRounded fontSize="small" />
        </ListItemIcon>
        {deleteLabel}
      </MenuItem>
    </Menu>
  );
}
