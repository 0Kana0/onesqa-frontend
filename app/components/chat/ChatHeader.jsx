"use client";

import React, { useState } from 'react';
import {
  Box,
  Select,
  MenuItem,
  FormControl,
  Typography,
  Chip,
  Paper,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  KeyboardArrowDown as ArrowDownIcon,
  Psychology as AIIcon,
} from '@mui/icons-material';

const ChatHeader = ({ 
  selectedModel = 'Gemini 2.5 Pro', 
  onModelChange,
  models = [
    { id: 'gemini-2.5-pro', name: 'Gemini 2.5 Pro', provider: 'Google' },
    { id: 'gpt-5', name: 'GPT-5', provider: 'OpenAI' }
  ]
}) => {
  const [open, setOpen] = useState(false);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const handleModelChange = (event) => {
    const newModel = event.target.value;
    onModelChange?.(newModel);
    setOpen(false);
  };

  const getModelProvider = (modelName) => {
    const model = models.find(m => m.name === modelName);
    return model?.provider || 'AI';
  };

  return (
    <Box
      sx={{
        position: 'sticky',
        top: 0,
        backgroundColor: 'background.default',
        borderBottom: '1px solid',
        borderColor: 'divider',
        p: { xs: 2, sm: 3 },
        zIndex: 1100,
      }}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: { xs: 'center', sm: 'flex-start' },
          gap: 2,
        }}
      >
        {/* ตัวเลือก AI Model */}
        <Paper
          elevation={0}
          sx={{
            border: '1px solid',
            borderColor: (theme) => theme.palette.mode === 'dark' 
              ? 'grey.600' 
              : 'primary.main',
            borderRadius: 6,
            overflow: 'hidden',
            backgroundColor: 'background.paper',
          }}
        >
          <FormControl
            size="small"
            sx={{
              minWidth: { xs: 200, sm: 250 },
              '& .MuiOutlinedInput-root': {
                border: 'none',
                '& fieldset': {
                  border: 'none',
                },
              },
            }}
          >
            <Select
              value={selectedModel}
              onChange={handleModelChange}
              open={open}
              onOpen={() => setOpen(true)}
              onClose={() => setOpen(false)}
              IconComponent={ArrowDownIcon}
              displayEmpty
              renderValue={(selected) => (
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    px: 1,
                    py: 0.5,
                  }}
                >
                  {/* ไอคอน AI */}
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: 24,
                      height: 24,
                      borderRadius: '50%',
                      backgroundColor: (theme) => theme.palette.mode === 'dark' 
                        ? 'grey.700' 
                        : 'primary.light',
                      color: (theme) => theme.palette.mode === 'dark' 
                        ? 'grey.200' 
                        : 'primary.contrastText',
                    }}
                  >
                    <AIIcon fontSize="small" />
                  </Box>

                  {/* ชื่อโมเดล */}
                  <Typography
                    variant="body2"
                    sx={{
                      fontWeight: 500,
                      fontSize: { xs: '0.875rem', sm: '1rem' },
                      color: (theme) => theme.palette.mode === 'dark' 
                        ? 'grey.200' 
                        : 'primary.main',
                      noWrap: true,
                    }}
                  >
                    {selected}
                  </Typography>

                </Box>
              )}
              sx={{
                '& .MuiSelect-select': {
                  py: 1,
                },
              }}
              MenuProps={{
                PaperProps: {
                  sx: {
                    border: '1px solid',
                    borderColor: 'divider',
                    borderRadius: 2,
                    mt: 1,
                    minWidth: { xs: 200, sm: 280 },
                    maxHeight: 300,
                    backgroundColor: 'background.paper',
                    boxShadow: (theme) => theme.palette.mode === 'dark' 
                      ? '0 8px 32px rgba(0,0,0,0.6)' 
                      : '0 8px 32px rgba(0,0,0,0.12)',
                  },
                },
              }}
            >
              {models.map((model) => (
                <MenuItem
                  key={model.id}
                  value={model.name}
                  sx={{
                    px: 2,
                    py: 1.5,
                    color: 'text.primary',
                    '&:hover': {
                      backgroundColor: (theme) => theme.palette.mode === 'dark' 
                        ? 'rgba(255,255,255,0.08)' 
                        : 'action.hover',
                    },
                    '&.Mui-selected': {
                      backgroundColor: (theme) => theme.palette.mode === 'dark' 
                        ? 'rgba(66, 165, 245, 0.2)' 
                        : 'primary.light',
                      color: (theme) => theme.palette.mode === 'dark' 
                        ? 'primary.light' 
                        : 'primary.main',
                      '&:hover': {
                        backgroundColor: (theme) => theme.palette.mode === 'dark' 
                          ? 'rgba(66, 165, 245, 0.3)' 
                          : 'primary.light',
                      },
                    },
                  }}
                >
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 2,
                      width: '100%',
                    }}
                  >
                    {/* ไอคอนโมเดล */}
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: 32,
                        height: 32,
                        borderRadius: 1,
                        backgroundColor: (theme) => theme.palette.mode === 'dark' 
                          ? 'primary.dark' 
                          : 'primary.main',
                        color: 'white',
                      }}
                    >
                      <AIIcon fontSize="small" />
                    </Box>

                    {/* ข้อมูลโมเดล */}
                    <Box sx={{ flex: 1 }}>
                      <Typography
                        variant="body2"
                        sx={{
                          fontWeight: 500,
                          fontSize: '0.875rem',
                          color: 'text.primary',
                        }}
                      >
                        {model.name}
                      </Typography>
                    </Box>

                  
                  </Box>
                </MenuItem>
              ))}

            </Select>
          </FormControl>
        </Paper>
      </Box>
    </Box>
  );
};

export default ChatHeader;