"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { NetworkStatus } from "@apollo/client";
import { useQuery, useMutation, useApolloClient } from "@apollo/client/react";
import {
  Box,
  Button,
  Container,
  Paper,
  TextField,
  Typography,
  ToggleButton,
  ToggleButtonGroup,
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  Link,
  useMediaQuery,
  Select,
  MenuItem,
  CircularProgress,
  Collapse,
  List,
  ListItemButton,
  ListItemText,
  IconButton,
  Avatar,
  ListItemIcon,
} from "@mui/material";
import { useTranslations } from "next-intl";
import { GET_USER } from "@/graphql/user/queries";
import ScienceOutlinedIcon from "@mui/icons-material/ScienceOutlined";
import { MULTIPLE_UPLOAD } from "@/graphql/file/mutations";
import BrushOutlinedIcon from "@mui/icons-material/BrushOutlined";
import ChatInputBar from "@/app/components/chat/ChatInputBar";
import { useAuth } from "@/app/context/AuthContext";
import {
  CREATE_CHAT,
  DELETE_CHAT,
  UPDATE_CHAT,
} from "@/graphql/chat/mutations";
import { useTheme } from "next-themes";
import { useParams, useRouter } from "next/navigation";
import { GET_CHATS } from "@/graphql/chat/queries";
import { useInitText } from "@/app/context/InitTextContext";
import { GET_CHATGROUP } from "@/graphql/chatgroup/queries";
import { FolderOutlined, MoreHorizRounded } from "@mui/icons-material";
import ActionKebabMenu from "@/app/components/chat/ActionKebabMenu";
import NewProjectModal from "@/app/components/chat/NewProjectModal";
import Swal from "sweetalert2";
import { UPDATE_CHATGROUP } from "@/graphql/chatgroup/mutations";
import ProjectSearchModal from "@/app/components/chat/ProjectSearchModal";
import { getAiLogo, AI_LOGOS } from "../../../../../util/aiLogo";
import PromptList from "@/app/components/chat/PromptList";
import { GET_PROMPTS } from "@/graphql/prompt/queries";
import { extractErrorMessage, showErrorAlert } from "@/util/errorAlert"; // ปรับ path ให้ตรงโปรเจกต์จริง

const ChatgroupPage = () => {
  const client = useApolloClient();
  const { initText, setInitText, initAttachments, setInitAttachments } = useInitText();
  const router = useRouter();
  const { user } = useAuth();
  const { theme } = useTheme();
  const tDelete = useTranslations("DeleteAlert"); // สำหรับข้อความลบ

  const params = useParams();
  const { id } = params;

  const [attachments, setAttachments] = useState([]); // File[]

  const [model, setModel] = useState("0");

  const [active, setActive] = useState(null);

  const [items, setItems] = useState([]);

  const [rename, setRename] = useState(null);
  // ---- Modal: โครงการใหม่ (แยกเป็นคอมโพเนนต์) ----
  const [newOpen, setNewOpen] = useState(false);

  // --- เมนูจุดสามจุด ---
  const [menuAnchor, setMenuAnchor] = useState(null);
  const [selected, setSelected] = useState(null);
  const menuOpen = Boolean(menuAnchor);

  // state เปิด/ปิด modal ค้นหา
  const [openSearch, setOpenSearch] = useState(false);

  const tInit = useTranslations("Init");

  const isMobile = useMediaQuery("(max-width:600px)"); // < md คือจอเล็ก
  const isTablet = useMediaQuery("(max-width:1200px)"); // < md คือจอเล็ก

  const {
    data: chatsData,
    loading: chatsLoading,
    error: chatsError,
    refetch,
  } = useQuery(GET_CHATS, {
    variables: {
      user_id: user?.id ?? "",
      chatgroup_id: id,
    },
    fetchPolicy: "network-only",
  });
  console.log(chatsData?.chats?.edges);

  const {
    data: promptsData,
    loading: promptsLoading,
    error: promptsError,
    refetch: promptsRefetch,
  } = useQuery(GET_PROMPTS, {
    fetchPolicy: "network-only",
    notifyOnNetworkStatusChange: true, // ✅ ให้ re-render ตอนกำลัง refetch
  });

  const { refetch: chatsRefresh } = useQuery(GET_CHATS, {
    variables: {
      user_id: user?.id ?? "",
      chatgroupMode: "NULL",
    },
    fetchPolicy: "network-only",
  });

  const {
    data: userData,
    loading: userLoading,
    error: userError,
  } = useQuery(GET_USER, {
    fetchPolicy: "network-only",
    variables: {
      id: user?.id,
    },
  });
  console.log(userData?.user?.user_ai);

  const {
    data: chatgroupData,
    loading: chatgroupLoading,
    error: chatgroupError,
  } = useQuery(GET_CHATGROUP, {
    fetchPolicy: "network-only",
    variables: {
      id: id,
    },
  });
  console.log(chatgroupData?.chatgroup);

  const [createChat] = useMutation(CREATE_CHAT);
  const [updateChat] = useMutation(UPDATE_CHAT);
  const [deleteChat] = useMutation(DELETE_CHAT);
  const [mutate, { loading, error }] = useMutation(MULTIPLE_UPLOAD, {
    client,
  });

  useEffect(() => {
    // รอจนกว่าจะมีโครง usersData ก่อน ค่อยประมวลผล
    if (!chatsData?.chats) return;

    const base = [];

    const mapped = (chatsData?.chats?.edges || [])
      .map((e) => e?.node)
      .filter(Boolean)
      .map((n) => ({
        id: n.id,
        model_type: n.ai.model_type,
        label: n.chat_name,
        href: `/onesqa/chat/${n.id}`, // เปลี่ยนเป็น `/chats/${n.id}` ได้ถ้าต้องการลิงก์จริง
      }));

    setItems([...base, ...mapped]);
  }, [chatsData]);

  if (userLoading || chatsLoading || chatgroupLoading || promptsLoading)
    return (
      <Box sx={{ textAlign: "center", mt: 5 }}>
        <CircularProgress />
        <Typography>{tInit("loading")}...</Typography>
      </Box>
    );

  if (userError || chatsError || chatgroupError || promptsError)
    return (
      <Typography color="error" sx={{ mt: 5 }}>
        ❌ {tInit("error")}
      </Typography>
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
            user_id: user.id,
            chat_name: name,
          },
        },
      });
      console.log("✅ Update success:", data.updateChat);
      refetch();
      setNewOpen(false);
      setRename(null);
    } catch (error) {
      console.log(error);
    }
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
      refetch();
    } catch (error) {
      console.log(error);
    }
  };
  const handleDeleteGroup = async () => {
    console.log("selected", selected);

    try {
      // ✅ เรียก mutation ไป backend
      const { data } = await updateChat({
        variables: {
          id: selected?.id,
          input: {
            chatgroup_id: null,
          },
        },
      });
      console.log("✅ Update success:", data.updateChat);
      refetch();
      chatsRefresh();
      setNewOpen(false);
      setRename(null);
    } catch (error) {
      console.log(error);
    }
  };

  const onClear = () => setInitAttachments([]);
  const handleSubmitFile = async () => {
    if (!initAttachments.length) return;
    try {
      const { data } = await mutate({
        variables: {
          files: initAttachments,
          ai_id: model,
          user_id: user?.id,
        },
      });
      console.log(data);
      setInitAttachments(data?.multipleUpload)
      //onClear();
      handleCreateChat()
    } catch (error) {
      showErrorAlert(error, theme, {
        title: "ส่งคำถามไปยัง Model ไม่สำเร็จ",
      });
    }
  };

  const handleCreateChat = async () => {
    try {
      const { data } = await createChat({
        variables: {
          input: {
            ai_id: model,
            user_id: user?.id,
            chat_name: initText,
            chatgroup_id: id,
          },
        },
      });

      console.log("✅ Create success:", data.createChat);
      // ✅ ส่งพารามิเตอร์ new=true ไปด้วย
      router.push(`/onesqa/chat/${data.createChat.id}?new=true`);
      //refetch();
    } catch (error) {
      showErrorAlert(error, theme, {
        title: "ส่งคำถามไปยัง Model ไม่สำเร็จ",
      });
    }
  };

  return (
    <>
      <Box
        sx={{
          px: 5,
          mb: 3,
        }}
      >
        <Select
          value={model}
          onChange={(e) => {
            setModel(e.target.value);
          }}
          size="small"
          sx={{
            border: "1px solid",
            borderColor: "primary.main",
            backgroundColor: "background.paper",
            width: "250px",
          }}
        >
          <MenuItem value="0">กรุณาเลือกโมเดลคำตอบ</MenuItem>
          {(userData?.user?.user_ai ?? []).map((ua) => (
            <MenuItem key={ua.id} value={ua.ai_id ?? ua.id}>
              <Avatar
                src={getAiLogo(ua.ai)}
                alt={ua.ai?.model_type ?? "AI"}
                sx={{ width: 20, height: 20, mr: 0.5 }}
                imgProps={{
                  onError: (e) => (e.currentTarget.src = AI_LOGOS.default),
                }}
              />
              {ua.ai?.model_use_name}
            </MenuItem>
          ))}
        </Select>
      </Box>
      <Container
        maxWidth="md"
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 5,
        }}
      >
        <Box
          sx={{ display: "flex", alignItems: "center", gap: 1.25, minWidth: 0 }}
        >
          <FolderOutlined sx={{ fontSize: { xs: 48, md: 48 } }} />
          <Typography
            component="h1"
            variant="h4" // ปรับขนาดหัวเรื่อง (h4 ใหญ่ขึ้นอีก)
            noWrap
            sx={{
              fontWeight: 700,
              letterSpacing: 0.2,
              lineHeight: 1.2,
              minWidth: 0,
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
            title={chatgroupData?.chatgroup?.chatgroup_name || ""}
          >
            {chatgroupData?.chatgroup?.chatgroup_name ?? "—"}
          </Typography>
        </Box>

        <Box
          sx={{
            width: "100%",
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <ChatInputBar
            value={initText}
            model={model}
            onChange={setInitText}
            attachments={initAttachments}
            setAttachments={setInitAttachments}
            onSend={async (msg) => {
              try {
                const hasFiles = (initAttachments?.length ?? 0) > 0;
                if (hasFiles) {
                  await handleSubmitFile(); // มีไฟล์ -> ใช้อันบน
                } else {
                  await handleCreateChat(); // ไม่มีไฟล์ -> ใช้อันล่าง
                  // หรือถ้าฟังก์ชันของคุณต้องการข้อความ: await handleCreateChat(msg);
                }
                // setInitText(""); // ล้างอินพุตหลังส่ง (ถ้าต้องการ)
              } catch (err) {
                console.error(err);
              }
            }}
            placeholder="ป้อนข้อความ.."
            actions={[
              {
                key: "deep",
                label: "Deep Research",
                onClick: () => console.log("deep"),
                icon: <ScienceOutlinedIcon />,
              },
              {
                key: "canvas",
                label: "Canvas",
                onClick: () => console.log("canvas"),
                icon: <BrushOutlinedIcon />,
              },
            ]}
            onMicClick={() => console.log("mic")}
            onAttachClick={() => console.log("attach menu")}
            onFilesSelected={(fileList) => {
              const files = Array.from(fileList); // FileList -> File[]
              console.log("selected files:", files);
            }}
            accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.ppt,.pptx,.xls,.xlsx,.mp3,.mp4"
            sx={{
              backgroundColor: "background.paper",
              boxShadow: "0 3px 8px rgba(0,0,0,0.05)",
              height: "100%",
              width: "100%",
            }} // ปรับแต่งเพิ่มเติมได้
          />
        </Box>

        <Box
          sx={{
            width: "100%",
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            mb: 1,
          }}
        >
          <PromptList
            steps={promptsData.prompts}
            activeIndex={active}
            onChange={setActive}
          />
        </Box>

        <Box
          sx={{
            width: "90%",
            height: "90%",
          }}
        >
          <Collapse in={open} timeout="auto" unmountOnExit>
            <List disablePadding>
              {items.map((it) => {
                const showMenu = it.label !== "กลุ่มใหม่"; // << เงื่อนไขสำคัญ
                const isActive =
                  showMenu && menuOpen && selected?.label === it.label;

                return (
                  <Link
                    key={it.id}
                    href={it.href}
                    style={{
                      textDecoration: "none",
                      color: "inherit",
                    }}
                  >
                    <ListItemButton
                      sx={{
                        pl: 1.5,
                        pr: 1,
                        minHeight: 30,
                        borderBottom: "1px solid currentColor",
                        paddingBottom: 2, // กันตัวอักษรชนเส้น
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
                          sx={{ color: "background.text" }}
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
        </Box>
      </Container>

      {/* Dropdown เมนูแบบในภาพ */}
      {/* เรียกใช้คอมโพเนนต์เมนูที่แยกออกมา */}
      <ActionKebabMenu
        anchorEl={menuAnchor}
        open={menuOpen}
        onClose={handleCloseMenu}
        onRename={handleRename}
        onChangeGroup={handleUpdateGroup}
        onDelete={handleDelete}
        onDeleteGroup={handleDeleteGroup}
        // ปรับข้อความได้ตามบริบท เช่น "กลุ่ม"
        renameLabel="เปลี่ยนชื่อเเชต"
        changeGroupLabel="ย้ายไปยังโครงการ"
        deleteGroupLabel={`ลบออกจาก ${
          chatgroupData?.chatgroup?.chatgroup_name ?? "—"
        }`}
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
    </>
  );
};

export default ChatgroupPage;
