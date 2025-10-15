"use client";
import { createContext, useContext, useState, useEffect } from "react";
import { useMediaQuery } from "@mui/material";

// ✅ สร้าง Context
const SidebarContext = createContext();

// ✅ Hook สำหรับเรียกใช้งานได้ทุกที่
export const useSidebar = () => useContext(SidebarContext);

// ✅ Provider
export const SidebarProvider = ({ children }) => {
  const isTablet = useMediaQuery("(max-width:1200px)"); // < md คือจอเล็ก

  const [open, setOpen] = useState(true);

  // ✅ ตั้งค่าเริ่มต้นตามขนาดจอหลังจาก mount
  useEffect(() => {
    setOpen(!isTablet); // ถ้าเป็น mobile -> false, ถ้า desktop -> true
  }, [isTablet]);

  const toggle = () => setOpen((prev) => !prev);
  // const open = () => setOpenSidebar(true);
  // const close = () => setOpenSidebar(false);

  return (
    <SidebarContext.Provider value={{ open, toggle }}>
      {children}
    </SidebarContext.Provider>
  );
};
