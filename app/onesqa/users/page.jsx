"use client";

import React, { useState, useEffect, useCallback } from "react";
import { NetworkStatus } from "@apollo/client";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useApolloClient } from "@apollo/client/react";
import dayjs from "dayjs"; // ✅ เพิ่มบรรทัดนี้
import {
  Box,
  Typography,
  TextField,
  InputAdornment,
  Select,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Switch,
  IconButton,
  CircularProgress,
  useMediaQuery,
  Button,
  Stack,
} from "@mui/material";
import { GET_USERS } from "@/graphql/user/queries";
import { GET_ROLES } from "@/graphql/role/queries";
import { UPDATE_USER, SYNC_USERS } from "@/graphql/user/mutations";
import { useTheme } from "next-themes";
import SearchIcon from "@mui/icons-material/Search";
import DescriptionIcon from "@mui/icons-material/Description";
import UserTableToolbar from "@/app/components/UserTableToolbar";
import { useTranslations } from "next-intl";
import { exportUsersToExcel } from "@/util/exportToExcel";
import { useRequireRole } from "@/hook/useRequireRole";
import SmartPagination from "@/app/components/SmartPagination";
import HistoryIcon from "@mui/icons-material/History";
import {
  closeLoading,
  showLoading,
  showSuccessAlert,
} from "@/util/loadingModal";
import { showErrorAlert } from "@/util/errorAlert";
import { useLanguage } from "@/app/context/LanguageContext";
import { GET_GROUP_WITH_USER_COUNT } from "@/graphql/group/queries";

const normalize = (v) => (v === "ทั้งหมด" || v === "" || v == null ? null : v);
const normalizeText = (v) => {
  const s = (v ?? "").trim();
  return s === "" ? null : s;
};

export default function UserPage() {
  const client = useApolloClient();
  const { locale } = useLanguage();
  const { theme } = useTheme();
  const router = useRouter();
  const t = useTranslations("UserPage");
  const tInit = useTranslations("Init");
  const tusererror = useTranslations('UserError');
  const tError = useTranslations('ErrorAlert');

  const isMobile = useMediaQuery("(max-width:600px)"); // < md คือจอเล็ก
  const isTablet = useMediaQuery("(max-width:1200px)"); // < md คือจอเล็ก

  // 🔹 state
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("ทั้งหมด");
  const [statusFilter, setStatusFilter] = useState("ทั้งหมด");
  const [page, setPage] = useState(1);
  const rowsPerPage = 5; // ✅ แสดง 5 แถวต่อหน้า

  const [roles, setRoles] = useState([]);

  const [users, setUsers] = useState([]);
  const [totalCount, setTotalCount] = useState(0);

  const [pendingIds, setPendingIds] = useState(new Set());
  const isPending = useCallback((id) => pendingIds.has(id), [pendingIds]);

  const {
    data: usersData,
    loading: usersLoading,
    error: usersError,
    refetch: usersRefetch,
    networkStatus,
  } = useQuery(GET_USERS, {
    fetchPolicy: "cache-and-network",
    notifyOnNetworkStatusChange: true,
    variables: {
      page: page,
      pageSize: rowsPerPage,
      where: {
        role: normalize(roleFilter),
        status: normalize(statusFilter),
        search: normalizeText(search),
      },
    },
  });

  const {
    data: rolesData,
    loading: rolesLoading,
    error: rolesError,
  } = useQuery(GET_ROLES, {
    fetchPolicy: "network-only",
  });

  const {
    data: groupWithUserCountData,
    loading: groupWithUserCountLoading,
    error: groupWithUserCountError,
    refetch: groupWithUserCountRefetch,
  } = useQuery(GET_GROUP_WITH_USER_COUNT, {
    fetchPolicy: "network-only",
  });

  //console.log(usersData);

  // ✅ state ของ users (เก็บค่า aiAccess แบบ toggle ได้)
  // const [users, setUsers] = useState([
  //   {
  //     id: 1,
  //     name: "John Doe",
  //     email: "john.doe@gmail.com",
  //     role: "ผู้ดูแลระบบ",
  //     department: "เทคโนโลยีสารสนเทศ",
  //     status: "ใช้งานอยู่",
  //     aiAccess: true,
  //     lastLogin: "2024-01-15 14:30",
  //   },
  //   {
  //     id: 2,
  //     name: "Jane Smith",
  //     email: "jane.smith@gmail.com",
  //     role: "ผู้ประเมินภายนอก",
  //     department: "การประเมินคุณภาพ",
  //     status: "ใช้งานอยู่",
  //     aiAccess: false,
  //     lastLogin: "2024-01-16 09:20",
  //   },
  //   {
  //     id: 3,
  //     name: "Alex Ray",
  //     email: "alex.ray@gmail.com",
  //     role: "เจ้าหน้าที่",
  //     department: "บริหารงานทั่วไป",
  //     status: "ไม่ใช้งาน",
  //     aiAccess: false,
  //     lastLogin: "2024-01-10 15:45",
  //   },
  //   {
  //     id: 4,
  //     name: "Emma Watson",
  //     email: "emma.watson@gmail.com",
  //     role: "เจ้าหน้าที่",
  //     department: "ประเมินคุณภาพ",
  //     status: "ใช้งานอยู่",
  //     aiAccess: true,
  //     lastLogin: "2024-02-02 10:00",
  //   },
  //   {
  //     id: 5,
  //     name: "Robert Brown",
  //     email: "robert.brown@gmail.com",
  //     role: "เจ้าหน้าที่",
  //     department: "บริหารงานทั่วไป",
  //     status: "ไม่ใช้งาน",
  //     aiAccess: false,
  //     lastLogin: "2024-02-01 08:45",
  //   },
  //   {
  //     id: 6,
  //     name: "Lisa Johnson",
  //     email: "lisa.johnson@gmail.com",
  //     role: "เจ้าหน้าที่",
  //     department: "การเงิน",
  //     status: "ใช้งานอยู่",
  //     aiAccess: true,
  //     lastLogin: "2024-02-03 13:10",
  //   },
  // ]);

  const [updateUser] = useMutation(UPDATE_USER);
  const [syncUsersFromApi, { loading: syncUsersFromApiSending }] = useMutation(SYNC_USERS);

  // ✅ เมื่อ toggle ปุ่ม
  const handleToggleAccess = useCallback(
    async (id, nextChecked) => {
      if (pendingIds.has(id)) return; // กันกดซ้ำระหว่างกำลังยิง API

      // เก็บค่าเดิมไว้เพื่อ rollback
      const current = users.find((u) => u.id === id);
      if (!current) return;
      const prevChecked = !!current.aiAccess;

      // 1) ล็อกปุ่มของแถวนั้น
      setPendingIds((prev) => {
        const s = new Set(prev);
        s.add(id);
        return s;
      });

      // 2) optimistic update ทันที
      setUsers((prev) =>
        prev.map((u) => (u.id === id ? { ...u, aiAccess: nextChecked } : u))
      );

      try {
        // 3) ยิงจริงไป backend (ใช้ nextChecked ไม่ใช่ !user.aiAccess)
        const { data } = await updateUser({
          variables: {
            id,
            input: { ai_access: nextChecked },
          },
        });

        // 4) ซิงก์ค่าจากเซิร์ฟเวอร์ เผื่อ backend ปรับ logic เอง
        const serverValue = !!data?.updateUser?.ai_access;
        setUsers((prev) =>
          prev.map((u) => (u.id === id ? { ...u, aiAccess: serverValue } : u))
        );
      } catch (err) {
        // console.log("Update failed:", err);
        // 5) rollback ถ้ามี error
        setUsers((prev) =>
          prev.map((u) => (u.id === id ? { ...u, aiAccess: prevChecked } : u))
        );
      } finally {
        // 6) ปลดล็อก
        setPendingIds((prev) => {
          const s = new Set(prev);
          s.delete(id);
          return s;
        });
      }
    },
    [users, pendingIds, updateUser]
  );
  const getRoleByName = useCallback(
    (name) => {
      if (!name) return null;

      return (
        roles.find(
          (r) =>
            r.role_name === name ||
            r.role_name_th === name ||
            r.role_name_en === name
        ) ?? null
      );
    },
    [roles]
  );
  const getBaseRoleNameByLoginType = (lt) => {
    if (lt === "INSPEC") return "ผู้ประเมินภายนอก";
    return "เจ้าหน้าที่";
  };
  const handleToggleAccessAdmin = useCallback(
    async (id, nextChecked, login_type) => {
      // กันกดซ้ำถ้ายิงอยู่
      if (pendingIds.has(id)) return;

      const current = users.find((u) => u.id === id);
      if (!current) return;

      // เก็บค่าเดิมไว้ rollback
      const prevRoleName = current.role;

      const currentLoginType = login_type || current.login_type;

      const nextRoleName = nextChecked
        ? "ผู้ดูแลระบบ"
        : getBaseRoleNameByLoginType(currentLoginType);

      // 🔥 ใช้ helper ใหม่
      const nextRole = getRoleByName(nextRoleName);

      if (!nextRole?.id) {
        // console.log("ไม่พบ role:", nextRoleName);
        return;
      }

      setPendingIds((prev) => new Set(prev).add(id));

      // optimistic update (ใช้ชื่อไทยแสดง)
      setUsers((prev) =>
        prev.map((u) =>
          u.id === id ? { ...u, role: nextRole.role_name_th } : u
        )
      );

      try {
        const formattedRoleInput = [
          {
            role_id: nextRole.id,
            role_name_th: nextRole.role_name_th,
            role_name_en: nextRole.role_name_en,
          },
        ];

        await updateUser({
          variables: {
            id,
            input: {
              user_role: formattedRoleInput, // ✅ ส่งครบ
            },
          },
        });
      } catch (err) {
        // console.log("Update role failed:", err);

        // rollback
        setUsers((prev) =>
          prev.map((u) =>
            u.id === id ? { ...u, role: prevRoleName } : u
          )
        );
      } finally {
        setPendingIds((prev) => {
          const s = new Set(prev);
          s.delete(id);
          return s;
        });
      }
    },
    [users, pendingIds, updateUser, getRoleByName]
  );

  //console.log(usersData?.users?.items);

  useEffect(() => {
    setRoles(rolesData?.roles ?? []);
  }, [locale, rolesData]);

  // ✅ useEffect
  useEffect(() => {
    // รอจนกว่าจะมีโครง usersData ก่อน ค่อยประมวลผล
    if (!usersData?.users) return;

    const items = usersData.users.items || [];

    // ถ้าไม่มีรายการ → ล้าง state แล้วจบ
    if (!items.length) {
      setUsers([]);
      setTotalCount(usersData.users.totalCount ?? 0);
      return;
    }

    const formattedData = items.map((item) => {
      const lastLogin =
        item?.loginAt && dayjs(item.loginAt).isValid()
          ? dayjs(item.loginAt).format("YYYY-MM-DD HH:mm:ss")
          : "-";

      return {
        id: item?.id,
        name: `${item?.firstname || ""} ${item?.lastname || ""}`.trim(),
        email: item?.email || "-",
        role:
          locale === "th"
            ? item?.user_role?.[0]?.role?.role_name_th || "ไม่ระบุ"
            : item?.user_role?.[0]?.role?.role_name_en || "Not specified",
        position: item?.position || "-",
        status:
          locale === "th"
            ? (item?.is_online ? "ใช้งานอยู่" : "ไม่ใช้งาน")
            : (item?.is_online ? "online" : "offline"),
        phone: item?.phone || "-",
        group: item?.group_name || "-",
        aiAccess: !!item?.ai_access,
        login_type: item?.login_type,
        lastLogin,
        aiModels:
          item?.user_ai?.map((ua) => ({
            model: ua?.ai?.model_name || "-",
            model_use: ua?.ai?.model_use_name || "-",
            model_type: ua?.ai?.model_type || "-",
            token: ua?.token_count ?? 0,
            token_all: ua?.token_all ?? 0,
          })) || [],
      };
    });

    setUsers(formattedData);
    setTotalCount(usersData.users.totalCount ?? formattedData.length);
  }, [usersData, locale]);

  // console.log(users);

  const { allowed, loading, user } = useRequireRole({
    roles: ["ผู้ดูแลระบบ", "superadmin"],
    redirectTo: "/onesqa/chat",
  });

  if (loading) return null; // หรือใส่ Skeleton ก็ได้
  if (!allowed) return null; // ระหว่างกำลัง redirect กันไม่ให้แสดงหน้า

  // console.log("usersError", usersError);

  // โชว์โหลดเฉพาะ "ครั้งแรกจริง ๆ" (ยังไม่มี data)
  const isInitialLoading =
    networkStatus === NetworkStatus.loading && !usersData;

  // ก่อนหน้าเคยเขียน if (logsLoading) return ... → เปลี่ยนเป็นเช็ค isInitialLoading
  if (isInitialLoading)
    return (
      <Box sx={{ textAlign: "center", mt: 5 }}>
        <CircularProgress />
        <Typography>{tInit("loading")}...</Typography>
      </Box>
    );

  if (usersError || rolesError || groupWithUserCountError)
    return (
      <Typography color="error" sx={{ mt: 5 }}>
        ❌ {tInit("error")}
      </Typography>
    );

  const colCount = user?.role_name_th === "superadmin" ? 8 : 7;
  const totalUserCount = groupWithUserCountData?.groupWithUserCount?.reduce(
    (sum, item) => sum + Number(item?.user_count ?? 0),
    0
  ) ?? 0;

  const handleSyncUsers = async () => {
    try {
      showLoading(t("syncuser1"), theme);

      const { data } = await syncUsersFromApi();

      // console.log("✅ Create success:", data?.syncUsersFromApi);
      usersRefetch();
      groupWithUserCountRefetch();

      closeLoading();
      await showSuccessAlert({
        title: t("syncuser2"),
        text: t("syncuser3"),
        theme,
      });
    } catch (error) {
      closeLoading();
      showErrorAlert(error, theme, { 
        title: tusererror('error1'),
        t: tError
      });
    }
  };

  const handleExportExcel = async () => {
    // ดึงข้อมูลแบบ network-only เพื่อให้สดใหม่
    const { data } = await client.query({
      query: GET_USERS,
      fetchPolicy: "network-only",
      variables: {
        // ถ้าสกีมามี default page/pageSize ก็ไม่ต้องส่ง
        // ใส่ where ตามฟิลเตอร์หน้า UI (แปลง "ทั้งหมด" -> null)
        page: 1,
        pageSize: totalCount,
        where: {
          role: normalize(roleFilter),
          status: normalize(statusFilter),
          search: normalizeText(search),
        },
        // ถ้าอยากดึงเยอะ ๆ ในทีเดียวและสกีมารองรับ ให้กำหนดเอง เช่น:
        // page: 1,
        // pageSize: 1000,
      },
    });

    const items = data?.users?.items ?? [];

    const transformed = items.map((item, idx) => {
      const lastLogin =
        item?.loginAt && dayjs(item.loginAt).isValid()
          ? dayjs(item.loginAt).format("YYYY-MM-DD HH:mm:ss")
          : "-";

      return {
        id: item?.id ?? `row-${idx}`,
        fullName:
          `${item?.firstname || ""} ${item?.lastname || ""}`.trim() || "-",
        email: item?.email || "-",
        phone: item?.phone || "-",
        role:
          locale === "th"
            ? item?.user_role?.[0]?.role?.role_name_th || "ไม่ระบุ"
            : item?.user_role?.[0]?.role?.role_name_en || "Not specified",
        position: item?.position || "-",
        group: item?.group_name || "-",
        status:
          locale === "th"
            ? (item?.is_online ? "ใช้งานอยู่" : "ไม่ใช้งาน")
            : (item?.is_online ? "online" : "offline"),
        aiAccess: !!item?.ai_access,
        lastLogin,
        aiModels:
          item?.user_ai?.map((ua) => ({
            model: ua?.ai?.model_name || "-",
            model_use: ua.ai?.model_use_name || "-",
            model_type: ua.ai?.model_type || "-",
            token: ua?.token_count ?? 0,
            token_all: ua?.token_all ?? 0,
          })) || [],
      };
    });

    exportUsersToExcel(transformed, locale);
  };

  // 🔹 ฟังก์ชันกรองข้อมูล
  // const filteredUsers = users.filter((user) => {
  //   const matchesSearch =
  //     user.name.toLowerCase().includes(search.toLowerCase()) ||
  //     user.email.toLowerCase().includes(search.toLowerCase());
  //   const matchesRole = roleFilter === "ทั้งหมด" || user.role === roleFilter;
  //   const matchesStatus =
  //     statusFilter === "ทั้งหมด" || user.status === statusFilter;

  //   return matchesSearch && matchesRole && matchesStatus;
  // });

  // ✅ เมื่อเปลี่ยนหน้า
  const handleChangePage = (event, value) => {
    setPage(value);
  };

  const handleClearFilters = () => {
    setSearch("");
    setRoleFilter("ทั้งหมด");
    setStatusFilter("ทั้งหมด");
    setPage(1);
    // console.log("🧹 ล้างตัวกรองเรียบร้อย");
  };

  const handleClick = (id) => {
    router.push(`/onesqa/users/${id}`);
  };

  return (
    <Box sx={{ p: isMobile ? 0 : 3 }}>
      <UserTableToolbar
        onRefresh={() => handleSyncUsers()}
        onExport={() => handleExportExcel()}
        onClearFilters={handleClearFilters}
      />

      <Box
        sx={{
          border: "1px solid #E5E7EB",
          boxShadow: "0 3px 8px rgba(0,0,0,0.04)",
          borderRadius: 4,
          p: isMobile ? 1.5 : 2,
          bgcolor: "background.paper",
          mb: 2,
        }}
      >
        <Typography variant="h6" fontWeight="bold" sx={{ mb: 1 }}>
          {t("filter1")}
        </Typography>
        {/* 🔹 ส่วนค้นหาและกรองข้อมูล */}
        <Box
          sx={{
            display: "flex",
            flexDirection: isTablet ? "column" : "row", // ✅ สลับแนวตามจอ
            alignItems: isTablet ? "flex-start" : "center",
            gap: 2,
          }}
        >
          <TextField
            variant="outlined"
            placeholder={t("placeholder1")}
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            size="small"
            sx={{ width: isTablet ? "100%" : "none", flex: 1 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon color="action" />
                </InputAdornment>
              ),
            }}
          />

          <Select
            value={roleFilter}
            onChange={(e) => {
              setRoleFilter(e.target.value);
              setPage(1);
            }}
            size="small"
            sx={{ width: isTablet ? "100%" : "auto" }}
          >
            {/* ตัวเลือกทั้งหมด */}
            <MenuItem value="ทั้งหมด">{t("selectrole0")}</MenuItem>

            {/* ดึงจาก roles และตัด superadmin ออก */}
            {roles
              ?.filter((role) => role.role_name_th !== "superadmin")
              .map((role) => (
                <MenuItem key={role.id} value={role.role_name_th}>
                  {locale === "th" ? role.role_name_th : role.role_name_en}
                </MenuItem>
              ))}
          </Select>

          <Select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            size="small"
            sx={{ width: isTablet ? "100%" : "none" }}
          >
            <MenuItem value="ทั้งหมด">{t("selectstatus0")}</MenuItem>
            <MenuItem value="ใช้งานอยู่">{t("selectstatus1")}</MenuItem>
            <MenuItem value="ไม่ใช้งาน">{t("selectstatus2")}</MenuItem>
          </Select>
        </Box>
      </Box>

      <Box
        sx={{
          border: "1px solid #E5E7EB",
          boxShadow: "0 3px 8px rgba(0,0,0,0.04)",
          borderRadius: 4,
          p: isMobile ? 1.5 : 2,
          bgcolor: "background.paper",
          mb: 2,
        }}
      >
        {/* 🔹 ตารางผู้ใช้งาน */}
        <Box
          sx={{
            display: "flex",
            flexDirection: isMobile ? "column" : "row", // ✅ สลับแนวตามจอ
            alignItems: isMobile ? "flex-start" : "center",
            justifyContent: "space-between",
          }}
        >
          <Typography variant="h6" fontWeight="bold" sx={{ mb: 1 }}>
            {t("subtitle1")}
          </Typography>
          <Button
            variant="contained"
            startIcon={<HistoryIcon />}
            onClick={() => router.push(`/onesqa/history`)}
            sx={{
              width: isMobile ? "100%" : "none",
              bgcolor: "#02AA21",
              color: "white",
              "&:hover": { bgcolor: "#2E7D32" },
            }}
          >
            {t("history")}
          </Button>
        </Box>
        
        {/* <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          {t("subtitle1")}
        </Typography> */}

        <Box
          sx={{
            width: "100%",
            overflowX: "auto", // ✅ เลื่อนแนวนอนได้
            overflowY: "hidden",
            maxWidth: isMobile ? "80vw" : isTablet ? "85vw" : "90vw", // ✅ จำกัดไม่ให้เกินหน้าจอ
          }}
        >
          <TableContainer
            component={Paper}
            sx={{
              borderRadius: 3,
              display: "inline-block", // ✅ ป้องกันตารางยืดเกิน container
            }}
          >
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>{t("tablecell1")}</TableCell>
                  <TableCell>{t("tablecell2")}</TableCell>
                  <TableCell>{t("tablecell3")}</TableCell>
                  <TableCell>{t("tablecell4")}</TableCell>
                  <TableCell>{t("tablecell5")}</TableCell>
                  {user?.role_name_th === "superadmin" && (
                    <TableCell>Admin</TableCell>
                  )}
                  {/* <TableCell>{t("tablecell6")}</TableCell> */}
                  <TableCell>{t("tablecell7")}</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {users.map((item, index) => (
                  <TableRow key={index}>
                    <TableCell>
                      <Typography fontWeight="bold">{item.name}</Typography>
                      <Typography variant="body2" color="text.secondary">
                        {item.email}
                      </Typography>
                    </TableCell>

                    <TableCell>
                      <Chip
                        label={item.role}
                        sx={{
                          bgcolor:
                            item.role === "ผู้ดูแลระบบ" || item.role === "administrator"
                              ? "#FCE4EC" // ชมพู
                              : item.role === "ผู้ประเมินภายนอก" || item.role === "external assessor"
                              ? "#E3F2FD" // ฟ้าอ่อน
                              : "#FFF3E0", // ส้มอ่อน
                          color:
                            item.role === "ผู้ดูแลระบบ" || item.role === "administrator"
                              ? "#D81B60"
                              : item.role === "ผู้ประเมินภายนอก" || item.role === "external assessor"
                              ? "#1976D2"
                              : "#F57C00",
                          fontWeight: 500,
                        }}
                      />
                    </TableCell>

                    <TableCell>{item.group}</TableCell>

                    <TableCell>
                      <Chip
                        label={item.status}
                        sx={{
                          bgcolor:
                            item.status === "ใช้งานอยู่" || item.status === "online"
                              ? "#E6F7E6"
                              : "#E0E0E0",
                          color:
                            item.status === "ใช้งานอยู่" || item.status === "online" ? "green" : "gray",
                          fontWeight: 500,
                        }}
                      />
                    </TableCell>

                    <TableCell>
                      <Switch
                        checked={item.aiAccess}
                        color="primary"
                        onChange={(e) =>
                          handleToggleAccess(item.id, e.target.checked)
                        }
                        disabled={isPending(item.id)} // ✅ กันกดติด ๆ กัน
                      />
                    </TableCell>

                    {user?.role_name_th === "superadmin" && (
                      <TableCell>
                        <Switch
                          checked={item.role === "ผู้ดูแลระบบ" || item.role === "administrator"} // ✅ ถ้าเป็นผู้ดูแลระบบ = true
                          color="primary"
                          onChange={(e) =>
                            handleToggleAccessAdmin(
                              item.id,
                              e.target.checked,
                              item.login_type
                            )
                          }
                          disabled={isPending(item.id)} // ✅ กันกดติด ๆ กัน
                        />
                      </TableCell>
                    )}

                    {/* <TableCell>{item.lastLogin}</TableCell> */}

                    <TableCell>
                      <IconButton
                        color="primary"
                        onClick={() => handleClick(item.id)}
                        sx={{
                          "&:hover": { transform: "scale(1.1)" },
                          transition: "transform 0.2s ease-in-out",
                        }}
                      >
                        <DescriptionIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}

                {/* ถ้าไม่มีข้อมูล */}
                {users.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={colCount} align="center" sx={{ py: 4 }}>
                      {t("notfound")}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>

          {/* Footer */}
          {/* 🔹 Pagination */}
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              gap: 3,
              flexWrap: "wrap",
              alignItems: "center",
              mt: 2,
            }}
          >
            <Stack 
              direction="row" 
              spacing={1} 
              alignItems="center"
              sx={{
                ml: 1
              }}
            >
              <Typography variant="body2" color="text.secondary">
                {tInit("count")}
              </Typography>
            
              <Typography variant="body2" fontWeight={700}>
                {totalCount}
              </Typography>
            </Stack>

            {/* ✅ มือถือให้ชิดขวา (flex-end) */}
            <Box
              sx={{
                display: "flex",
                justifyContent: { xs: "flex-end", sm: "flex-end" }, // ถ้าต้องการเฉพาะมือถือ: { xs: "flex-end", sm: "flex-start" }
                width: { xs: "100%", sm: "auto" }, // ให้กินเต็มบรรทัดบนมือถือ จะได้ดันไปขวาได้
              }}
            >
              <SmartPagination
                page={page}
                totalPages={Math.ceil(totalCount / rowsPerPage)}
                disabled={usersLoading}
                onChange={(newPage) => setPage(newPage)}
              />
            </Box>
          </Box>
        </Box>
      </Box>

      <Box
        sx={{
          border: "1px solid #E5E7EB",
          boxShadow: "0 3px 8px rgba(0,0,0,0.04)",
          borderRadius: 4,
          p: isMobile ? 1.5 : 2,
          bgcolor: "background.paper",
        }}
      >
        {/* 🔹 ตารางผู้ใช้งาน */}
        <Typography variant="h6" fontWeight="bold" sx={{ mb: 1 }}>
          {t("title2")}
        </Typography>

        <Box
          sx={{
            width: "100%",
            overflowX: "auto", // ✅ เลื่อนแนวนอนได้
            overflowY: "hidden",
            maxWidth: isMobile ? "80vw" : isTablet ? "85vw" : "90vw", // ✅ จำกัดไม่ให้เกินหน้าจอ
          }}
        >
          <TableContainer
            component={Paper}
            sx={{
              borderRadius: 3,
              display: "inline-block", // ✅ ป้องกันตารางยืดเกิน container
            }}
          >
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>{t("tablecell8")}</TableCell>
                  <TableCell>{t("tablecell9")}</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {groupWithUserCountData?.groupWithUserCount?.map((item, index) => (
                  <TableRow key={index}>
                    <TableCell>{item.name}</TableCell>
                    <TableCell>{item.user_count}</TableCell>
                  </TableRow>
                ))}

                {/* ✅ แถวรวมทั้งหมด (แสดงเมื่อมีข้อมูล) */}
                {groupWithUserCountData?.groupWithUserCount?.length > 0 && (
                  <TableRow>
                    <TableCell sx={{ fontWeight: "bold" }}>{t("totalgroup")}</TableCell>
                    <TableCell sx={{ fontWeight: "bold" }}>{totalUserCount}</TableCell>
                  </TableRow>
                )}

                {/* ถ้าไม่มีข้อมูล */}
                {groupWithUserCountData?.groupWithUserCount?.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={2} align="center" sx={{ py: 4 }}>
                      {t("notfound1")}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      </Box>
    </Box>
  );
}
