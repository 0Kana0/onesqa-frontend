"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Box,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  IconButton,
  Typography,
} from "@mui/material";
import {
  Home,
  Chat,
  Group,
  BarChart,
  Settings,
  History,
  ChevronLeft,
  ChevronRight,
} from "@mui/icons-material";
import { useTranslations } from 'next-intl';

export default function Sidebar() {
  const [open, setOpen] = useState(true);
  const pathname = usePathname();
  const t = useTranslations('Sidebar');

  const menuItems = [
    { text: t('dashboard'), icon: <Home />, path: "/onesqa/dashboard" },
    { text: t('chat'), icon: <Chat />, path: "/onesqa/chat" },
    { text: t('users'), icon: <Group />, path: "/onesqa/users" },
    { text: t('reports'), icon: <BarChart />, path: "/onesqa/reports" },
    { text: t('settings'), icon: <Settings />, path: "/onesqa/settings" },
    { text: t('logs'), icon: <History />, path: "/onesqa/logs" },
  ];

  return (
    <Drawer
      variant="permanent"
      open={open}
      sx={{
        width: open ? 240 : 80,
        flexShrink: 0,
        "& .MuiDrawer-paper": {
          width: open ? 240 : 80,
          boxSizing: "border-box",
          //transition: "width 0.3s ease",
          background: (theme) => `linear-gradient(to bottom, ${theme.palette.primary.main}, #1E61C2)`,
          color: "white",
          border: "none",
          overflowX: "hidden",
          overflow: "visible", // ✅ ให้ปุ่มยื่นออกมาได้
        },
      }}
    >
      {/* 🔹 Header Logo */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: open ? "space-between" : "center",
          p: 2,
        }}
      >
        {open && (
          <Typography
            variant="subtitle1"
            sx={{ fontWeight: "bold", display: "flex", alignItems: "center" }}
          >
            <Box
              component="img"
              src="/images/logo.png" // ✅ ใส่โลโก้ของคุณใน public/
              alt="logo"
              sx={{ width: 36, height: 36, mr: 1 }}
            />
            ONESQA AI Chatbot
          </Typography>
        )}

        {!open && (
          <Box
            component="img"
            src="/images/logo.png"
            alt="logo"
            sx={{ width: 36, height: 36 }}
          />
        )}

        {/* 🔹 ปุ่ม toggle ชิดขอบขวา */}
        <IconButton
          onClick={() => setOpen(!open)}
          sx={{
            position: "absolute",
            top: 64,                // อยู่กลางแนวตั้ง
            right: -12,                // เยื้องออกมานิดจากขอบ sidebar
            transform: "translateY(-50%)",
            backgroundColor: "white",
            color: "#3E8EF7",
            //border: "1px solid #3E8EF7",
            boxShadow: 2,
            width: 24,
            height: 24,
            "&:hover": {
              backgroundColor: "#f0f6ff",
              transform: "translateY(-50%) scale(1.1)",
            },
            transition: "all 0.3s ease",
            zIndex: 2000,
          }}
        >
          {open ? <ChevronLeft fontSize="small" /> : <ChevronRight fontSize="small" />}
        </IconButton>
      </Box>

      {/* 🔹 เมนูรายการ */}
      <List sx={{ mt: 1 }}>
        {menuItems.map((item, index) => {
          const isActive = pathname.startsWith(item.path);

          return (
            <ListItem key={index} disablePadding sx={{ display: "block" }}>
              <Link href={item.path} style={{ textDecoration: "none" }}>
                <ListItemButton
                  sx={{
                    minHeight: 48,
                    justifyContent: open ? "initial" : "center",
                    px: 2.5,
                    py: 1.5,
                    borderLeft: isActive ? "4px solid white" : "4px solid transparent",
                    backgroundColor: isActive ? "rgba(255,255,255,0.2)" : "transparent",
                    //transition: "all 0.2s ease-in-out",
                    "&:hover": {
                      backgroundColor: "rgba(255,255,255,0.25)",
                    },
                  }}
                >
                  <ListItemIcon
                    sx={{
                      color: "white",
                      minWidth: 0,
                      mr: open ? 2 : "auto",
                      justifyContent: "center",
                    }}
                  >
                    {item.icon}
                  </ListItemIcon>
                  {open && (
                    <ListItemText
                      primary={item.text}
                      primaryTypographyProps={{ fontSize: 15, color: "#ffffff" }}
                    />
                  )}
                </ListItemButton>
              </Link>
            </ListItem>
          );
        })}
      </List>
    </Drawer>
  );
}
