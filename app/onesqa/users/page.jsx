"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation } from "@apollo/client/react";
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

export default function UserPage() {
  const router = useRouter();
  const t = useTranslations("UserPage");
  const isMobile = useMediaQuery("(max-width:600px)"); // < md คือจอเล็ก
  const isTablet = useMediaQuery("(max-width:1200px)"); // < md คือจอเล็ก

  const {
    data: usersData,
    loading: usersLoading,
    error: usersError,
  } = useQuery(GET_USERS);
  //console.log(usersData);

  // 🔹 state
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("ทั้งหมด");
  const [statusFilter, setStatusFilter] = useState("ทั้งหมด");
  const [page, setPage] = useState(1);
  const rowsPerPage = 5; // ✅ แสดง 5 แถวต่อหน้า

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

  const [users, setUsers] = useState([]);
  const [updateUser] = useMutation(UPDATE_USER);

  // ✅ useEffect
  useEffect(() => {
    if (usersData?.users) {
      const formattedData =
        usersData.users.map((item) => ({
          id: item?.id,
          name: `${item?.firstname || ""} ${item?.lastname || ""}`,
          email: item?.email || "-",
          role: item?.user_role?.[0]?.role?.role_name || "ไม่ระบุ",
          position: item?.position || "-",
          //status: item?.ai_access ? "ใช้งานอยู่" : "ไม่ใช้งาน",
          phone: item?.phone || "-",
          group: item?.group_name || "-",
          status: "ใช้งานอยู่",
          aiAccess: !!item?.ai_access,
          lastLogin: dayjs(item?.loginAt).format("YYYY-MM-DD HH:mm:ss"), // ✅ ใช้ฟังก์ชันที่เราสร้าง
          aiModels:
            item?.user_ai?.map((ai) => ({
              model: ai.ai?.model_name || "-",
              token: ai.token_count || 0,
              token_all: ai.token_all || 0,
          })) || [],
        })) || [];

      setUsers(formattedData);
    }
  }, [usersData]);

  console.log(users);

  const handleExportExcel = () => {
    const transformed =
      users?.map((item) => ({
        id: item?.id,
        fullName: item?.name || "-",
        email: item?.email || "-",
        phone: item?.phone || "-",
        role: item?.role || "-",
        position: item?.position || "-",
        group: item?.group || "-",
        status: item?.status ? "ใช้งานอยู่" : "ไม่ใช้งาน",
        aiAccess: !!item?.aiAccess,
        lastLogin: item?.lastLogin,
        aiModels: item?.aiModels
      })) || [];

    exportUsersToExcel(transformed);
  };

  if (usersLoading)
    return (
      <Box sx={{ textAlign: "center", mt: 5 }}>
        <CircularProgress />
        <Typography>{t("loading")}...</Typography>
      </Box>
    );

  if (usersError)
    return (
      <Typography color="error" sx={{ mt: 5 }}>
        ❌ {t("error")}
      </Typography>
    );

  // ✅ เมื่อ toggle ปุ่ม
  const handleToggleAccess = async (id) => {
    // หา user ที่ toggle อยู่
    const targetUser = users.find((u) => u.id === id);
    if (!targetUser) return;

    const newAccess = !targetUser.aiAccess;

    // ✅ อัปเดต UI ทันที (optimistic update)
    setUsers((prev) =>
      prev.map((user) =>
        user.id === id ? { ...user, aiAccess: !user.aiAccess } : user
      )
    );

    // ถ้ามี backend → สามารถเรียก API ที่นี่ได้ เช่น:
    // await axios.put(`/api/users/${id}/access`, { aiAccess: !user.aiAccess })
    try {
      // ✅ เรียก mutation ไป backend
      const { data } = await updateUser({
        variables: {
          id, // ต้องตรงกับ schema
          input: {
            ai_access: newAccess, // เปลี่ยนเฉพาะ field นี้
          },
        },
      });

      console.log("✅ Update success:", data.updateUser);
    } catch (error) {
      console.log(error);
    }
  };

  // 🔹 ฟังก์ชันกรองข้อมูล
  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.name.toLowerCase().includes(search.toLowerCase()) ||
      user.email.toLowerCase().includes(search.toLowerCase());
    const matchesRole = roleFilter === "ทั้งหมด" || user.role === roleFilter;
    const matchesStatus =
      statusFilter === "ทั้งหมด" || user.status === statusFilter;

    return matchesSearch && matchesRole && matchesStatus;
  });

  // ✅ แบ่งข้อมูลตามหน้า
  const paginatedUsers = filteredUsers.slice(
    (page - 1) * rowsPerPage,
    page * rowsPerPage
  );

  // ✅ เมื่อเปลี่ยนหน้า
  const handleChangePage = (event, value) => {
    setPage(value);
  };

  const handleClearFilters = () => {
    setSearch("");
    setRoleFilter("ทั้งหมด");
    setStatusFilter("ทั้งหมด");
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
            onChange={(e) => setSearch(e.target.value)}
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
            onChange={(e) => setRoleFilter(e.target.value)}
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
            onChange={(e) => setStatusFilter(e.target.value)}
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
                {paginatedUsers.map((user, index) => (
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
                        onChange={() => handleToggleAccess(user.id)}
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
                {paginatedUsers.length === 0 && (
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
              count={Math.ceil(filteredUsers.length / rowsPerPage)}
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
