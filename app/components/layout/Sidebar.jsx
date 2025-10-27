"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "../../context/AuthContext";
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
  useMediaQuery,
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
import { useTranslations } from "next-intl";
import { useSidebar } from "../../context/SidebarContext";
import NewChatButton from "../chat/NewChatButton";
import ProjectSidebar from "../chat/ProjectSidebar";
import ChatSidebar from "../chat/ChatSidebar";

export default function Sidebar() {
  const router = useRouter();
  const { open, toggle } = useSidebar(); // ✅ ดึงจาก Context
  const { user } = useAuth();
  const pathname = usePathname();
  const t = useTranslations("Sidebar");
  const isMobile = useMediaQuery("(max-width:600px)");
  const isTablet = useMediaQuery("(max-width:1200px)"); // < md คือจอเล็ก

  const menuItems = [
    { text: t('dashboard'), icon: <Home />, path: "/onesqa/dashboard" },
    { text: t('chat'), icon: <Chat />, path: "/onesqa/chat" },
    { text: t('users'), icon: <Group />, path: "/onesqa/users" },
    { text: t('reports'), icon: <BarChart />, path: "/onesqa/reports" },
    { text: t('settings'), icon: <Settings />, path: "/onesqa/settings" },
    { text: t('logs'), icon: <History />, path: "/onesqa/logs" },
  ];

  // ✅ ถ้าเป็น mobile และ sidebar ปิด => ไม่ render Drawer เลย
  if (isTablet && !open) return null;
  
  const handleInitPage = () => {
    if (user?.role_name === "ผู้ดูแลระบบ") {
      router.push("/onesqa/dashboard");
    } else {
      router.push("/onesqa/chat");
    }
  }

  return (
    <Drawer
      variant={isTablet ? "temporary" : "permanent"}
      open={open}
      sx={(theme) => ({
        ...((user?.role_name === "ผู้ดูแลระบบ" && pathname.startsWith("/onesqa/chat")) || user?.role_name !== "ผู้ดูแลระบบ"
          ? {
              // ✅ ชุด "อันบน" (เมื่อ true)
              width: 300,
            }
          : {
              // ✅ ชุด "อันล่าง" (เมื่อ false)
              width: open ? 240 : 80,
            }),
        flexShrink: 0,
        "& .MuiDrawer-paper": {
          boxSizing: "border-box",
          background: `linear-gradient(to bottom, ${theme.palette.primary.main}, #1E61C2)`,
          color: "white",
          border: "none",
          ...((user?.role_name === "ผู้ดูแลระบบ" && pathname.startsWith("/onesqa/chat")) || user?.role_name !== "ผู้ดูแลระบบ"
            ? {
                // ✅ ชุด "อันบน" (เมื่อ true)
                width: 300,
                height: "100dvh",          // หรือ "100vh"
                maxHeight: "100dvh",
                overflowY: "auto",
                overflowX: "visible",
                WebkitOverflowScrolling: "touch",
              }
            : {
                // ✅ ชุด "อันล่าง" (เมื่อ false)
                width: open ? 240 : 80,
                overflowX: "hidden",
                overflow: "visible", // ปล่อยให้ element ยื่นได้ (ตามที่คุณตั้งไว้)
              }),
        },
      })}
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
            sx={{ fontWeight: "bold", display: "flex", alignItems: "center", cursor: "pointer" }}
            onClick={() => handleInitPage()}
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
            sx={{ width: 36, height: 36, cursor: "pointer" }}
            onClick={() => handleInitPage()}
          />
        )}

        {/* 🔹 ปุ่ม toggle ชิดขอบขวา */}
        {user?.role_name === "ผู้ดูแลระบบ" && !pathname.startsWith("/onesqa/chat") && (
          <IconButton
            onClick={toggle} // ✅ ใช้ฟังก์ชันจาก Context
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
        )}
      </Box>

      {/* 🔹 เมนูรายการ */}
      {user?.role_name === "ผู้ดูแลระบบ" && !pathname.startsWith("/onesqa/chat") ? (
        <List sx={{ mt: 1 }}>
          {menuItems.map((item, index) => {
            const isActive = pathname.startsWith(item.path);

            return (
              <ListItem key={index} disablePadding sx={{ display: "block" }}>
                <Link 
                  href={item.path} 
                  onClick={isTablet ? toggle : undefined} // ✅ toggle เฉพาะใน mobile
                  style={{ textDecoration: "none" }}
                >
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
      ) : (
        <Box sx={{ p: 0.5 }}>
          <NewChatButton
            onNewChat={() => console.log("new chat")}
            onSearch={() => console.log("search chat")}
          />
          <ProjectSidebar
            onCreateProject={() => {/* เปิด dialog สร้างโครงการ */}}
            onOpenFolder={(name) => {/* เปิด drawer/โหลดรายการในโฟลเดอร์ */}}
            onOpenItem={(title) => {/* เปิดรายละเอียดโครงการ */}}
            onShowAll={() => {/* เปิดหน้ารายการทั้งหมด */}}
          />
          <ChatSidebar />
        </Box>
      )}
    </Drawer>
  );
}
