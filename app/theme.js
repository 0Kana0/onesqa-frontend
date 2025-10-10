// theme.js
import { createTheme } from "@mui/material/styles";

export const getDesignTokens = (mode) => ({
  palette: {
    mode,
    ...(mode === "light"
      ? {
          // 🎨 Light Theme
          primary: { main: "#3E8EF7", minor: "#F3F4FF", alert: "#FFF9EE" },
          background: { default: "#f5f5f5", paper: "#ffffff", bglogin: "#ffffff", text: "#000000" },
        }
      : {
          // 🌙 Dark Theme
          primary: { main: "#1A376F", minor: "#333333", alert: "#333333" },
          background: { default: "#333333", paper: "#2F2F30", bglogin: "#333333", text: "#ffffff" },
        }),
  },
});

export const createAppTheme = (mode) => createTheme(getDesignTokens(mode));
