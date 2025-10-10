"use client";

import { Typography, Container, Paper } from "@mui/material";
import ThemeToggle from "./components/ui/ThemeToggle";
import {useTranslations} from 'next-intl';

export default function HomePage() {
  const t = useTranslations('HomePage');
  return (
    <Container maxWidth="sm" sx={{ mt: 5 }}>
      <Paper sx={{ p: 3 }}>
        <Typography variant="h4" gutterBottom>
          Next.js + MUI + next-themes
        </Typography>
        <Typography variant="body1" gutterBottom>
          ลองกดปุ่มด้านล่างเพื่อเปลี่ยนธีม 🎨
        </Typography>
        <h1>{t('title')}</h1>
        <ThemeToggle />
      </Paper>
    </Container>
  );
}
