// components/FileCard.jsx
'use client';

import Link from 'next/link';
import { Box, Stack, Typography, IconButton } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import CloseRounded from '@mui/icons-material/CloseRounded';
import PictureAsPdfRounded from '@mui/icons-material/PictureAsPdfRounded';
import DescriptionRounded from '@mui/icons-material/DescriptionRounded';
import SlideshowRounded from '@mui/icons-material/SlideshowRounded';
import TableChartRounded from '@mui/icons-material/TableChartRounded';
import AudioFileRounded from '@mui/icons-material/AudioFileRounded';
import VideoFileRounded from '@mui/icons-material/VideoFileRounded';
import InsertDriveFileRounded from '@mui/icons-material/InsertDriveFileRounded';

const extFromTitle = (title) => {
  if (!title) return null;
  const m = String(title).toLowerCase().match(/\.([a-z0-9]+)$/i);
  return m?.[1] ?? null;
};

function getVisuals(ext, theme) {
  const white = theme.palette.common.white;

  switch ((ext || '').toLowerCase()) {
    case 'pdf':
      return {
        bg: theme.palette.error.main,
        icon: <PictureAsPdfRounded fontSize="small" sx={{ color: white }} />,
        label: 'PDF',
      };
    case 'doc':
    case 'docx':
      return {
        bg: theme.palette.info.main,
        icon: <DescriptionRounded fontSize="small" sx={{ color: white }} />,
        label: 'Word',
      };
    case 'ppt':
    case 'pptx':
      return {
        bg: theme.palette.warning.main,
        icon: <SlideshowRounded fontSize="small" sx={{ color: white }} />,
        label: 'PPT',
      };
    case 'xls':
    case 'xlsx':
      return {
        bg: theme.palette.success.main,
        icon: <TableChartRounded fontSize="small" sx={{ color: white }} />,
        label: 'Excel',
      };
    case 'mp3':
      return {
        bg: theme.palette.secondary.main,
        icon: <AudioFileRounded fontSize="small" sx={{ color: white }} />,
        label: 'MP3',
      };
    case 'mp4':
      return {
        bg: theme.palette.grey[800],
        icon: <VideoFileRounded fontSize="small" sx={{ color: white }} />,
        label: 'MP4',
      };
    default:
      return {
        bg: theme.palette.grey[700],
        icon: <InsertDriveFileRounded fontSize="small" sx={{ color: white }} />,
        label: (ext || 'FILE').toUpperCase(),
      };
  }
}

export default function FileCard({
  title,
  fileType,           // เช่น "pdf" | "docx" | ... ถ้าไม่ส่ง จะเดาจาก title
  typeLabel,          // ถ้าส่งมา จะ override label เช่น "เอกสาร"
  href,               // ถ้ามี จะคลิกเปิดแท็บใหม่
  onClose,            // ฟังก์ชันปุ่ม X
  disabled = false,
  sx,
}) {
  const theme = useTheme();
  const ext = (fileType || extFromTitle(title) || '').toLowerCase();
  const vis = getVisuals(ext, theme);

  return (
    <Box
      sx={{
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        gap: 1.25,
        px: 1.25,
        py: 0.75,
        pr: 4.5,
        width: "300px",
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 3,
        bgcolor: 'background.paper',
        pointerEvents: disabled ? 'none' : 'auto',
        opacity: disabled ? 0.6 : 1,
        ...sx,
      }}
    >
      {/* ไอคอนสี่เหลี่ยมทางซ้าย */}
      <Box
        sx={{
          width: 36,
          height: 36,
          borderRadius: 1.5,
          display: 'grid',
          placeItems: 'center',
          bgcolor: vis.bg,
          flexShrink: 0,
        }}
      >
        {vis.icon}
      </Box>

      {/* ชื่อไฟล์ + ชนิดไฟล์ */}
      <Box
        component={href ? Link : 'div'}
        href={href || undefined}
        target={href ? '_blank' : undefined}
        style={{ textDecoration: 'none', color: 'inherit' }}
        sx={{ minWidth: 0, flex: 1 }}
      >
        <Stack spacing={0.25}>
          <Typography
            variant="subtitle2"
            noWrap
            title={title}
            sx={{ lineHeight: 1.25, maxWidth: '100%' }}
          >
            {title}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {typeLabel || vis.label}
          </Typography>
        </Stack>
      </Box>

      {/* ปุ่ม X มุมขวา */}
      {onClose && (
        <IconButton
          size="small"
          aria-label="remove file"
          onClick={onClose}
          sx={{
            position: 'absolute',
            top: -6,
            right: -6,
            width: 24,
            height: 24,
            bgcolor: 'common.black',
            color: 'common.white',
            border: '2px solid #fff',
            '&:hover': { bgcolor: 'common.black' },
          }}
        >
          <CloseRounded sx={{ fontSize: 16 }} />
        </IconButton>
      )}
    </Box>
  );
}
