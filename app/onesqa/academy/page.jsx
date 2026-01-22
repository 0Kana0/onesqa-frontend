"use client";

import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useApolloClient } from "@apollo/client/react";
import { useTranslations } from "next-intl";
import { useTheme } from "next-themes";
import { useLanguage } from "@/app/context/LanguageContext";
import { useRequireRole } from "@/hook/useRequireRole";
import {
  Box,
  Typography,
  TextField,
  InputAdornment,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  CircularProgress,
  useMediaQuery,
  Button,
  Stack,
  Checkbox,
} from "@mui/material";
import Swal from "sweetalert2";
import DeleteRoundedIcon from "@mui/icons-material/DeleteRounded";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import ClearRoundedIcon from "@mui/icons-material/ClearRounded";
import {
  closeLoading,
  showLoading,
  showSuccessAlert,
} from "@/util/loadingModal";
import { showErrorAlert } from "@/util/errorAlert";
import { COUNT_ACADEMY, GET_ACADEMY_BY_CODE } from "@/graphql/academy/queries";
import { SYNC_ACADEMY } from "@/graphql/academy/mutations";
import { REMOVE_SAR_FILES } from "@/graphql/academy/mutations";
import FileCard from "../../components/chat/FileCard";
import AcademyToolbar from "@/app/components/AcademyToolbar";

const normalizeText = (v) => {
  const s = (v ?? "").trim();
  return s === "" ? null : s;
};

const AcademyPage = () => {
  const client = useApolloClient();
  const { locale } = useLanguage();
  const { theme } = useTheme();
  // ✅ input ที่พิมพ์
  const [searchInput, setSearchInput] = useState("");
  // ✅ code ที่ “กดค้นหาแล้ว” (ตัวนี้ค่อยยิง query)
  const [search, setSearch] = useState("");

  const [selectedSar, setSelectedSar] = useState({}); // { [url]: true }

  const t = useTranslations("AcademyPage");
  const tInit = useTranslations("Init");
  const tacademyerror = useTranslations("AcademyError");
  const tDelete = useTranslations("DeleteAlert");

  const isMobile = useMediaQuery("(max-width:600px)");
  const isTablet = useMediaQuery("(max-width:1200px)");

  // ✅ ยิงเฉพาะตอนกดค้นหา (skip ตอนยังไม่มีค่า)
  const searchCode = normalizeText(search);

  const {
    data: academyData,
    loading: academyLoading,
    error: academyError,
  } = useQuery(GET_ACADEMY_BY_CODE, {
    fetchPolicy: "cache-and-network",
    notifyOnNetworkStatusChange: true,
    variables: { code: searchCode },
    skip: !searchCode,
  });

  const {
    data: countAcademyData,
    loading: countAcademyLoading,
    error: countAcademyError,
    refetch: countAcademyRefetch,
  } = useQuery(COUNT_ACADEMY, {
    fetchPolicy: "network-only",
  });

  const [syncAcademyFromApi] = useMutation(SYNC_ACADEMY);
  const [removeSarFiles, { loading: removingSar }] =
    useMutation(REMOVE_SAR_FILES);

  // ✅ require role เหมือนเดิม
  const { allowed, loading, user } = useRequireRole({
    roles: ["ผู้ดูแลระบบ", "superadmin"],
    redirectTo: "/onesqa/chat",
  });

  if (loading) return null;
  if (!allowed) return null;

  // ✅ อย่าเอา academyLoading มาบล็อคทั้งหน้า
  if (countAcademyLoading)
    return (
      <Box sx={{ textAlign: "center", mt: 5 }}>
        <CircularProgress />
        <Typography>{tInit("loading")}...</Typography>
      </Box>
    );

  if (countAcademyError)
    return (
      <Typography color="error" sx={{ mt: 5 }}>
        ❌ {tInit("error")}
      </Typography>
    );

  const handleSearch = () => {
    const v = normalizeText(searchInput);
    // กดค้นหาตอนว่าง = เคลียร์ผลลัพธ์
    setSearch(v ?? "");
    setSelectedSar({});
  };

  const handleClearSearch = () => {
    setSelectedSar({});
    setSearchInput("");
    setSearch("");
  };

  const handleSyncAcademy = async () => {
    try {
      showLoading(t("syncacademy1"), theme);
      const { data } = await syncAcademyFromApi();
      console.log("✅ Create success:", data?.syncAcademyFromApi);

      // ✅ เคลียร์ทั้ง input และผลลัพธ์
      setSearchInput("");
      setSearch("");
      setSelectedSar({});

      countAcademyRefetch();
      closeLoading();
      await showSuccessAlert({
        title: t("syncacademy2"),
        text: t("syncacademy3"),
        theme,
      });
    } catch (error) {
      closeLoading();
      showErrorAlert(error, theme, {
        title: tacademyerror("error1"),
      });
    }
  };

  // ✅ สมมติชื่อ field ที่ query คืนมาเป็น academyByCode (แก้ให้ตรง schema ของคุณถ้าชื่อไม่ตรง)
  const academy = academyData?.academyByCode ?? null;
  const sarFiles = academy?.sar_file;
  const hasSarFile = Array.isArray(sarFiles)
    ? sarFiles.length > 0
    : sarFiles != null; // null/undefined = ไม่มีไฟล์

  const sarList = Array.isArray(sarFiles) ? sarFiles : [];
  const selectedUrls = Object.keys(selectedSar).filter((k) => selectedSar[k]);
  const allSelected =
    sarList.length > 0 && selectedUrls.length === sarList.length;
  const someSelected = selectedUrls.length > 0 && !allSelected;

  const toggleOne = (url) => {
    if (!url) return;
    setSelectedSar((prev) => {
      const next = { ...prev };
      if (next[url]) delete next[url];
      else next[url] = true;
      return next;
    });
  };

  const toggleAll = () => {
    if (allSelected) {
      setSelectedSar({});
      return;
    }
    const next = {};
    sarList.forEach((x) => {
      if (x?.file) next[x.file] = true;
    });
    setSelectedSar(next);
  };

  const handleDeleteSelected = async () => {
    if (!academy?.id) return;
    if (selectedUrls.length === 0) return;

    const isDark = theme === "dark";

    const swalBase = isDark
      ? {
          background: "#2F2F30",
          color: "#fff",
          titleColor: "#fff",
          textColor: "#fff",
        }
      : {};

    Swal.fire({
      title: tDelete?.("title1"),
      text:tDelete?.("textfile1"),
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3E8EF7",
      confirmButtonText: tDelete?.("confirm"),
      cancelButtonText: tDelete?.("cancel"),
      ...swalBase,
    }).then(async (result) => {
      if (!result.isConfirmed) return;

      try {
        await removeSarFiles({
          variables: {
            academy_id: academy.id,
            files: selectedUrls,
          },
          update: (cache) => {
            const vars = { code: searchCode };
            const prev = cache.readQuery({
              query: GET_ACADEMY_BY_CODE,
              variables: vars,
            });
            const prevAcademy = prev?.academyByCode;
            if (!prevAcademy) return;

            const rm = new Set(selectedUrls);
            const nextSar = (prevAcademy.sar_file || []).filter(
              (x) => !rm.has(x?.file),
            );

            cache.writeQuery({
              query: GET_ACADEMY_BY_CODE,
              variables: vars,
              data: {
                ...prev,
                academyByCode: { ...prevAcademy, sar_file: nextSar },
              },
            });
          },
        });

        setSelectedSar({});

        Swal.fire({
          title: tDelete?.("title2"),
          text: tDelete?.("textfile2"),
          icon: "success",
          confirmButtonColor: "#3E8EF7",
          ...swalBase,
        });
      } catch (err) {
        console.log(err);
      }
    });
  };

  return (
    <Box sx={{ p: isMobile ? 0 : 3 }}>
      <AcademyToolbar onRefresh={() => handleSyncAcademy()} />

      {/* ✅ UI ค้นหา (แทรกระหว่าง Toolbar กับตาราง) */}
      <Paper
        sx={{
          mt: 2,
          mb: 2,
          p: isMobile ? 1.5 : 2,
          borderRadius: 4,
          border: "1px solid #E5E7EB",
          boxShadow: "0 3px 8px rgba(0,0,0,0.04)",
        }}
      >
        <Typography variant="h6" fontWeight="bold" sx={{ mb: 1 }}>
          {t("searchTitle")}
        </Typography>

        <Stack
          direction={isMobile ? "column" : "row"}
          spacing={1.5}
          alignItems="stretch"
        >
          <TextField
            size="small"
            fullWidth
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder={t("searchPlaceholder")}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSearch();
            }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchRoundedIcon fontSize="small" />
                </InputAdornment>
              ),
              endAdornment: searchInput ? (
                <InputAdornment position="end">
                  <IconButton onClick={() => setSearchInput("")} size="small">
                    <ClearRoundedIcon fontSize="small" />
                  </IconButton>
                </InputAdornment>
              ) : null,
            }}
          />

          <Stack direction="row" spacing={1}>
            <Button
              size="small"
              variant="contained"
              onClick={handleSearch}
              disabled={!normalizeText(searchInput) || academyLoading}
              sx={{ width: isMobile ? "100%" : 120 }}
            >
              {academyLoading ? (
                <CircularProgress size={18} sx={{ color: "white" }} />
              ) : (
                t("searchBtn")
              )}
            </Button>

            <Button
              size="small"
              variant="outlined"
              onClick={handleClearSearch}
              sx={{
                width: isMobile ? "100%" : "none",
                bgcolor: "#E3F2FD",
                color: "#1565C0",
                "&:hover": { bgcolor: "#BBDEFB" },
              }}
            >
              {t("clearBtn")}
            </Button>
          </Stack>
        </Stack>

        {/* ✅ พื้นที่แสดงผลลัพธ์ค้นหา */}
        <Box sx={{ mt: 3 }}>
          {/* error */}
          {searchCode && academyError && (
            <Typography color="error">❌ {tInit("error")}</Typography>
          )}

          {/* loading */}
          {searchCode && academyLoading && (
            <Stack direction="row" spacing={1} alignItems="center">
              <CircularProgress size={16} />
              <Typography variant="body2">{tInit("loading")}...</Typography>
            </Stack>
          )}

          {/* found (แสดงแบบการ์ดเตี้ย ๆ) */}
          {searchCode && !academyLoading && !academyError && academy && (
            <>
              <Paper
                variant="outlined"
                sx={{
                  mt: 1,
                  px: 2.5, // ✅ เพิ่มความกว้างด้านใน (ซ้าย/ขวา)
                  py: 2, // ✅ เพิ่มความสูงด้านใน (บน/ล่าง)
                  borderRadius: 4,
                  bgcolor: "background.default",
                  // ✅ ถ้าอยากให้การ์ดดู "ใหญ่" ขึ้นอีกแบบ โดยไม่ยืดเต็ม
                  width: "100%",
                  // ✅ เพิ่มความเด่น (เลือกอย่างใดอย่างหนึ่ง)
                  // boxShadow: "0 6px 18px rgba(0,0,0,0.06)",
                }}
              >
                <Stack spacing={0.75}>
                  <Typography variant="h6" fontWeight={800}>
                    {academy.name ?? "-"}
                  </Typography>

                  <Stack
                    direction="row"
                    spacing={2}
                    flexWrap="wrap"
                    alignItems="center"
                    sx={{ rowGap: 1 }}
                  >
                    <Typography variant="body1" color="text.secondary">
                      {t("code")}: <b>{academy.code ?? "-"}</b>
                    </Typography>

                    {academy.academy_level_id != null && (
                      <Typography variant="body1" color="text.secondary">
                        {t("level")}: <b>{academy.academy_level_id}</b>
                      </Typography>
                    )}
                  </Stack>
                </Stack>
              </Paper>

              {/* ✅ sar_file */}
              {!hasSarFile ? (
                <Typography
                  sx={{ my: 3 }}
                  align="center"
                  variant="body2"
                  color="text.secondary"
                >
                  {t("notfound2")}
                </Typography>
              ) : (
                <Box sx={{ mt: 2 }}>
                  {/* แถบบน: เลือกทั้งหมด + ปุ่มลบทีเดียว */}
                  <Stack
                    direction={isMobile ? "column" : "row"}
                    spacing={1}
                    alignItems={isMobile ? "stretch" : "center"}
                    justifyContent="space-between"
                    sx={{ mb: 1 }}
                  >
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Checkbox
                        checked={allSelected}
                        indeterminate={someSelected}
                        onChange={toggleAll}
                      />
                      <Typography variant="body2" color="text.secondary">
                        {t("delete1")} ({selectedUrls.length}/{sarList.length})
                      </Typography>
                    </Stack>

                    <Button
                      variant="contained"
                      color="error"
                      startIcon={<DeleteRoundedIcon />}
                      disabled={selectedUrls.length === 0 || removingSar}
                      onClick={handleDeleteSelected}
                      sx={{ width: isMobile ? "100%" : "auto" }}
                    >
                      {t("delete2")}
                    </Button>
                  </Stack>

                  {/* รายการไฟล์ + checkbox */}
                  <Stack spacing={0.75}>
                    {sarList.map((f, idx) => {
                      const url = f?.file || "";
                      const checked = Boolean(selectedSar[url]);

                      return (
                        <Stack
                          key={`${f?.year ?? "NA"}-${idx}`}
                          direction="row"
                          spacing={1}
                          alignItems="center"
                        >
                          <Checkbox
                            checked={checked}
                            onChange={() => toggleOne(url)}
                            disabled={!url || removingSar}
                          />

                          <FileCard
                            title={
                              (url || "").split("/").pop() ||
                              `SAR ${f?.year ?? "-"}`
                            }
                            href={url}
                            typeLabel={`SAR ${f?.year ?? ""}`}
                            sx={{ width: "100%" }}
                            disabled={removingSar}
                          />
                        </Stack>
                      );
                    })}
                  </Stack>
                </Box>
              )}
            </>
          )}

          {/* not found */}
          {searchCode && !academyLoading && !academyError && !academy && (
            <Typography
              sx={{ my: 2 }}
              align="center"
              variant="body2"
              color="text.secondary"
            >
              {t("notfound1")}
            </Typography>
          )}
        </Box>
      </Paper>

      {/* ====== ตารางเดิมของคุณ ====== */}
      <Box
        sx={{
          border: "1px solid #E5E7EB",
          boxShadow: "0 3px 8px rgba(0,0,0,0.04)",
          borderRadius: 4,
          p: isMobile ? 1.5 : 2,
          bgcolor: "background.paper",
        }}
      >
        <Typography variant="h6" fontWeight="bold" sx={{ mb: 1 }}>
          {t("title2")}
        </Typography>

        <Box
          sx={{
            width: "100%",
            overflowX: "auto",
            overflowY: "hidden",
            maxWidth: isMobile ? "80vw" : isTablet ? "85vw" : "90vw",
          }}
        >
          <TableContainer
            component={Paper}
            sx={{ borderRadius: 3, display: "inline-block" }}
          >
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>{t("tablecell8")}</TableCell>
                  <TableCell>{t("tablecell9")}</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {countAcademyData?.countByAcademyLevel?.map((item, index) => (
                  <TableRow key={index}>
                    <TableCell>
                      {t("level")} {item.academy_level_id}
                    </TableCell>
                    <TableCell>{item.count}</TableCell>
                  </TableRow>
                ))}

                {countAcademyData?.countByAcademyLevel?.length === 0 && (
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
};

export default AcademyPage;
