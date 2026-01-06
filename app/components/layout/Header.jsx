"use client";

import { useAuth } from "../../context/AuthContext";
import { useEffect, useState } from "react";
import { NetworkStatus } from "@apollo/client";
import { useQuery, useMutation, useApolloClient } from "@apollo/client/react";
import { useRouter, usePathname, useParams } from "next/navigation";
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
  useMediaQuery,
  ButtonBase
} from "@mui/material";
import FullScreenLoading from "../../components/FullScreenLoading";
import MenuIcon from "@mui/icons-material/Menu";
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
import { useSidebar } from "../../context/SidebarContext"; // ✅ ใช้ context
import NotificationListener from "../NotificationListener";
import { GET_CHAT } from "@/graphql/chat/queries";
import { getAiLogo, AI_LOGOS } from "@/util/aiLogo";
import { UPDATE_THEME_AND_LOCALE } from "@/graphql/user/mutations";

export default function Header() {
  const router = useRouter();
  const params = useParams();
  const { user, logoutContext } = useAuth();
  const { open, toggle } = useSidebar(); // ✅ ดึงจาก Context
  const [hasNotification, setHasNotification] = useState(false);
  const { id } = params;

  console.log(user);
  const t = useTranslations("LogoutAlert");
  const th = useTranslations("Header");

  const isMobile = useMediaQuery("(max-width:600px)"); // < md คือจอเล็ก
  const isTablet = useMediaQuery("(max-width:1200px)"); // < md คือจอเล็ก

  const pathname = usePathname(); // ✅ ได้ path ปัจจุบัน เช่น "/login", "/dashboard"
  console.log("📍 current path:", pathname);
  const isOnNotificationPage = pathname?.includes("/onesqa/notification"); // รองรับ /onesqa/notification/... และกรณีมี prefix

  const [logout] = useMutation(LOGOUT);
  const [updateThemeAndLocale] = useMutation(UPDATE_THEME_AND_LOCALE);

  const [loggingOut, setLoggingOut] = useState(false);

  const [anchorEl, setAnchorEl] = useState(null);
  const openDropdown = Boolean(anchorEl);

  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  const { handleLanguageChange, locale } = useLanguage();
  
  const {
    data: chatData,
    loading: chatLoading,
    error: chatError,
  } = useQuery(GET_CHAT, {
    variables: {
      id: id ?? 0,
    },
    fetchPolicy: "network-only",
  });

  // ✅ ป้องกัน hydration mismatch
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  const pageNameCheck = () => {
    if (pathname.startsWith("/onesqa/dashboard") && (user?.role_name_th === "ผู้ดูแลระบบ" || user?.role_name_th === "superadmin")) return th("dashboard");
    else if (pathname.startsWith("/onesqa/chat")) return th("chat");
    else if (pathname.startsWith("/onesqa/users") && (user?.role_name_th === "ผู้ดูแลระบบ" || user?.role_name_th === "superadmin")) return th("users");
    else if (pathname.startsWith("/onesqa/reports") && (user?.role_name_th === "ผู้ดูแลระบบ" || user?.role_name_th === "superadmin")) return th("reports");
    else if (pathname.startsWith("/onesqa/settings") && (user?.role_name_th === "ผู้ดูแลระบบ" || user?.role_name_th === "superadmin")) return th("settings");
    else if (pathname.startsWith("/onesqa/logs") && (user?.role_name_th === "ผู้ดูแลระบบ" || user?.role_name_th === "superadmin")) return th("logs");
    else if (pathname.startsWith("/onesqa/detail")) return th("detail");
    else if (pathname.startsWith("/onesqa/notification") ) return th("notification");
  };

  const handleClick = (event) => setAnchorEl(event.currentTarget);
  const handleClose = () => setAnchorEl(null);

  const handleProfile = () => {
    console.log("👤 ไปที่โปรไฟล์");
    router.push(`/onesqa/detail`);
    handleClose();
  };

  const handleNotification = () => {
    console.log("👤 ไปที่เเจ้งเตือน");
    setHasNotification(false);
    localStorage.removeItem("alert");
    router.push(`/onesqa/notification`);
  };

  const handleThemeToggle = async () => {
    console.log("🌓 เปลี่ยนธีม");
    setTheme(theme === "dark" ? "light" : "dark");
    // ✅ เรียก mutation ไป backend
    const { data } = await updateThemeAndLocale({
      variables: {
        id: user?.id,
        input: {
          color_mode: theme === "dark" ? "LIGHT" : "DARK",
        },
      },
    });

    console.log("✅ Update success:", data?.updateThemeAndLocale);
    handleClose();
  };
  const handleLocaleToggle = async (locale) => {
    // ✅ เรียก mutation ไป backend
    const { data } = await updateThemeAndLocale({
      variables: {
        id: user?.id,
        input: {
          locale,
        },
      },
    });

    console.log("✅ Update success:", data?.updateThemeAndLocale);
  }

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

          setLoggingOut(true); // ✅ เปิด FullScreenLoading

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

          setLoggingOut(true); // ✅ เปิด FullScreenLoading

          logoutContext();
          console.log("🚪 ผู้ใช้ออกจากระบบแล้ว");
        }
      }
    } catch (error) {
      console.error("❌ Logout failed:", error);
    }
  };

  return (
    <>
      {loggingOut && <FullScreenLoading text={th('loading')} />}

      {/* ===== AppBar เดิมทั้งหมด ===== */}
      {pathname.startsWith("/auth") ? (
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
                width: isMobile ? 32 : 48,
                height: isMobile ? 32 : 48,
                mr: 1, // margin ขวา
                ml: 1,
              }}
            />

            <Typography variant="h6" sx={{ flexGrow: 1 }}>
              ONESQA AI Chatbot
            </Typography>
          </Toolbar>
        </AppBar>
      ) : (
        <AppBar
          position="static"
          sx={{
            bgcolor: "background.paper",
            boxShadow: "0px 1px 3px rgba(0,0,0,0.1)",
            px: isTablet ? 0 : 3,
            color: "background.text",
          }}
        >
          <Toolbar sx={{ display: "flex", justifyContent: "space-between" }}>
            {/* ด้านซ้าย: ชื่อหน้า */}
            {
              isTablet ? (
                <IconButton 
                  onClick={toggle} // ✅ ใช้ฟังก์ชันจาก Context
                  color="inherit" 
                  aria-label="open sidebar"
                >
                  <MenuIcon sx={{ fontSize: 28 }} />
                </IconButton>
              ) : (
                <Typography variant="h6" sx={{ fontWeight: "bold" }}>
                  {pathname.startsWith("/onesqa/chat") && !pathname.startsWith("/onesqa/chat/group") && id !== undefined ? (
                    <Box sx={{
                      display: "flex",
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 1
                    }}>
                      {pageNameCheck()}
                      <Avatar
                        src={getAiLogo(chatData?.chat?.ai)}
                        alt={chatData?.chat?.ai?.model_type ?? "AI"}
                        sx={{ bgcolor: "grey.200", color: "text.secondary", width: 25, height: 25 }}
                        imgProps={{
                          onError: (e) => (e.currentTarget.src = AI_LOGOS.default),
                        }}
                    />
                    </Box>
                  ) : (
                    <>
                      {pageNameCheck()}
                    </>
                  )}

                </Typography>
              )
            }

            {/* ด้านขวา: โปรไฟล์ */}
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: isMobile ? 0.5 : 1.5,
              }}
            >
              <ButtonBase
                onClick={() => {
                  handleLanguageChange("th")
                  handleLocaleToggle("th")
                }}
                sx={{
                  borderRadius: 1,
                  px: 0.5,
                  // ทำให้ underline ตาม content
                  display: "inline-flex",
                }}
              >
                <Typography
                  variant="body1"
                  sx={{
                    fontWeight: 600,
                    lineHeight: 1.2,
                    borderBottom: "2px solid",
                    borderColor: locale === "th" ? "text.primary" : "transparent",
                    transition: "border-color .15s ease",
                    "&:hover": {
                      borderColor: "text.primary",
                    },
                  }}
                >
                  TH
                </Typography>
              </ButtonBase>
              <Typography variant="body1" sx={{ fontWeight: 600 }}>
                |
              </Typography>
              <ButtonBase
                onClick={() => {
                  handleLanguageChange("en")
                  handleLocaleToggle("en")
                }}
                sx={{
                  borderRadius: 1,
                  px: 0.5,
                  // ทำให้ underline ตาม content
                  display: "inline-flex",
                }}
              >
                <Typography
                  variant="body1"
                  sx={{
                    fontWeight: 600,
                    lineHeight: 1.2,
                    borderBottom: "2px solid",
                    borderColor: locale === "en" ? "text.primary" : "transparent",
                    transition: "border-color .15s ease",
                    "&:hover": {
                      borderColor: "text.primary",
                    },
                  }}
                >
                  EN
                </Typography>
              </ButtonBase>

              <IconButton
                onClick={() => handleNotification()}
                sx={{
                  color: "#3E8EF7", // 🔵 สีฟ้า
                  position: "relative",
                }}
              >
                <NotificationListener 
                  user_id={user?.id} 
                  isOnNotificationPage={isOnNotificationPage} 
                  hasNotification={hasNotification}
                  setHasNotification={setHasNotification}
                />
              </IconButton>
              {!isMobile && (
                <>
                  <Avatar
                    alt="User"
                    //src="/profile.png"
                    sx={{ 
                      width: 45, 
                      height: 45, 
                      borderRadius: "10px", 
                    }}
                  />
                  <Box sx={{ textAlign: "left", lineHeight: 1 }}>
                    <Typography variant="body1" sx={{ fontWeight: 600 }}>
                      {user?.firstname} {user?.lastname}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {(locale === "th" ? user?.role_name_th : user?.role_name_en) ?? "-"}
                    </Typography>
                  </Box>
                </>
              )}
              <KeyboardArrowDownIcon
                onClick={handleClick}
                sx={{ color: "gray", cursor: "pointer" }}
              />
            </Box>

            {/* ✅ เมนู dropdown */}
            <Menu
              anchorEl={anchorEl}
              open={openDropdown}
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
      )}
    </>
  )
}
