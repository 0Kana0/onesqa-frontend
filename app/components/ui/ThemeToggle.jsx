"use client";

import { IconButton } from "@mui/material";
import { useTheme } from "next-themes";
import Brightness4Icon from "@mui/icons-material/Brightness4";
import Brightness7Icon from "@mui/icons-material/Brightness7";
import { useEffect, useState } from "react";

export default function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // ✅ ป้องกัน hydration mismatch
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  return (
    <IconButton onClick={() => setTheme(theme === "dark" ? "light" : "dark")}>
      {theme === "dark" ? <Brightness7Icon /> : <Brightness4Icon />}
    </IconButton>
  );
}
