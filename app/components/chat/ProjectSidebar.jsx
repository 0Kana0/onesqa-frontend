"use client";

import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { NetworkStatus } from "@apollo/client";
import { useMutation, useQuery, useApolloClient } from "@apollo/client/react";
import { GET_CHATGROUPS } from "@/graphql/chatgroup/queries";
import {
  CREATE_CHATGROUP,
  DELETE_CHATGROUP,
  UPDATE_CHATGROUP,
} from "@/graphql/chatgroup/mutations";
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
  Alert,
  CircularProgress,
  useMediaQuery,
  Tooltip
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
import { useParams, usePathname, useRouter } from "next/navigation";
import { useSidebar } from "@/app/context/SidebarContext";
import { GET_CHATS } from "@/graphql/chat/queries";
import { useLanguage } from "@/app/context/LanguageContext";

export default function ProjectSidebar() {
  const client = useApolloClient();
  const { locale } = useLanguage();
  const { user } = useAuth();
  const { theme } = useTheme();
  const { toggle } = useSidebar(); // ✅ ดึงจาก Context

  const tChatSidebar = useTranslations("ChatSidebar");
  const tDelete = useTranslations("DeleteAlert"); // สำหรับข้อความลบ
  const isMobile = useMediaQuery("(max-width:600px)");
  const isTablet = useMediaQuery("(max-width:1200px)"); // < md คือจอเล็ก

  const MAX_VISIBLE = 5;
  const [showAll, setShowAll] = useState(false);

  const [open, setOpen] = useState(true);
  const [rename, setRename] = useState(null);
  // ---- Modal: โครงการใหม่ (แยกเป็นคอมโพเนนต์) ----
  const [newOpen, setNewOpen] = useState(false);

  const pathname = usePathname();
  const router = useRouter();
  const params = useParams();
  const { id } = params;
  // console.log("find id", id);
  // console.log("pathname", pathname);

  // state ไว้เก็บ chatgroupId ที่ครอบ chat id ปัจจุบัน
  const [currentGroupId, setCurrentGroupId] = useState(null);

  // const items = [
  //   { label: "กลุ่มใหม่", href: "#" },
  //   { label: "ONESQA", href: "#" },
  //   { label: "CRPU", href: "#" },
  //   { label: "UAT", href: "#" },
  // ];
  const [items, setItems] = useState([]);

  // --- เมนูจุดสามจุด ---
  const [menuAnchor, setMenuAnchor] = useState(null);
  const [selected, setSelected] = useState(null);
  const menuOpen = Boolean(menuAnchor);

  const isOverflow = (el) => el && el.scrollWidth > el.clientWidth;
  const [showTip, setShowTip] = useState(false);

  const {
    data: chatgroupsData,
    loading: chatgroupsLoading,
    error: chatgroupsError,
    refetch,
  } = useQuery(GET_CHATGROUPS, {
    variables: { user_id: user?.id ?? "" },
    fetchPolicy: "network-only",
  });

  const { refetch: chatsRefresh } = useQuery(GET_CHATS, {
    variables: {
      user_id: user?.id ?? "",
      chatgroupMode: "NULL",
    },
    fetchPolicy: "network-only",
  });

  const [createChatgroup] = useMutation(CREATE_CHATGROUP);
  const [updateChatgroup] = useMutation(UPDATE_CHATGROUP);
  const [deleteChatgroup] = useMutation(DELETE_CHATGROUP);

  // console.log(user?.id);
  // console.log(chatgroupsData?.chatgroups?.edges);

  useEffect(() => {
    // รอจนกว่าจะมีโครง usersData ก่อน ค่อยประมวลผล
    if (!chatgroupsData?.chatgroups) return;

    const base = [{ id: 0, label: tChatSidebar("newgroup"), href: "#" }];

    const mapped = (chatgroupsData?.chatgroups?.edges || [])
      .map((e) => e?.node)
      .filter(Boolean)
      .map((n) => ({
        id: n.id,
        label: n.chatgroup_name,
        href: `/onesqa/chat/group/${n.id}`, // เปลี่ยนเป็น `/chatgroups/${n.id}` ได้ถ้าต้องการลิงก์จริง
      }));

    setItems([...base, ...mapped]);
  }, [chatgroupsData, locale]);

  useEffect(() => {
    if (!chatgroupsData?.chatgroups || !id) return;

    // หา group ที่มี chat.id ตรงกับ param id
    const edges = chatgroupsData.chatgroups.edges || [];
    let foundGroupId = null;

    for (const edge of edges) {
      const node = edge?.node;
      if (!node) continue;

      const chats = node.chat || [];
      const hasChat = chats.some((c) => String(c?.id) === String(id));
      if (hasChat) {
        foundGroupId = node.id;
        break;
      }
    }

    setCurrentGroupId(foundGroupId); // ถ้าไม่เจอจะเป็น null
  }, [chatgroupsData, id]);

  // console.log(selected);

  if (chatgroupsLoading)
    return (
      <Box sx={{ textAlign: "center", mt: 5 }}>
        <Typography>
          <CircularProgress />
        </Typography>
      </Box>
    );

  // ----- สถานะโหลด/ผิดพลาดรวมสองฝั่ง -----
  if (chatgroupsError)
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">❌</Alert>
      </Box>
    );

  const baseItem = items.find((it) => it.label === tChatSidebar("newgroup"),);
  const groupItems = items.filter((it) => it.label !== tChatSidebar("newgroup"),);

  const visibleGroups = showAll ? groupItems : groupItems.slice(0, MAX_VISIBLE);

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
    // console.log("rename:", selected?.label);
    setRename(selected);
    setNewOpen(true);
    handleCloseMenu();
  };
  const handleDelete = async () => {
    //console.log("delete:", selected?.id, selected?.label);

    // ปิด sidebar บนจอเล็ก
    if (isTablet) toggle();

    if (theme === "dark") {
      Swal.fire({
        title: tDelete("title1"),
        text: tDelete("textgroup1"),
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
        // ✅ กด Enter = confirm (เพราะโฟกัสอยู่ที่ปุ่ม confirm)
        focusConfirm: true,
        didOpen: () => {
          Swal.getConfirmButton()?.focus();
        },
      }).then(async (result) => {
        if (result.isConfirmed) {
          try {
            // ✅ เรียก mutation ไป backend
            const { data } = await deleteChatgroup({
              variables: {
                id: selected?.id,
              },
            });
            // console.log("✅ Delete success:", data.deleteChatgroup);
            refetch();
            //chatsRefresh();
            await client.refetchQueries({
              include: [GET_CHATS],
            });
            handleCloseMenu();
            if (id === selected?.id && pathname === `/onesqa/chat/group/${id}`)
              router.replace("/onesqa/chat");
          } catch (error) {
            // console.log(error);
          }

          Swal.fire({
            title: tDelete("title2"),
            text: tDelete("textgroup2"),
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
        text: tDelete("textgroup1"),
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#d33", // สีแดงสำหรับปุ่มยืนยัน
        cancelButtonColor: "#3E8EF7",
        confirmButtonText: tDelete("confirm"),
        cancelButtonText: tDelete("cancel"),
        // ✅ กด Enter = confirm (เพราะโฟกัสอยู่ที่ปุ่ม confirm)
        focusConfirm: true,
        didOpen: () => {
          Swal.getConfirmButton()?.focus();
        },
      }).then(async (result) => {
        if (result.isConfirmed) {
          try {
            // ✅ เรียก mutation ไป backend
            const { data } = await deleteChatgroup({
              variables: {
                id: selected?.id,
              },
            });
            // console.log("✅ Delete success:", data.deleteChatgroup);
            refetch();
            //chatsRefresh();
            await client.refetchQueries({
              include: [GET_CHATS],
            });
            handleCloseMenu();
            if (id === selected?.id && pathname === `/onesqa/chat/group/${id}`)
              router.replace("/onesqa/chat");
          } catch (error) {
            // console.log(error);
          }

          Swal.fire({
            title: tDelete("title2"),
            text: tDelete("textgroup2"),
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
    setRename(null);
  };

  const handleCreateProject = async (name) => {
    // TODO: เรียก API / mutation สร้างโครงการ
    // console.log("สร้างกลุ่ม:", name);

    try {
      // ✅ เรียก mutation ไป backend
      const { data } = await createChatgroup({
        variables: {
          input: {
            user_id: user?.id,
            chatgroup_name: name,
          },
        },
      });
      // console.log("✅ Create success:", data.createChatgroup);
      refetch();
      setNewOpen(false);
    } catch (error) {
      // console.log(error);
    }
  };
  const handleUpdateproject = async (name) => {
    // TODO: เรียก API / mutation สร้างโครงการ
    // console.log("เเก้ไขชื่อกลุ่ม:", name);

    try {
      // ✅ เรียก mutation ไป backend
      const { data } = await updateChatgroup({
        variables: {
          id: rename?.id,
          input: {
            user_id: user?.id,
            chatgroup_name: name,
          },
        },
      });
      // console.log("✅ Create success:", data.updateChatgroup);
      refetch();
      setNewOpen(false);
      setRename(null);
    } catch (error) {
      // console.log(error);
    }
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
              <Typography sx={{ fontSize: 13.5, color: "common.white" }}>
                {tChatSidebar("collapse1")}
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
            {/* กลุ่มใหม่ (แสดงเสมอ) */}
            {baseItem && (
              <Link
                key={baseItem.label}
                href={baseItem.href}
                onClick={isTablet ? toggle : undefined}
                style={{ textDecoration: "none", color: "inherit" }}
              >
                <ListItemButton
                  onClick={openNewProject}
                  sx={{ pl: 1.5, pr: 1, minHeight: 30 }}
                  disableRipple
                >
                  <ListItemIcon sx={{ minWidth: 36, color: "common.white" }}>
                    <CreateNewFolderOutlined fontSize="small" />
                  </ListItemIcon>
                  <ListItemText
                    primary={baseItem.label}
                    primaryTypographyProps={{ fontSize: 14 }}
                  />
                </ListItemButton>
              </Link>
            )}

            {/* กลุ่มจริง (จำกัด 5 ตัว) */}
            {visibleGroups.map((it) => {
              const isActive = menuOpen && selected?.label === it.label;
              const isPage =
                id === it.id && pathname === `/onesqa/chat/group/${id}`;
              const isGroup =
                currentGroupId === it.id && pathname === `/onesqa/chat/${id}`;

              return (
                <Link
                  key={it.id}
                  href={it.href}
                  onClick={isTablet ? toggle : undefined}
                  style={{ textDecoration: "none", color: "inherit" }}
                >
                  <Tooltip title={it.label} arrow placement="top">
                    <Box>
                      <ListItemButton
                        sx={{
                          pl: 1.5,
                          pr: 1,
                          minHeight: 30,
                          display: "flex",
                          alignItems: "center",
                          gap: 0.5,
                          backgroundColor:
                            isPage || isGroup ? "rgba(255,255,255,0.2)" : "transparent",
                          "& .kebab": {
                            opacity: isActive ? 1 : 0,
                            transition: "opacity .15s",
                            flexShrink: 0,
                          },
                          "&:hover .kebab, &:hover .item-icon": {
                            opacity: 1,
                          },
                        }}
                        disableRipple
                      >
                        <ListItemIcon
                          className="item-icon"
                          sx={{ minWidth: 36, color: "common.white", flexShrink: 0 }}
                        >
                          <FolderOutlined fontSize="small" />
                        </ListItemIcon>

                        <ListItemText
                          primary={it.label}
                          sx={{ flex: 1, minWidth: 0 }}
                          primaryTypographyProps={{
                            fontSize: 14,
                            noWrap: true,
                            sx: { overflow: "hidden", textOverflow: "ellipsis" },
                          }}
                        />

                        <IconButton
                          className="kebab"
                          size="small"
                          edge="end"
                          onClick={(e) => {
                            e.preventDefault();    // ✅ กันไม่ให้กดแล้วเปิดลิงก์
                            e.stopPropagation();   // ✅ กัน event bubble
                            handleOpenMenu(e, it);
                          }}
                          sx={{ color: "common.white" }}
                          disableRipple
                        >
                          <MoreHorizRounded fontSize="small" />
                        </IconButton>
                      </ListItemButton>
                    </Box>
                  </Tooltip>
                </Link>
              );
            })}

            {groupItems.length > MAX_VISIBLE && (
              <Box sx={{ textAlign: "center", mt: 0.5 }}>
                <Typography
                  sx={{
                    fontSize: "12px",
                    cursor: "pointer",
                    opacity: 0.7,
                    "&:hover": { opacity: 1 },
                  }}
                  onClick={() => setShowAll((v) => !v)}
                >
                  {showAll ? "แสดงน้อยลง" : "แสดงทั้งหมด"}
                </Typography>
              </Box>
            )}

            {items.length === 1 && (
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  minHeight: 50, // ปรับได้ตามความสูง sidebar
                  width: "100%",
                }}
              >
                <Typography variant="caption" sx={{ opacity: 0.6 }}>
                  -- {tChatSidebar("notfound")} --
                </Typography>
              </Box>
            )}
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
        renameLabel={tChatSidebar("groupdropdownrename")}
        deleteLabel={tChatSidebar("groupdropdowndelete")}
        // paperSx={{ minWidth: 200 }} // ถ้าต้องการปรับแต่งเพิ่ม
      />

      {/* ใช้คอมโพเนนต์ Modal ที่แยกไว้ */}
      <NewProjectModal
        open={newOpen}
        onClose={closeNewProject}
        onCreate={rename !== null ? handleUpdateproject : handleCreateProject}
        initialName={rename !== null ? rename.label : ""} // ถ้าต้องการค่าเริ่มต้น
        title={rename !== null ? tChatSidebar("grouptitleedit") : tChatSidebar("grouptitlenew")}
        label={tChatSidebar("grouplabel")}
        confirmLabel={rename !== null ? tChatSidebar("groupcomfirmedit") : tChatSidebar("groupcomfirmnew")}
      />
    </Box>
  );
}
