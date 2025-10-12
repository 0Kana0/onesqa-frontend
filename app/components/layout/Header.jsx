"use client";

import { useAuth } from "../../context/AuthContext";
import { useEffect, useState } from "react";
import { useMutation, useQuery } from "@apollo/client/react";
import { useRouter, usePathname } from "next/navigation";
import ReactCountryFlag from "react-country-flag";
import { LOGOUT } from "@/graphql/auth/mutations";
import {
  AppBar,
  Toolbar,
  Typography,
  Box,
  Avatar,
  Menu,
  MenuItem,
  Divider,
  ListItemIcon,
  IconButton,
  Badge,
  Button,
  useMediaQuery
} from "@mui/material";
import NotificationsNoneIcon from "@mui/icons-material/NotificationsNone";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import LogoutIcon from "@mui/icons-material/Logout";
import Swal from "sweetalert2";
import ThemeToggle from "../ui/ThemeToggle";
import { useTheme } from "next-themes";
import Brightness4Icon from "@mui/icons-material/Brightness4";
import Brightness7Icon from "@mui/icons-material/Brightness7";
import { useLanguage } from "@/app/context/LanguageContext";
import { useTranslations } from "next-intl";

export default function Header() {
  const router = useRouter();
  const { user, logoutContext } = useAuth();
  console.log(user);
  const t = useTranslations("LogoutAlert");
  const th = useTranslations("Header");

  const isMobile = useMediaQuery("(max-width:600px)"); // < md คือจอเล็ก

  const pathname = usePathname(); // ✅ ได้ path ปัจจุบัน เช่น "/login", "/dashboard"
  console.log("📍 current path:", pathname);

  const [logout] = useMutation(LOGOUT);

  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);

  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  const { handleLanguageChange, locale } = useLanguage();

  // ✅ ป้องกัน hydration mismatch
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  const pageNameCheck = () => {
    if (pathname.startsWith("/onesqa/dashboard")) return th("dashboard");
    else if (pathname.startsWith("/onesqa/chat")) return th("chat");
    else if (pathname.startsWith("/onesqa/users")) return th("users");
    else if (pathname.startsWith("/onesqa/reports")) return th("reports");
    else if (pathname.startsWith("/onesqa/settings")) return th("settings");
    else if (pathname.startsWith("/onesqa/logs")) return th("logs");
    else if (pathname.startsWith("/onesqa/detail")) return th("detail");
  };

  const handleClick = (event) => setAnchorEl(event.currentTarget);
  const handleClose = () => setAnchorEl(null);

  const handleProfile = () => {
    console.log("👤 ไปที่โปรไฟล์");
    router.push(`/onesqa/detail`);
    handleClose();
  };

  const handleThemeToggle = () => {
    console.log("🌓 เปลี่ยนธีม");
    setTheme(theme === "dark" ? "light" : "dark");
    handleClose();
  };

  const handleLogout = async () => {
    console.log(theme);

    handleClose();
    try {
      if (theme === "dark") {
        const result = await Swal.fire({
          title: t("title"),
          text: t("text"),
          icon: "warning",
          showCancelButton: true,
          confirmButtonText: t("confirm"),
          cancelButtonText: t("cancel"),
          confirmButtonColor: "#3E8EF7", // พื้นขาว
          cancelButtonColor: "#d33",
          background: "#2F2F30", // สีพื้นหลังดำ
          color: "#fff", // สีข้อความเป็นขาว
          titleColor: "#fff", // สี title เป็นขาว
          textColor: "#fff", // สี text เป็นขาว
        });

        if (result.isConfirmed) {
          // ✅ เรียก API logout
          const logoutResult = await logout();
          console.log(logoutResult);

          logoutContext();
          console.log("🚪 ผู้ใช้ออกจากระบบแล้ว");
        }
      } else {
        const result = await Swal.fire({
          title: t("title"),
          text: t("text"),
          icon: "warning",
          showCancelButton: true,
          confirmButtonText: t("confirm"),
          cancelButtonText: t("cancel"),
          confirmButtonColor: "#3E8EF7", // พื้นขาว
          cancelButtonColor: "#d33",
        });

        if (result.isConfirmed) {
          // ✅ เรียก API logout
          const logoutResult = await logout();
          console.log(logoutResult);

          logoutContext();
          console.log("🚪 ผู้ใช้ออกจากระบบแล้ว");
        }
      }
    } catch (error) {
      console.error("❌ Logout failed:", error);
    }
  };

  if (pathname.startsWith("/auth")) {
    return (
      <AppBar
        position="static"
        sx={{
          bgcolor: "background.paper", // พื้นหลังขาว
          color: "background.text",
        }}
      >
        <Toolbar>
          {/* รูปโลโก้ */}
          <Box
            component="img"
            src="/images/logo.png" // ✅ ใส่ path รูป (เช่น public/logo.png)
            alt="Logo"
            sx={{
              width: 48,
              height: 48,
              mr: 1, // margin ขวา
              ml: 1,
            }}
          />

          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            ONESQA AI Chatbot
          </Typography>
        </Toolbar>
      </AppBar>
    );
  } else {
    return (
      <AppBar
        position="static"
        sx={{
          bgcolor: "background.paper",
          boxShadow: "0px 1px 3px rgba(0,0,0,0.1)",
          px: 3,
          color: "background.text",
        }}
      >
        <Toolbar sx={{ display: "flex", justifyContent: "space-between" }}>
          {/* ด้านซ้าย: ชื่อหน้า */}
          <Typography variant="h6" sx={{ fontWeight: "bold" }}>
            {pageNameCheck()}
          </Typography>

          {/* ด้านขวา: โปรไฟล์ */}
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1.5,
            }}
          >
            {locale === "th" ? (
              <Button
                startIcon={
                  <ReactCountryFlag
                    countryCode="TH"
                    svg
                    style={{ width: "1.2em", height: "1.2em" }}
                  />
                }
                onClick={() => handleLanguageChange("en")}
                sx={{
                  minWidth: 0,
                  padding: 0,
                }}
              />
            ) : (
              <Button
                startIcon={
                  <ReactCountryFlag
                    countryCode="GB"
                    svg
                    style={{ width: "1.2em", height: "1.2em" }}
                  />
                }
                onClick={() => handleLanguageChange("th")}
                sx={{
                  minWidth: 0,
                  padding: 0,
                }}
              />
            )}

            <IconButton
              sx={{
                color: "#3E8EF7", // 🔵 สีฟ้า
                position: "relative",
              }}
            >
              <Badge
                variant="dot"
                overlap="circular"
                sx={{
                  "& .MuiBadge-dot": {
                    backgroundColor: "#E53935", // 🔴 สีแดง
                    width: 10,
                    height: 10,
                    borderRadius: "50%",
                    top: 4,
                    right: 4,
                  },
                }}
              >
                <NotificationsNoneIcon />
              </Badge>
            </IconButton>
            <Avatar
              alt="User"
              //src="/profile.png"
              sx={{ width: 45, height: 45, borderRadius: "10px" }}
            />
            <Box sx={{ textAlign: "left", lineHeight: 1 }}>
              <Typography variant="body1" sx={{ fontWeight: 600 }}>
                {user?.username}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {user?.role_name}
              </Typography>
            </Box>
            <KeyboardArrowDownIcon
              onClick={handleClick}
              sx={{ color: "gray", cursor: "pointer" }}
            />
          </Box>

          {/* ✅ เมนู dropdown */}
          <Menu
            anchorEl={anchorEl}
            open={open}
            onClose={handleClose}
            anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
            transformOrigin={{ vertical: "top", horizontal: "right" }}
            PaperProps={{
              elevation: 3,
              sx: {
                borderRadius: 2,
                mt: 1,
                minWidth: 190,
              },
            }}
          >
            {/* ดูโปรไฟล์ */}
            <MenuItem onClick={handleProfile}>
              <ListItemIcon>
                <AccountCircleIcon fontSize="small" sx={{ color: "#3E8EF7" }} />
              </ListItemIcon>
              {th("profile")}
            </MenuItem>

            {/* เปลี่ยนธีม */}
            <MenuItem onClick={() => handleThemeToggle()}>
              <ListItemIcon>
                {theme === "dark" ? (
                  <Brightness7Icon fontSize="small" sx={{ color: "#3E8EF7" }} />
                ) : (
                  <Brightness4Icon fontSize="small" sx={{ color: "#3E8EF7" }} />
                )}
              </ListItemIcon>
              {th("theme")}
            </MenuItem>

            {/* เส้นคั่น */}
            <Divider sx={{ my: 0.5 }} />

            {/* ออกจากระบบ */}
            <MenuItem onClick={handleLogout} sx={{ color: "red" }}>
              <ListItemIcon>
                <LogoutIcon fontSize="small" sx={{ color: "red" }} />
              </ListItemIcon>
              {th("logout")}
            </MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>
    );
  }
}
