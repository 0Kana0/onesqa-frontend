// theme.js
import { createTheme } from "@mui/material/styles";

export const getDesignTokens = (mode) => ({
  palette: {
    mode,
    ...(mode === "light"
      ? {
          // 🎨 Light Theme
          primary: { 
            main: "#3E8EF7", 
            minor: "#F3F4FF", 
            alert: "#FFF9EE", 
            notification: "#F5F7FA" },
          background: { 
            default: "#ffffff", 
            paper: "#ffffff", 
            bglogin: "#ffffff", 
            text: "#000000",
            shabow: "rgba(0,0,0,0.5)"
          },
        }
      : {
          // 🌙 Dark Theme
          primary: { 
            main: "#1A376F", 
            minor: "#333333", 
            alert: "#333333", 
            notification: "#333333" 
          },
          background: { 
            default: "#333333", 
            paper: "#2F2F30", 
            bglogin: "#333333", 
            text: "#ffffff",
            shabow: "rgba(128,128,128,0.28)"
          },
        }),
  },
});

export const createAppTheme = (mode) => createTheme(getDesignTokens(mode));
