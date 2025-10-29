// app/components/ChatQuickActions.jsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Paper,
} from "@mui/material";
import CreateOutlinedIcon from "@mui/icons-material/CreateOutlined";
import SearchOutlinedIcon from "@mui/icons-material/SearchOutlined";
import ChatSearchModal from "./ChatSearchModal";

export default function NewChatButton({
  onNewChat,   // (optional) callback เมื่อกด "แชตใหม่"
  onSearch,    // (optional) callback เมื่อกด "ค้นหาแชต"
  disabledNew = false,
  disabledSearch = false,
}) {
  const router = useRouter();
  const pathname = usePathname();
  
  // state เปิด/ปิด modal ค้นหา
  const [openSearch, setOpenSearch] = useState(false);

  const items = [
    {
      key: "new",
      label: "แชตใหม่",
      icon: <CreateOutlinedIcon fontSize="small" />,
      onClick: () => router.push("/onesqa/chat"),
      disabled: disabledNew,
    },
    {
      key: "search",
      label: "ค้นหาแชต",
      icon: <SearchOutlinedIcon fontSize="small" />,
      onClick: () => setOpenSearch(true),
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
            "& .MuiListItemIcon-root": {
              minWidth: 32,
            },
          }}
        >
          {items.map((it) => {
            const selected = pathname === it.href;
            return (
              <ListItemButton
                key={it.key}
                onClick={it.onClick}
                disabled={it.disabled}
                disableRipple
                sx={{
                  "& .MuiListItemIcon-root": { color: "common.white" },
                  "& .MuiListItemText-primary": { color: "common.white" },
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

      <ChatSearchModal
        open={openSearch}
        onClose={() => setOpenSearch(false)}
        onSelect={(item) => {
          // ทำอะไรก็ได้เมื่อเลือกผลลัพธ์
          console.log("เลือก:", item);
          // ตัวอย่าง: ไปหน้าแชตของ item.id
          // router.push(`/chat/${item.id}`);
          setOpenSearch(false);
        }}
      />
    </>
  );
}
