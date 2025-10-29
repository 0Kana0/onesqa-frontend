"use client";

import React from 'react';
import { Box, Typography } from '@mui/material';

const EmptyState = () => {
  return (
    <Box
      sx={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        py: { xs: 4, md: 8 },
      }}
    >
      {/* Robot Logo with Animation */}
      <Box
        sx={{
          position: 'relative',
          mb: 3,
        }}
      >
        {/* แอนิเมชันดาว */}
        <Box
          sx={{
            position: 'absolute',
            top: -20,
            left: -30,
            width: 20,
            height: 20,
            '&::before': {
              content: '""',
              position: 'absolute',
              width: 4,
              height: 4,
              backgroundColor: 'primary.main',
              borderRadius: '50%',
              animation: 'twinkle 2s infinite',
            },
            '@keyframes twinkle': {
              '0%, 100%': { opacity: 0.3, transform: 'scale(0.8)' },
              '50%': { opacity: 1, transform: 'scale(1.2)' },
            },
          }}
        />
        
        {/* รูป AI Avatar */}
        <Box
          sx={{
            width: { xs: 180, md: 240 }, // เพิ่มจาก 120→180 และ 160→240 (เพิ่ม 50%)
            height: { xs: 180, md: 240 }, // เพิ่มจาก 120→180 และ 160→240 (เพิ่ม 50%)
            borderRadius: 3,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <img
            src="/images/ai-avatar.png"
            alt="ONESQA AI Avatar"
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'contain',
            }}
          />
        </Box>
      </Box>
    </Box>
  );
};

export default EmptyState;