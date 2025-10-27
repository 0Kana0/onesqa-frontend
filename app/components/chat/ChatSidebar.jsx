"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Box,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Collapse,
  Typography,
  IconButton,
} from "@mui/material";
import ExpandLess from "@mui/icons-material/ExpandLess";
import ExpandMore from "@mui/icons-material/ExpandMore";
import FolderOutlined from "@mui/icons-material/FolderOutlined";
import CreateNewFolderOutlined from "@mui/icons-material/CreateNewFolderOutlined";
import MoreHorizRounded from "@mui/icons-material/MoreHorizRounded";
import ActionKebabMenu from "./ActionKebabMenu";

export default function ChatSidebar() {
  const [open, setOpen] = useState(true);
  // ---- Modal: โครงการใหม่ (แยกเป็นคอมโพเนนต์) ----

  const items = [
    { label: "แชต ONESQA", href: "#" },
    { label: "แชต CRPU", href: "#" },
    { label: "แชต UAT", href: "#" },
    { label: "แชต ONESQA1", href: "#" },
    { label: "แชต CRPU1", href: "#" },
    { label: "แชต UAT1", href: "#" },
    { label: "แชต ONESQA2", href: "#" },
    { label: "แชต CRPU2", href: "#" },
    { label: "แชต UAT2", href: "#" },
    
  ];

  // --- เมนูจุดสามจุด ---
  const [menuAnchor, setMenuAnchor] = useState(null);
  const [selected, setSelected] = useState(null);
  const menuOpen = Boolean(menuAnchor);

  const handleLink = () => {
    console.log("handleLink");
  }

  const handleOpenMenu = (e, item) => {
    e.preventDefault();
    e.stopPropagation(); // กันไม่ให้ Link ทำงาน
    setSelected(item);
    setMenuAnchor(e.currentTarget);
  };
  const handleCloseMenu = () => {
    setMenuAnchor(null);
    setSelected(null);
  };

  // ตัวอย่าง action (เปลี่ยนชื่อ / ลบ)
  const handleRename = () => {
    console.log("rename:", selected?.label);
    handleCloseMenu();
  };
  const handleDelete = () => {
    console.log("delete:", selected?.label);
    handleCloseMenu();
  };

  return (
    <Box sx={{ "& .MuiListItemButton-root": { borderRadius: 1.5 } }}>
      <List disablePadding>
        {/* หัวข้อ "กลุ่ม" กดเพื่อซ่อน/แสดง */}
        <ListItemButton
          onClick={() => setOpen((v) => !v)}
          sx={{
            borderRadius: 1,
            "&:hover .indicator": { opacity: 1 }, // โชว์ตอน hover
          }}
          disableRipple
        >
          <ListItemText
            primary={
              <Typography sx={{ fontSize: 13.5, color: "text.primary" }}>
                กลุ่ม
              </Typography>
            }
          />
          <Box
            className="indicator"
            sx={{
              ml: 1,
              opacity: 0,
              transition: "opacity .15s ease",
              fontWeight: 700,
              fontSize: 13.5,
              lineHeight: 1,
              userSelect: "none",
            }}
          >
            {open ? <ExpandLess /> : <ExpandMore />}
          </Box>
        </ListItemButton>

        <Collapse in={open} timeout="auto" unmountOnExit>
          <List disablePadding>
            {items.map((it) => {
              const showMenu = it.label !== "กลุ่มใหม่"; // << เงื่อนไขสำคัญ
              const isActive = showMenu && menuOpen && selected?.label === it.label;

              return (
                <Link
                  key={it.label}
                  href={it.href}
                  style={{ textDecoration: "none", color: "inherit" }}
                >
                  <ListItemButton
                    sx={{
                      pl: 1.5,
                      pr: 1,
                      minHeight: 30,
                      ...(showMenu
                        ? {
                            "& .kebab": {
                              opacity: isActive ? 1 : 0,
                              transition: "opacity .15s",
                            },
                            "&:hover .kebab, &:hover .item-icon": { opacity: 1 },
                          }
                        : {
                            "&:hover .item-icon": { opacity: 1 },
                          }),
                    }}
                    disableRipple
                  >
                    <ListItemText
                      primary={it.label}
                      primaryTypographyProps={{ fontSize: 14 }}
                    />
                    {showMenu && (
                      <IconButton
                        className="kebab"
                        size="small"
                        edge="end"
                        aria-label="more options"
                        onClick={(e) => handleOpenMenu(e, it)}
                        disableRipple
                      >
                        <MoreHorizRounded fontSize="small" />
                      </IconButton>
                    )}
                  </ListItemButton>
                </Link>
              );
            })}
          </List>
        </Collapse>
      </List>

      {/* Dropdown เมนูแบบในภาพ */}
      {/* เรียกใช้คอมโพเนนต์เมนูที่แยกออกมา */}
      <ActionKebabMenu
        anchorEl={menuAnchor}
        open={menuOpen}
        onClose={handleCloseMenu}
        onRename={handleRename}
        onDelete={handleDelete}
        // ปรับข้อความได้ตามบริบท เช่น "กลุ่ม"
        renameLabel="เปลี่ยนชื่อกลุ่ม"
        deleteLabel="ลบกลุ่ม"
        // paperSx={{ minWidth: 200 }} // ถ้าต้องการปรับแต่งเพิ่ม
      />
    </Box>
  );
}
