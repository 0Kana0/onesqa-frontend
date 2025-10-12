"use client";

import { Typography, Container, Paper } from "@mui/material";
import ThemeToggle from "./components/ui/ThemeToggle";

export default function HomePage() {
  return (
    <Container maxWidth="sm" sx={{ mt: 5 }}>
      <Paper sx={{ p: 3 }}>
        <Typography variant="h4" gutterBottom>
          Next.js + MUI + next-themes
        </Typography>
        <Typography variant="body1" gutterBottom>
          ลองกดปุ่มด้านล่างเพื่อเปลี่ยนธีม 🎨
        </Typography>
        <ThemeToggle />
      </Paper>
    </Container>
  );
}
