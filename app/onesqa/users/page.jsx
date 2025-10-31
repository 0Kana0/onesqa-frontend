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
  Pagination,
  CircularProgress,
  useMediaQuery,
} from "@mui/material";
import { GET_USERS } from "@/graphql/user/queries";
import { UPDATE_USER } from "@/graphql/user/mutations";
import SearchIcon from "@mui/icons-material/Search";
import DescriptionIcon from "@mui/icons-material/Description";
import UserTableToolbar from "@/app/components/UserTableToolbar";
import { useTranslations } from "next-intl";
import { exportUsersToExcel } from "@/util/exportToExcel";
import { useRequireRole } from "@/hook/useRequireRole";

const normalize = (v) => (v === 'ทั้งหมด' || v === '' || v == null ? null : v);
const normalizeText = (v) => {
  const s = (v ?? '').trim();
  return s === '' ? null : s;
}

export default function UserPage() {
  const client = useApolloClient();
  const router = useRouter();
  const t = useTranslations("UserPage");
  const tInit = useTranslations("Init");
  const isMobile = useMediaQuery("(max-width:600px)"); // < md คือจอเล็ก
  const isTablet = useMediaQuery("(max-width:1200px)"); // < md คือจอเล็ก

  // 🔹 state
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("ทั้งหมด");
  const [statusFilter, setStatusFilter] = useState("ทั้งหมด");
  const [page, setPage] = useState(1);
  const rowsPerPage = 5; // ✅ แสดง 5 แถวต่อหน้า

  const [users, setUsers] = useState([]);
  const [totalCount, setTotalCount] = useState(0)

  const [pendingIds, setPendingIds] = useState(new Set());
  const isPending = useCallback((id) => pendingIds.has(id), [pendingIds]);

  const {
    data: usersData,
    loading: usersLoading,
    error: usersError,
    networkStatus
  } = useQuery(GET_USERS, {
    fetchPolicy: "cache-and-network",
    notifyOnNetworkStatusChange: true,
    variables: {
      page: page, 
      pageSize: rowsPerPage,
      where: {
        role: normalize(roleFilter),
        status: normalize(statusFilter),
        search: normalizeText(search)
      }
    },
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
        console.error("Update failed:", err);
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

  //console.log(usersData?.users?.items);

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
          ? dayjs(item.loginAt).format('YYYY-MM-DD HH:mm:ss')
          : '-';

      return {
        id: item?.id,
        name: `${item?.firstname || ''} ${item?.lastname || ''}`.trim(),
        email: item?.email || '-',
        role: item?.user_role?.[0]?.role?.role_name || 'ไม่ระบุ',
        position: item?.position || '-',
        status: item?.is_online ? 'ใช้งานอยู่' : 'ไม่ใช้งาน',
        phone: item?.phone || '-',
        group: item?.group_name || '-',
        aiAccess: !!item?.ai_access,
        lastLogin,
        aiModels:
          item?.user_ai?.map((ua) => ({
            model: ua?.ai?.model_name || '-',
            model_use: ua?.ai?.model_use_name || "-",
            model_type: ua?.ai?.model_type || "-",
            token: ua?.token_count ?? 0,
            token_all: ua?.token_all ?? 0,
          })) || [],
      };
    });

    setUsers(formattedData);
    setTotalCount(usersData.users.totalCount ?? formattedData.length);
  }, [usersData]);

  console.log(users);

  const { allowed, loading, user } = useRequireRole({
    roles: ["ผู้ดูแลระบบ"],
    redirectTo: "/onesqa/chat",
  });
    
  if (loading) return null;     // หรือใส่ Skeleton ก็ได้
  if (!allowed) return null;    // ระหว่างกำลัง redirect กันไม่ให้แสดงหน้า

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

  if (usersError)
    return (
      <Typography color="error" sx={{ mt: 5 }}>
        ❌ {tInit("error")}
      </Typography>
    );

  const handleExportExcel = async () => {
    // ดึงข้อมูลแบบ network-only เพื่อให้สดใหม่
    const { data } = await client.query({
      query: GET_USERS,
      fetchPolicy: 'network-only',
      variables: {
        // ถ้าสกีมามี default page/pageSize ก็ไม่ต้องส่ง
        // ใส่ where ตามฟิลเตอร์หน้า UI (แปลง "ทั้งหมด" -> null)
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
          ? dayjs(item.loginAt).format('YYYY-MM-DD HH:mm:ss')
          : '-';

      return {
        id: item?.id ?? `row-${idx}`,
        fullName: `${item?.firstname || ''} ${item?.lastname || ''}`.trim() || '-',
        email: item?.email || '-',
        phone: item?.phone || '-',
        role: item?.user_role?.[0]?.role?.role_name || 'ไม่ระบุ',
        position: item?.position || '-',
        group: item?.group_name || '-',
        status: item?.is_online ? 'ใช้งานอยู่' : 'ไม่ใช้งาน', // ถ้าหมายถึง AI access ให้เปลี่ยนเป็น item?.ai_access
        aiAccess: !!item?.ai_access,
        lastLogin,
        aiModels:
          item?.user_ai?.map((ua) => ({
            model: ua?.ai?.model_name || '-',
            model_use: ua.ai?.model_use_name || "-",
            model_type: ua.ai?.model_type || "-",
            token: ua?.token_count ?? 0,
            token_all: ua?.token_all ?? 0,
          })) || [],
      };
    });

    exportUsersToExcel(transformed);
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
    setPage(1)
    console.log("🧹 ล้างตัวกรองเรียบร้อย");
  };

  const handleClick = (id) => {
    router.push(`/onesqa/users/${id}`);
  };

  return (
    <Box sx={{ p: isMobile ? 0 : 3 }}>
      <UserTableToolbar
        onRefresh={() => console.log("🔄 เชื่อมต่อข้อมูลผู้ใช้งาน")}
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
            placeholder="ค้นหาผู้ใช้งาน..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setPage(1)
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
              setRoleFilter(e.target.value)
              setPage(1)
            }}
            size="small"
            sx={{ width: isTablet ? "100%" : "none" }}
          >
            <MenuItem value="ทั้งหมด">บทบาททั้งหมด</MenuItem>
            <MenuItem value="ผู้ดูแลระบบ">ผู้ดูแลระบบ</MenuItem>
            <MenuItem value="เจ้าหน้าที่">เจ้าหน้าที่</MenuItem>
            <MenuItem value="ผู้ประเมินภายนอก">ผู้ประเมินภายนอก</MenuItem>
          </Select>

          <Select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value)
              setPage(1)
            }}
            size="small"
            sx={{ width: isTablet ? "100%" : "none" }}
          >
            <MenuItem value="ทั้งหมด">สถานะ</MenuItem>
            <MenuItem value="ใช้งานอยู่">ใช้งานอยู่</MenuItem>
            <MenuItem value="ไม่ใช้งาน">ไม่ใช้งาน</MenuItem>
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
        }}
      >
        {/* 🔹 ตารางผู้ใช้งาน */}
        <Typography variant="h6" fontWeight="bold" sx={{ mb: 1 }}>
          {t("title1")}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          {t("subtitle1")}
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
                  <TableCell>{t("tablecell1")}</TableCell>
                  <TableCell>{t("tablecell2")}</TableCell>
                  <TableCell>{t("tablecell3")}</TableCell>
                  <TableCell>{t("tablecell4")}</TableCell>
                  <TableCell>{t("tablecell5")}</TableCell>
                  <TableCell>{t("tablecell6")}</TableCell>
                  <TableCell>{t("tablecell7")}</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {users.map((user, index) => (
                  <TableRow key={index}>
                    <TableCell>
                      <Typography fontWeight="bold">{user.name}</Typography>
                      <Typography variant="body2" color="text.secondary">
                        {user.email}
                      </Typography>
                    </TableCell>

                    <TableCell>
                      <Chip
                        label={user.role}
                        sx={{
                          bgcolor:
                            user.role === "ผู้ดูแลระบบ"
                              ? "#FCE4EC" // ชมพู
                              : user.role === "ผู้ประเมินภายนอก"
                              ? "#E3F2FD" // ฟ้าอ่อน
                              : "#FFF3E0", // ส้มอ่อน
                          color:
                            user.role === "ผู้ดูแลระบบ"
                              ? "#D81B60"
                              : user.role === "ผู้ประเมินภายนอก"
                              ? "#1976D2"
                              : "#F57C00",
                          fontWeight: 500,
                        }}
                      />
                    </TableCell>

                    <TableCell>{user.position}</TableCell>

                    <TableCell>
                      <Chip
                        label={user.status}
                        sx={{
                          bgcolor:
                            user.status === "ใช้งานอยู่"
                              ? "#E6F7E6"
                              : "#E0E0E0",
                          color:
                            user.status === "ใช้งานอยู่" ? "green" : "gray",
                          fontWeight: 500,
                        }}
                      />
                    </TableCell>

                    <TableCell>
                      <Switch
                        checked={user.aiAccess}
                        color="primary"
                        onChange={(e) => handleToggleAccess(user.id, e.target.checked)}
                        disabled={isPending(user.id)}  // ✅ กันกดติด ๆ กัน
                      />
                    </TableCell>

                    <TableCell>{user.lastLogin}</TableCell>

                    <TableCell>
                      <IconButton
                        color="primary"
                        onClick={() => handleClick(user.id)}
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
                    <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                      ไม่พบข้อมูล
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>

          {/* 🔹 Pagination */}
          <Box
            sx={{
              display: "flex",
              justifyContent: "flex-end",
              mt: 2,
            }}
          >
            <Pagination
              count={Math.ceil(totalCount / rowsPerPage)}
              page={page}
              onChange={handleChangePage}
              color="primary"
            />
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
