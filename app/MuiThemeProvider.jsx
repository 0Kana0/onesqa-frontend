"use client";

import * as React from "react";
import { ThemeProvider, CssBaseline } from "@mui/material";
import { createAppTheme } from "./theme";
import { useTheme } from "next-themes";

export default function MuiThemeProvider({ children }) {
  const { theme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => setMounted(true), []);

  // ถ้ายังไม่ mounted ใช้ theme "light" ไปก่อน (ป้องกัน hydration mismatch)
  const effectiveTheme = mounted ? (theme === "dark" ? "dark" : "light") : "light";

  const muiTheme = React.useMemo(() => createAppTheme(effectiveTheme), [effectiveTheme]);

  return (
    <ThemeProvider theme={muiTheme}>
      <CssBaseline />
      {children}
    </ThemeProvider>
  );
}
