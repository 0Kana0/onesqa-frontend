"use client";

import React from 'react';
import {
  Box,
  Paper,
  Typography,
  Avatar,
  IconButton,
  Chip,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  ContentCopy as CopyIcon,
  Download as DownloadIcon,
  VolumeUp as VolumeUpIcon,
  Person as PersonIcon,
  SmartToy as BotIcon,
} from '@mui/icons-material';
import { formatDistanceToNow } from 'date-fns';
import { th } from 'date-fns/locale';

const MessageItem = ({ message, isLast }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isUser = message.type === 'user';
  
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message.content);
      // TODO: Show toast notification
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  const handleDownload = () => {
    // TODO: Implement download functionality
    console.log('Download message:', message.id);
  };

  const handlePlayAudio = () => {
    // TODO: Implement text-to-speech
    console.log('Play audio for message:', message.id);
  };

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: isUser ? 'row-reverse' : 'row',
        alignItems: 'flex-start',
        gap: { xs: 1, md: 2 },
        mb: 3,
        px: { xs: 1, md: 0 },
      }}
    >
      {/* Avatar */}
      <Avatar
        sx={{
          width: { xs: 32, md: 40 },
          height: { xs: 32, md: 40 },
          backgroundColor: isUser ? 'grey.300' : 'primary.main',
          color: isUser ? 'grey.700' : 'white',
          flexShrink: 0,
        }}
      >
        {isUser ? <PersonIcon /> : <BotIcon />}
      </Avatar>

      {/* Message Content */}
      <Box
        sx={{
          flex: 1,
          maxWidth: { xs: '85%', md: '80%' },
        }}
      >
        {/* Message Header */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            mb: 0.5,
            flexDirection: isUser ? 'row-reverse' : 'row',
          }}
        >
          <Typography
            variant="caption"
            sx={{
              color: 'text.secondary',
              fontSize: { xs: '0.7rem', md: '0.75rem' },
            }}
          >
            {formatDistanceToNow(new Date(message.timestamp), { 
              addSuffix: true,
              locale: th 
            })}
          </Typography>
          
          {!isUser && (
            <Chip
              label="AI"
              size="small"
              sx={{
                height: 16,
                fontSize: '0.6rem',
                backgroundColor: 'primary.light',
                color: 'primary.contrastText',
              }}
            />
          )}
        </Box>

        {/* Message Bubble */}
        <Paper
          elevation={1}
          sx={{
            p: { xs: 2, md: 2.5 },
            borderRadius: 3,
            backgroundColor: isUser ? 'primary.main' : 'background.paper',
            color: isUser ? 'primary.contrastText' : 'text.primary',
            border: isUser ? 'none' : 1,
            borderColor: 'divider',
            position: 'relative',
            ...(isUser ? {
              borderTopRightRadius: 1,
            } : {
              borderTopLeftRadius: 1,
            }),
          }}
        >
          {/* Message Text */}
          <Typography
            variant="body1"
            sx={{
              fontSize: { xs: '0.9rem', md: '1rem' },
              lineHeight: 1.6,
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
            }}
          >
            {message.content}
          </Typography>

          {/* Attachments */}
          {message.attachments && message.attachments.length > 0 && (
            <Box sx={{ mt: 2 }}>
              {message.attachments.map((attachment, index) => (
                <Box key={index} sx={{ mb: 1 }}>
                  {attachment.type === 'audio' && (
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1,
                        p: 1.5,
                        backgroundColor: 'rgba(0,0,0,0.1)',
                        borderRadius: 2,
                      }}
                    >
                      <IconButton size="small" color="inherit">
                        <VolumeUpIcon />
                      </IconButton>
                      <Box
                        sx={{
                          flex: 1,
                          height: 4,
                          backgroundColor: 'rgba(255,255,255,0.3)',
                          borderRadius: 2,
                          position: 'relative',
                          overflow: 'hidden',
                        }}
                      >
                        <Box
                          sx={{
                            position: 'absolute',
                            left: 0,
                            top: 0,
                            height: '100%',
                            width: '30%',
                            backgroundColor: 'white',
                            borderRadius: 2,
                          }}
                        />
                      </Box>
                      <Typography variant="caption" sx={{ minWidth: 'auto' }}>
                        {attachment.duration || '02:19'}
                      </Typography>
                    </Box>
                  )}
                  
                  {attachment.type === 'image' && (
                    <Box
                      component="img"
                      src={attachment.url}
                      alt={attachment.name}
                      sx={{
                        maxWidth: '100%',
                        height: 'auto',
                        borderRadius: 2,
                        mt: 1,
                      }}
                    />
                  )}
                  
                  {attachment.type === 'link' && (
                    <Paper
                      elevation={1}
                      sx={{
                        p: 2,
                        mt: 1,
                        backgroundColor: 'primary.main',
                        color: 'white',
                        borderRadius: 2,
                        cursor: 'pointer',
                        '&:hover': {
                          backgroundColor: 'primary.dark',
                        },
                      }}
                      onClick={() => window.open(attachment.url, '_blank')}
                    >
                      <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                        {attachment.title}
                      </Typography>
                      <Typography variant="body2" sx={{ opacity: 0.9, mb: 1 }}>
                        {attachment.description}
                      </Typography>
                      <Typography variant="caption" sx={{ opacity: 0.8 }}>
                        {attachment.url}
                      </Typography>
                    </Paper>
                  )}
                </Box>
              ))}
            </Box>
          )}
        </Paper>

        {/* Action Buttons */}
        {!isUser && (
          <Box
            sx={{
              display: 'flex',
              gap: 0.5,
              mt: 1,
              opacity: 0.7,
              '&:hover': { opacity: 1 },
              transition: 'opacity 0.2s',
            }}
          >
            <IconButton 
              size="small" 
              onClick={handleCopy}
              sx={{ 
                color: 'text.secondary',
                '&:hover': { color: 'primary.main' },
              }}
            >
              <CopyIcon fontSize="small" />
            </IconButton>
            
            <IconButton 
              size="small" 
              onClick={handleDownload}
              sx={{ 
                color: 'text.secondary',
                '&:hover': { color: 'primary.main' },
              }}
            >
              <DownloadIcon fontSize="small" />
            </IconButton>
            
            <IconButton 
              size="small" 
              onClick={handlePlayAudio}
              sx={{ 
                color: 'text.secondary',
                '&:hover': { color: 'primary.main' },
              }}
            >
              <VolumeUpIcon fontSize="small" />
            </IconButton>
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default MessageItem;