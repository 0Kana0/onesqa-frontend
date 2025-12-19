"use client";

import { useEffect, useState, useRef, useCallback, useMemo } from "react";
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
  Avatar,
  useMediaQuery,
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
import ProjectSearchModal from "./ProjectSearchModal";
import { getAiLogo, AI_LOGOS } from "@/util/aiLogo";
import { useSidebar } from "@/app/context/SidebarContext";

const PAGE_SIZE = 15; // ✅ lazy loading

export default function ChatSidebar() {
  const client = useApolloClient();
  const { user } = useAuth();
  const { theme } = useTheme();
  const { toggle } = useSidebar(); // ✅ ดึงจาก Context

  const tDelete = useTranslations("DeleteAlert"); // สำหรับข้อความลบ
  const isMobile = useMediaQuery("(max-width:600px)");
  const isTablet = useMediaQuery("(max-width:1200px)"); // < md คือจอเล็ก

  const [open, setOpen] = useState(true);
  const [rename, setRename] = useState(null);
  // ---- Modal: โครงการใหม่ (แยกเป็นคอมโพเนนต์) ----
  const [newOpen, setNewOpen] = useState(false);

  const pathname = usePathname();
  const router = useRouter();
  const params = useParams();
  const { id } = params;
  console.log("find id", id);
  console.log("pathname", pathname);

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

  // --- เมนูจุดสามจุด ---
  const [menuAnchor, setMenuAnchor] = useState(null);
  const [selected, setSelected] = useState(null);
  const menuOpen = Boolean(menuAnchor);

  // ===============================
  // ✅ lazy loading states
  // ===============================
  const [edges, setEdges] = useState([]);
  const [endCursor, setEndCursor] = useState(null);
  const [hasNextPage, setHasNextPage] = useState(false);

  const loaderRef = useRef(null);

  // state เปิด/ปิด modal ค้นหา
  const [openSearch, setOpenSearch] = useState(false);

  const { data, loading, error, fetchMore, refetch, networkStatus } = useQuery(
    GET_CHATS,
    {
      variables: {
        user_id: user?.id ?? "",
        chatgroupMode: "NULL",
        first: PAGE_SIZE,
        after: null,
      },
      skip: !user?.id,
      notifyOnNetworkStatusChange: true,
      fetchPolicy: "network-only",
    }
  );

  const { refetch: chatgroupsRefresh } = useQuery(GET_CHATS, {
    variables: {
      user_id: user?.id ?? "",
      chatgroup_id: id,
    },
    fetchPolicy: "network-only",
  });

  const [createChat] = useMutation(CREATE_CHAT);
  const [updateChat] = useMutation(UPDATE_CHAT);
  const [deleteChat] = useMutation(DELETE_CHAT);

  // ===============================
  // รวม edges (กัน duplicate)
  // ===============================
  useEffect(() => {
    const conn = data?.chats;
    if (!conn) return;

    const incoming = conn.edges ?? [];
    const seen = new Set();
    const merged = [];

    for (const e of incoming) {
      if (!seen.has(e.cursor)) {
        seen.add(e.cursor);
        merged.push(e);
      }
    }

    setEdges(merged);
    setEndCursor(conn.pageInfo?.endCursor ?? null);
    setHasNextPage(Boolean(conn.pageInfo?.hasNextPage));
  }, [data?.chats]);

  // ===============================
  // โหลดเพิ่ม
  // ===============================
  const loadMore = useCallback(async () => {
    if (!hasNextPage || !endCursor) return;

    const res = await fetchMore({
      variables: {
        user_id: user?.id,
        chatgroupMode: "NULL",
        first: PAGE_SIZE,
        after: endCursor,
      },
    });

    const conn = res?.data?.chats;
    if (!conn) return;

    setEdges((prev) => {
      const seen = new Set(prev.map((e) => e.cursor));
      const merged = [...prev];
      for (const e of conn.edges ?? []) {
        if (!seen.has(e.cursor)) {
          seen.add(e.cursor);
          merged.push(e);
        }
      }
      return merged;
    });

    setEndCursor(conn.pageInfo?.endCursor ?? null);
    setHasNextPage(Boolean(conn.pageInfo?.hasNextPage));
  }, [fetchMore, endCursor, hasNextPage, user?.id]);

  // ===============================
  // IntersectionObserver
  // ===============================
  useEffect(() => {
    const el = loaderRef.current;
    if (!el || !hasNextPage) return;

    let locked = false;
    const io = new IntersectionObserver(
      async (entries) => {
        if (entries[0].isIntersecting && !locked) {
          locked = true;
          try {
            await loadMore();
          } finally {
            setTimeout(() => (locked = false), 150);
          }
        }
      },
      { threshold: 0 }
    );

    io.observe(el);
    return () => io.disconnect();
  }, [hasNextPage, loadMore]);

  // ===============================
  // แปลงเป็น items (เหมือนเดิม)
  // ===============================
  const items = useMemo(
    () =>
      edges
        .map((e) => e.node)
        .filter(Boolean)
        .map((n) => ({
          id: n.id,
          model_type: n.ai.model_type,
          label: n.chat_name,
          href: `/onesqa/chat/${n.id}`,
        })),
    [edges]
  );

  if (loading && networkStatus === NetworkStatus.loading)
    return (
      <Box sx={{ textAlign: "center", mt: 5 }}>
        <CircularProgress />
      </Box>
    );

  if (error)
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">❌</Alert>
      </Box>
    );

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

    // ปิด sidebar บนจอเล็ก
    if (isTablet) toggle();

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
            if (id === selected?.id && pathname === `/onesqa/chat/${id}`)
              router.push("/onesqa/chat");
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
            if (id === selected?.id && pathname === `/onesqa/chat/${id}`)
              router.push("/onesqa/chat");
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
  const handleUpdateGroup = async () => {
    setRename(selected);
    setOpenSearch(true);
    handleCloseMenu();
  };
  const handleUpdateGroupData = async (item) => {
    console.log("rename", rename);

    try {
      // ✅ เรียก mutation ไป backend
      const { data } = await updateChat({
        variables: {
          id: rename?.id,
          input: {
            chatgroup_id: item.id,
          },
        },
      });
      console.log("✅ Update success:", data.updateChat);
      // refetch();
      // if (id === item.id && pathname === `/onesqa/chat/group/${id}`)
      //   console.log("dasddsaddda");

      //   chatgroupsRefresh();
      await client.refetchQueries({
        include: [GET_CHATS],
      });
    } catch (error) {
      console.log(error);
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
  const handleUpdateChat = async (name) => {
    // TODO: เรียก API / mutation สร้างโครงการ
    console.log("เเก้ไขชื่อเเชต:", name);

    try {
      // ✅ เรียก mutation ไป backend
      const { data } = await updateChat({
        variables: {
          id: rename?.id,
          input: {
            user_id: user?.id,
            chat_name: name,
          },
        },
      });
      console.log("✅ Create success:", data.updateChat);
      refetch();
      setNewOpen(false);
      setRename(null);
    } catch (error) {
      console.log(error);
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
              const isPage = id === it.id && pathname === `/onesqa/chat/${id}`;

              return (
                <Link
                  key={it.id}
                  onClick={isTablet ? toggle : undefined} // ✅ toggle เฉพาะใน mobile
                  href={it.href}
                  style={{ textDecoration: "none", color: "inherit" }}
                >
                  <ListItemButton
                    sx={{
                      pl: 1.5,
                      pr: 1,
                      minHeight: 30,
                      backgroundColor: isPage
                        ? "rgba(255,255,255,0.2)"
                        : "transparent",
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
                    <Avatar
                      src={getAiLogo(it)}
                      alt={it.model_type ?? "AI"}
                      sx={{ width: 20, height: 20, mr: 0.5 }}
                      imgProps={{
                        onError: (e) =>
                          (e.currentTarget.src = AI_LOGOS.default),
                      }}
                    />
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

            {items.length === 0 && (
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  width: "100%",
                }}
              >
                <Typography variant="caption" sx={{ opacity: 0.6 }}>
                  -- ไม่มีแชต --
                </Typography>
              </Box>
            )}

            {/* ✅ Sentinel */}
            <Box
              ref={loaderRef}
              sx={{ display: "flex", justifyContent: "center", py: 1 }}
            >
              {networkStatus === NetworkStatus.fetchMore && (
                <Typography variant="caption" sx={{ opacity: 0.6 }}>
                  Loading...
                </Typography>
              )}
              {!hasNextPage && items.length > 0 && (
                <Typography
                  variant="caption"
                  sx={{ opacity: 0.6 }}
                ></Typography>
              )}
            </Box>
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
        onChangeGroup={handleUpdateGroup}
        onDelete={handleDelete}
        // ปรับข้อความได้ตามบริบท เช่น "กลุ่ม"
        renameLabel="เปลี่ยนชื่อเเชต"
        changeGroupLabel="ย้ายไปยังกลุ่ม"
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
        label="ชื่อเเชต"
        confirmLabel={"เเก้ไข"}
      />

      {openSearch && (
        <ProjectSearchModal
          open={openSearch}
          onClose={() => setOpenSearch(false)}
          onSelect={(item) => {
            // ทำอะไรก็ได้เมื่อเลือกผลลัพธ์
            console.log("เลือก:", item);
            handleUpdateGroupData(item);
            // ตัวอย่าง: ไปหน้าแชตของ item.id
            // router.push(`/chat/${item.id}`);
            setOpenSearch(false);
          }}
        />
      )}
    </Box>
  );
}
