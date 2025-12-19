import React, { useMemo } from "react";
import { Pagination, PaginationItem, useMediaQuery } from "@mui/material";

/**
 * default rule:
 * - แสดง: 1, last
 * - แสดง: current-1, current, current+1 (ถ้าอยู่ในช่วง)
 * - mobile: ลดเหลือ 1, current, last
 */
const getVisiblePages = (page, totalPages) => {
  if (totalPages <= 3) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  if (page <= 1) return [1, 2, 3];
  if (page >= totalPages) return [totalPages - 2, totalPages - 1, totalPages];

  return [page - 1, page, page + 1];
};
function getVisiblePagesDefault(current, total, isMobile = false) {
  if (!total || total <= 0) return [];

  const set = new Set([1, total, current]);

  if (!isMobile) {
    set.add(current - 1);
    set.add(current + 1);
  }

  // keep only valid
  return [...set]
    .filter((p) => p >= 1 && p <= total)
    .sort((a, b) => a - b);
}

export default function SmartPagination({
  page,
  totalPages,
  onChange,

  // options
  disabled = false,
  color = "primary",
  hideFirstLastOnMobile = true,
}) {
  const isMobile = useMediaQuery("(max-width:600px)");

  const visiblePages = useMemo(() => {
    const fn = getVisiblePages || getVisiblePagesDefault;
    return fn(page, totalPages, isMobile);
  }, [getVisiblePages, page, totalPages, isMobile]);

  return (
    <Pagination
      page={page}
      count={totalPages}
      showFirstButton={hideFirstLastOnMobile ? !isMobile : true}
      showLastButton={hideFirstLastOnMobile ? !isMobile : true}
      renderItem={(item) => {
        // ซ่อน ...
        if (item.type === "start-ellipsis" || item.type === "end-ellipsis") return null;

        // แสดงเฉพาะเลขหน้าที่อยู่ในกฎ
        if (item.type === "page") {
          if (!visiblePages.includes(item.page)) return null;
        }

        return <PaginationItem {...item} />;
      }}
      onChange={(_, newPage) => onChange?.(newPage)}
      color={color}
      disabled={disabled}
    />
  );
}
