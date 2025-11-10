// app/components/ChatQuickActions.jsx
"use client";

import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Paper,
  useMediaQuery,
} from "@mui/material";
import CreateOutlinedIcon from "@mui/icons-material/CreateOutlined";
import SearchOutlinedIcon from "@mui/icons-material/SearchOutlined";
import ChatSearchModal from "./ChatSearchModal";
import { useSidebar } from "@/app/context/SidebarContext";

export default function ChatQuickActions({
  onNewChat,          // (optional)
  onSearch,           // (optional)
  disabledNew = false,
  disabledSearch = false,
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { toggle } = useSidebar();

  // < md = ปิด sidebar หลังคลิก
  const isTablet = useMediaQuery("(max-width:1200px)");

  const [openSearch, setOpenSearch] = useState(false);

  const items = [
    {
      key: "new",
      label: "แชตใหม่",
      icon: <CreateOutlinedIcon fontSize="small" />,
      href: "/onesqa/chat",
      onClick: () => {
        onNewChat?.();
        router.push("/onesqa/chat");
        // ปิด sidebar บนจอเล็ก
        if (isTablet) toggle();
      },
      disabled: disabledNew,
    },
    {
      key: "search",
      label: "ค้นหาแชต",
      icon: <SearchOutlinedIcon fontSize="small" />,
      onClick: () => {
        onSearch?.();
        setOpenSearch(true);
      },
      disabled: disabledSearch,
    },
  ];

  return (
    <>
      <Paper elevation={0} sx={{ p: 0, backgroundColor: "transparent" }}>
        <List
          dense
          sx={{
            "& .MuiListItemButton-root": {
              borderRadius: 1.5,
              mb: 0.5,
              px: 1,
            },
            "& .MuiListItemIcon-root": { minWidth: 32 },
          }}
        >
          {items.map((it) => {
            const isActive = it.href ? pathname.startsWith(it.href) : false;

            return (
              <ListItemButton
                key={it.key}
                onClick={(e) => {
                  // เรียก action หลัก
                  it.onClick?.(e);
                }}
                disabled={it.disabled}
                selected={isActive}
                disableRipple
                sx={{
                  "& .MuiListItemIcon-root": { color: "common.white" },
                  "& .MuiListItemText-primary": { color: "common.white" },
                  "&.Mui-selected": {
                    bgcolor: (t) => `${t.palette.common.white}22`,
                  },
                }}
              >
                <ListItemIcon>{it.icon}</ListItemIcon>
                <ListItemText
                  primary={it.label}
                  primaryTypographyProps={{ fontSize: 14 }}
                />
              </ListItemButton>
            );
          })}
        </List>
      </Paper>

      {openSearch && (
        <ChatSearchModal
          open={openSearch}
          onClose={() => setOpenSearch(false)}
          onSelect={(item) => {
            console.log("เลือก:", item);
            // ตัวอย่าง: ไปหน้าแชตของ item.id
            // router.push(`/chat/${item.id}`);
            setOpenSearch(false);
          }}
        />
      )}
    </>
  );
}
