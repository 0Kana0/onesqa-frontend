"use client";

import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { NetworkStatus } from "@apollo/client";
import { useMutation, useQuery, useApolloClient } from "@apollo/client/react";
import Link from "next/link";
import { GET_CHATS } from "@/graphql/chat/queries";
import {
  CREATE_CHAT,
  DELETE_CHAT,
  UPDATE_CHAT,
} from "@/graphql/chat/mutations";
import {
  Box,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Collapse,
  Typography,
  IconButton,
  Alert,
  CircularProgress,
} from "@mui/material";
import ExpandLess from "@mui/icons-material/ExpandLess";
import ExpandMore from "@mui/icons-material/ExpandMore";
import FolderOutlined from "@mui/icons-material/FolderOutlined";
import CreateNewFolderOutlined from "@mui/icons-material/CreateNewFolderOutlined";
import MoreHorizRounded from "@mui/icons-material/MoreHorizRounded";
import ActionKebabMenu from "./ActionKebabMenu";
import NewProjectModal from "./NewProjectModal";
import Swal from "sweetalert2";
import { useTheme } from "next-themes";
import { useTranslations } from "next-intl";

export default function ChatSidebar() {
  const { user } = useAuth();
  const { theme } = useTheme();
  const tDelete = useTranslations("DeleteAlert"); // สำหรับข้อความลบ
  const [open, setOpen] = useState(true);
  const [rename, setRename] = useState(null);
  // ---- Modal: โครงการใหม่ (แยกเป็นคอมโพเนนต์) ----
  const [newOpen, setNewOpen] = useState(false);

  // const items = [
  //   { label: "แชต ONESQA", href: "#" },
  //   { label: "แชต CRPU", href: "#" },
  //   { label: "แชต UAT", href: "#" },
  //   { label: "แชต ONESQA1", href: "#" },
  //   { label: "แชต CRPU1", href: "#" },
  //   { label: "แชต UAT1", href: "#" },
  //   { label: "แชต ONESQA2", href: "#" },
  //   { label: "แชต CRPU2", href: "#" },
  //   { label: "แชต UAT2", href: "#" },
  // ];
  const [items, setItems] = useState([]);

  // --- เมนูจุดสามจุด ---
  const [menuAnchor, setMenuAnchor] = useState(null);
  const [selected, setSelected] = useState(null);
  const menuOpen = Boolean(menuAnchor);

  const {
    data: chatsData,
    loading: chatsLoading,
    error: chatsError,
    refetch,
  } = useQuery(GET_CHATS, {
    variables: { user_id: user?.id ?? "" },
    fetchPolicy: "network-only",
  });

  const [createChat] = useMutation(CREATE_CHAT);
  const [updateChat] = useMutation(UPDATE_CHAT);
  const [deleteChat] = useMutation(DELETE_CHAT);

  useEffect(() => {
    // รอจนกว่าจะมีโครง usersData ก่อน ค่อยประมวลผล
    if (!chatsData?.chats) return;
  
    const base = [];
  
    const mapped = (chatsData?.chats?.edges || [])
      .map((e) => e?.node)
      .filter(Boolean)
      .map((n) => ({
        id: n.id,
        label: n.chat_name,
        href: "#", // เปลี่ยนเป็น `/chats/${n.id}` ได้ถ้าต้องการลิงก์จริง
      }));
  
    setItems([...base, ...mapped]);
  }, [chatsData]);

  if (chatsLoading)
    return (
      <Box sx={{ textAlign: "center", mt: 5 }}>
        <Typography>
          <CircularProgress />
        </Typography>
      </Box>
    );

  // ----- สถานะโหลด/ผิดพลาดรวมสองฝั่ง -----
  if (chatsError)
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">❌</Alert>
      </Box>
    );

  const handleLink = () => {
    console.log("handleLink");
  };

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
    setRename(selected);
    setNewOpen(true);
    handleCloseMenu();
  };
  const handleDelete = async () => {
    //console.log("delete:", selected?.id, selected?.label);
    if (theme === "dark") {
      Swal.fire({
        title: tDelete("title1"),
        text: tDelete("text1"),
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#d33", // สีแดงสำหรับปุ่มยืนยัน
        cancelButtonColor: "#3E8EF7",
        confirmButtonText: tDelete("confirm"),
        cancelButtonText: tDelete("cancel"),
        background: "#2F2F30", // สีพื้นหลังดำ
        color: "#fff", // สีข้อความเป็นขาว
        titleColor: "#fff", // สี title เป็นขาว
        textColor: "#fff", // สี text เป็นขาว
      }).then(async (result) => {
        if (result.isConfirmed) {
          try {
            // ✅ เรียก mutation ไป backend
            const { data } = await deleteChat({
              variables: {
                id: selected?.id,
              },
            });
            console.log("✅ Delete success:", data.deleteChat);
            refetch();
            handleCloseMenu();
          } catch (error) {
            console.log(error);
          }

          Swal.fire({
            title: tDelete("title2"),
            text: tDelete("text2"),
            icon: "success",
            confirmButtonColor: "#3E8EF7",
            background: "#2F2F30", // สีพื้นหลังดำ
            color: "#fff", // สีข้อความเป็นขาว
            titleColor: "#fff", // สี title เป็นขาว
            textColor: "#fff", // สี text เป็นขาว
          });
        }
      });
    } else {
      Swal.fire({
        title: tDelete("title1"),
        text: tDelete("text1"),
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#d33", // สีแดงสำหรับปุ่มยืนยัน
        cancelButtonColor: "#3E8EF7",
        confirmButtonText: tDelete("confirm"),
        cancelButtonText: tDelete("cancel"),
      }).then(async (result) => {
        if (result.isConfirmed) {
          try {
            // ✅ เรียก mutation ไป backend
            const { data } = await deleteChat({
              variables: {
                id: selected?.id,
              },
            });
            console.log("✅ Delete success:", data.deleteChat);
            refetch();
            handleCloseMenu();
          } catch (error) {
            console.log(error);
          }

          Swal.fire({
            title: tDelete("title2"),
            text: tDelete("text2"),
            icon: "success",
            confirmButtonColor: "#3E8EF7",
          });
        }
      });
    }
  };

  const openNewProject = (e) => {
    e?.preventDefault?.();
    e?.stopPropagation?.();
    setNewOpen(true);
  };
  const closeNewProject = () => {
    setNewOpen(false);
    setRename(null)
  }
  const handleUpdateChat = async (name) => {
    // TODO: เรียก API / mutation สร้างโครงการ
    console.log("เเก้ไขชื่อเเชต:", name);

    try {
      // ✅ เรียก mutation ไป backend
      const { data } = await updateChat({
        variables: {
          id: rename?.id,
          input: {
            user_id: user.id,
            chat_name: name,
          },
        },
      });
      console.log("✅ Create success:", data.updateChat);
      refetch();
      setNewOpen(false);
      setRename(null)
    } catch (error) {
      console.log(error);
    }
  }

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
              <Typography sx={{ fontSize: 13.5, color: "common.white" }}>
                เเชต
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
              const isActive =
                showMenu && menuOpen && selected?.label === it.label;

              return (
                <Link
                  key={it.label}
                  href={it.href}
                  style={{ textDecoration: "none", color: "inherit" }}
                >
                  <ListItemButton
                    onClick={handleLink}
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
                            "&:hover .kebab, &:hover .item-icon": {
                              opacity: 1,
                            },
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
                        sx={{ color: "common.white" }}
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
        renameLabel="เปลี่ยนชื่อเเชต"
        deleteLabel="ลบเเชต"
        // paperSx={{ minWidth: 200 }} // ถ้าต้องการปรับแต่งเพิ่ม
      />

      {/* ใช้คอมโพเนนต์ Modal ที่แยกไว้ */}
      <NewProjectModal
        open={newOpen}
        onClose={closeNewProject}
        onCreate={handleUpdateChat}
        initialName={rename?.label} // ถ้าต้องการค่าเริ่มต้น
        title={"เเก้ไขชื่อเเชต"}
        label = "ชื่อเเชต"
        confirmLabel={"เเก้ไข"}
      />
    </Box>
  );
}
