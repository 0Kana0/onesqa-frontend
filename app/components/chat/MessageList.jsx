"use client";

import React, { useRef, useEffect, useState } from 'react';
import { Box, Avatar, Typography, Paper, IconButton, Chip } from '@mui/material';
import {
  ContentCopy as CopyIcon,
  Download as DownloadIcon,
  Link as LinkIcon,
  PlayArrow as PlayIcon,
  Pause as PauseIcon,
  Stop as StopIcon,
  VolumeUp as VolumeUpIcon,
  KeyboardArrowUp as ArrowUpIcon,
  KeyboardArrowDown as ArrowDownIcon,
} from '@mui/icons-material';
import dayjs from 'dayjs';
import 'dayjs/locale/th';

// กำหนด locale เป็นไทย
dayjs.locale('th');

const MessageList = ({ messages = [], isLoading = false }) => {
  const messagesEndRef = useRef(null);
  // TODO: ฟีเจอร์เสียงยังไม่ได้ใช้งาน - ปิดไว้ชั่วคราว
  // const [playingAudio, setPlayingAudio] = useState(null);
  // const [currentAudio, setCurrentAudio] = useState(null);

  // เลื่อนหน้าจอไปล่างสุดอัตโนมัติเมื่อมีข้อความใหม่
  const scrollToBottom = () => {
    // ใช้ setTimeout เพื่อให้แน่ใจว่า DOM ได้ render เสร็จแล้ว
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ 
        behavior: 'smooth',
        block: 'end',
        inline: 'nearest'
      });
    }, 100);
  };

  const scrollToTop = () => {
    // เลื่อนไปบนสุด
    const container = messagesEndRef.current?.parentElement;
    if (container) {
      container.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleCopyMessage = (content) => {
    navigator.clipboard.writeText(content);
    // แสดงการแจ้งเตือน toast
  };

  const handleDownloadFile = (fileUrl, filename) => {
    const link = document.createElement('a');
    link.href = fileUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // TODO: ฟีเจอร์เสียงยังไม่ได้ใช้งาน - ปิดไว้ชั่วคราว
  /*
  const handlePlayAudio = async (audioUrl, messageId) => {
    try {
      // หยุดเสียงที่เล่นอยู่ก่อน (ถ้ามี)
      if (currentAudio) {
        currentAudio.pause();
        currentAudio.currentTime = 0;
        setCurrentAudio(null);
        setPlayingAudio(null);
      }

      // ถ้าคลิกเสียงเดิมที่กำลังเล่นอยู่ ให้หยุด
      if (playingAudio === messageId) {
        setPlayingAudio(null);
        return;
      }

      const audio = new Audio();
      
      // ตั้งค่า audio
      audio.preload = 'metadata';
      audio.crossOrigin = 'anonymous';
      
      // Event listeners
      audio.addEventListener('loadstart', () => {
        console.log('เริ่มโหลดไฟล์เสียง:', audioUrl);
      });
      
      audio.addEventListener('canplay', () => {
        console.log('พร้อมเล่นเสียงแล้ว');
      });
      
      audio.addEventListener('ended', () => {
        setPlayingAudio(null);
        setCurrentAudio(null);
      });
      
      audio.addEventListener('error', (e) => {
        console.error('Error loading audio:', e);
        throw new Error('ไม่สามารถโหลดไฟล์เสียงได้');
      });
      
      // ตั้งค่า source
      audio.src = audioUrl;
      
      // ตั้งค่า state
      setCurrentAudio(audio);
      setPlayingAudio(messageId);
      
      // เล่นเสียง
      await audio.play();
      
      console.log('เล่นเสียงสำเร็จ:', audioUrl);
    } catch (error) {
      console.error('ไม่สามารถเล่นไฟล์เสียงได้:', error);
      setPlayingAudio(null);
      setCurrentAudio(null);
      
      // สร้างเสียง beep แทน
      try {
        // ใช้ Web Audio API สร้างเสียง beep
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
        oscillator.type = 'sine';
        
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 1);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 1);
        
        alert('ไม่สามารถเล่นไฟล์เสียงได้\nได้เล่นเสียงทดแทนแทน\n\nสาเหตุ: ' + error.message);
      } catch (beepError) {
        alert('ไม่สามารถเล่นไฟล์เสียงได้: ' + error.message);
      }
    }
  };
  */

  const renderMessageContent = (message) => {
    switch (message.type) {
      case 'text':
        return (
          <Typography
            variant="body1"
            sx={{
              fontSize: { xs: '0.9rem', sm: '1rem' },
              lineHeight: 1.6,
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
            }}
          >
            {message.content}
          </Typography>
        );

      // TODO: ฟีเจอร์เสียงยังไม่ได้ใช้งาน - ปิดไว้ชั่วคราว
      case 'audio':
        return (
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              backgroundColor: 'grey.100',
              borderRadius: 3,
              p: 2,
              gap: 2,
              minWidth: { xs: 200, sm: 300 },
            }}
          >
            <VolumeUpIcon sx={{ color: 'text.secondary' }} />
            <Typography variant="body2" color="text.secondary">
              🔊 ไฟล์เสียง: {message.filename || 'audio-file.mp3'}
            </Typography>
            <Typography variant="caption" sx={{ color: 'text.disabled', ml: 'auto' }}>
              {message.duration || '00:00'}
            </Typography>
          </Box>
        );
        
      /* TODO: Audio Player ฟีเจอร์เต็ม - เปิดใช้งานภายหลัง
        return (
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              gap: 1,
              minWidth: { xs: 200, sm: 300 },
            }}
          >
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                backgroundColor: 'primary.main',
                color: 'white',
                borderRadius: 3,
                p: 2,
                gap: 2,
              }}
            >
              <IconButton
                onClick={() => handlePlayAudio(message.audioUrl, message.id)}
                sx={{ 
                  color: 'white',
                  backgroundColor: 'rgba(255,255,255,0.1)',
                  '&:hover': {
                    backgroundColor: 'rgba(255,255,255,0.2)',
                  }
                }}
                size="small"
              >
                {playingAudio === message.id ? <PauseIcon /> : <PlayIcon />}
              </IconButton>
              
              <Box
                sx={{
                  flex: 1,
                  height: 30,
                  background: playingAudio === message.id 
                    ? 'linear-gradient(90deg, rgba(255,255,255,0.5) 0%, rgba(255,255,255,0.8) 50%, rgba(255,255,255,0.5) 100%)'
                    : 'linear-gradient(90deg, rgba(255,255,255,0.3) 0%, rgba(255,255,255,0.6) 50%, rgba(255,255,255,0.3) 100%)',
                  borderRadius: 1,
                  position: 'relative',
                  overflow: 'hidden',
                  cursor: 'pointer',
                }}
                onClick={() => handlePlayAudio(message.audioUrl, message.id)}
              >
                <Box
                  sx={{
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    height: '100%',
                    background: 'repeating-linear-gradient(90deg, transparent, transparent 2px, rgba(255,255,255,0.8) 2px, rgba(255,255,255,0.8) 4px)',
                    animation: playingAudio === message.id ? 'pulse 2s ease-in-out infinite' : 'none',
                    '@keyframes pulse': {
                      '0%, 100%': { opacity: 0.6 },
                      '50%': { opacity: 1 },
                    },
                  }}
                />
              </Box>
              
              <Typography variant="caption" sx={{ color: 'white', minWidth: 'fit-content' }}>
                {message.duration || '00:00'}
              </Typography>
            </Box>

            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                p: 1,
                backgroundColor: 'grey.50',
                borderRadius: 2,
                border: '1px dashed',
                borderColor: 'grey.300',
              }}
            >
              <Typography variant="caption" color="text.secondary">
                📱 เล่นด้วย HTML5 Player:
              </Typography>
              <audio
                controls
                preload="metadata"
                style={{
                  width: '100%',
                  height: '32px',
                }}
              >
                <source src={message.audioUrl} type="audio/mpeg" />
                <source src={message.audioUrl} type="audio/wav" />
                <source src={message.audioUrl} type="audio/ogg" />
                เบราว์เซอร์ของคุณไม่รองรับการเล่นเสียง
              </audio>
            </Box>
          </Box>
        );
      */

      case 'image':
        return (
          <Box
            sx={{
              maxWidth: { xs: 250, sm: 400 },
              borderRadius: 2,
              overflow: 'hidden',
            }}
          >
            <img
              src={message.imageUrl}
              alt={message.alt || 'Image'}
              style={{
                width: '100%',
                height: 'auto',
                display: 'block',
              }}
            />
          </Box>
        );

      case 'link':
        return (
          <Paper
            elevation={1}
            sx={{
              p: 2,
              borderRadius: 2,
              backgroundColor: 'primary.main',
              color: 'white',
              maxWidth: { xs: 280, sm: 400 },
              cursor: 'pointer',
              '&:hover': {
                elevation: 3,
              },
            }}
            onClick={() => window.open(message.url, '_blank')}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <LinkIcon fontSize="small" />
              <Typography variant="subtitle2" noWrap>
                {message.title || 'External Link Title'}
              </Typography>
            </Box>
            <Typography variant="body2" sx={{ opacity: 0.9, mb: 1 }}>
              {message.description || 'External link description'}
            </Typography>
            <Typography variant="caption" sx={{ opacity: 0.7 }}>
              {message.url || 'https://www.externallink.com'}
            </Typography>
          </Paper>
        );

      case 'table':
        return (
          <Box sx={{ overflowX: 'auto', maxWidth: '100%' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <tbody>
                {message.tableData?.map((row, rowIndex) => (
                  <tr key={rowIndex}>
                    {row.map((cell, cellIndex) => (
                      <td
                        key={cellIndex}
                        style={{
                          padding: '8px 12px',
                          border: '1px solid rgba(128, 128, 128, 0.3)',
                          fontSize: '0.875rem',
                        }}
                      >
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </Box>
        );

      default:
        return (
          <Typography variant="body1">
            {message.content}
          </Typography>
        );
    }
  };

  if (messages.length === 0 && !isLoading) {
    return null;
  }

  return (
    <Box
      sx={{
        flex: 1,
        minHeight: 0, // สำคัญมาก! ป้องกัน flex item จากการขยายเกิน
        overflow: 'auto',
        p: { xs: 1, sm: 2 },
        display: 'flex',
        flexDirection: 'column',
        gap: { xs: 2, sm: 3 },
        backgroundColor: (theme) => theme.palette.mode === 'dark' 
          ? theme.palette.background.default 
          : '#ffffff',
        // ปรับแต่ง scrollbar ให้สวยงาม
        '&::-webkit-scrollbar': {
          width: '6px',
        },
        '&::-webkit-scrollbar-track': {
          backgroundColor: 'transparent',
        },
        '&::-webkit-scrollbar-thumb': {
          backgroundColor: (theme) => theme.palette.mode === 'dark' 
            ? 'rgba(255,255,255,0.3)' 
            : 'rgba(0,0,0,0.2)',
          borderRadius: '3px',
          '&:hover': {
            backgroundColor: (theme) => theme.palette.mode === 'dark' 
              ? 'rgba(255,255,255,0.5)' 
              : 'rgba(0,0,0,0.4)',
          },
        },
        // สำหรับ Firefox
        scrollbarWidth: 'thin',
        scrollbarColor: (theme) => theme.palette.mode === 'dark' 
          ? 'rgba(255,255,255,0.3) transparent' 
          : 'rgba(0,0,0,0.2) transparent',
      }}
    >
      {messages.map((message, index) => {
        const isUser = message.sender === 'user';
        
        return (
          <Box
            key={message.id || index}
            sx={{
              display: 'flex',
              justifyContent: isUser ? 'flex-end' : 'flex-start',
              width: '100%',
            }}
          >
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                maxWidth: { xs: '85%', sm: '75%', md: '65%' },
                width: '100%',
              }}
            >
              {/* แถวข้อความ */}
              <Box
                sx={{
                  display: 'flex',
                  gap: { xs: 1, sm: 2 },
                  alignItems: 'flex-start',
                  flexDirection: isUser ? 'row-reverse' : 'row',
                }}
              >
                {/* รูปประจำตัว */}
                <Avatar
                  sx={{
                    width: { xs: 32, sm: 40 },
                    height: { xs: 32, sm: 40 },
                    backgroundColor: isUser ? 'grey.300' : 'transparent',
                    fontSize: { xs: '0.875rem', sm: '1rem' },
                    flexShrink: 0,
                  }}
                  src={!isUser ? '/images/ai-avatar.png' : undefined}
                >
                  {isUser ? '👤' : '🤖'}
                </Avatar>

                {/* Container ข้อความ */}
                <Box
                  sx={{
                    backgroundColor: isUser 
                      ? 'primary.main' 
                      : (theme) => theme.palette.mode === 'dark' 
                        ? 'grey.800' 
                        : 'grey.100',
                    color: isUser 
                      ? 'white' 
                      : (theme) => theme.palette.mode === 'dark' 
                        ? 'grey.100' 
                        : 'text.primary',
                    border: (theme) => theme.palette.mode === 'dark' 
                      ? '1px solid rgba(255,255,255,0.1)' 
                      : '1px solid rgba(0,0,0,0.1)',
                    borderRadius: 3,
                    p: { xs: 2, sm: 2.5 },
                    position: 'relative',
                    maxWidth: '100%',
                    wordBreak: 'break-word'
                  }}
                >
                  {/* เนื้อหาข้อความ */}
                  <Box>
                    {renderMessageContent(message)}
                  </Box>
                </Box>
              </Box>

              {/* แถววันที่เวลาและปุ่มจัดการ - นอกกรอบข้อความ */}
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: isUser ? 'flex-end' : 'flex-start',
                  alignItems: 'center',
                  mt: 0.5,
                  ml: isUser ? 0 : { xs: 5, sm: 6 }, // เว้นระยะจาก Avatar ของ AI
                  mr: isUser ? { xs: 5, sm: 6 } : 0, // เว้นระยะจาก Avatar ของ User
                }}
              >
                {/* ปุ่มจัดการข้อความและวันที่เวลา - แสดงเฉพาะ AI */}
                {message.sender === 'assistant' && (
                  <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                    {/* ปุ่มจัดการ */}
                    <Box sx={{ display: 'flex', gap: 0.5 }}>
                      <IconButton
                        size="small"
                        onClick={() => handleCopyMessage(message.content)}
                        sx={{
                          color: 'text.secondary',
                          '&:hover': { color: 'primary.main' },
                        }}
                      >
                        <CopyIcon fontSize="small" />
                      </IconButton>
                      
                      {/* TODO: ฟีเจอร์แปลงข้อความเป็นเสียง - ปิดไว้ชั่วคราว
                      {message.type === 'text' && (
                        <IconButton
                          size="small"
                          onClick={() => {/* แปลงข้อความเป็นเสียง *//*}}
                          sx={{
                            color: 'text.secondary',
                            '&:hover': { color: 'primary.main' },
                          }}
                        >
                          <VolumeUpIcon fontSize="small" />
                        </IconButton>
                      )}
                      */}
                      
                      {message.downloadUrl && (
                        <IconButton
                          size="small"
                          onClick={() => handleDownloadFile(message.downloadUrl, message.filename)}
                          sx={{
                            color: 'text.secondary',
                            '&:hover': { color: 'primary.main' },
                          }}
                        >
                          <DownloadIcon fontSize="small" />
                        </IconButton>
                      )}
                    </Box>

                    {/* วันที่เวลา AI - อยู่ติดกับปุ่ม */}
                    <Typography
                      variant="caption"
                      sx={{
                        color: 'text.disabled',
                        fontSize: { xs: '0.65rem', sm: '0.7rem' },
                      }}
                    >
                      {dayjs(message.timestamp).format('DD/MM/YYYY | HH:mm น.')}
                    </Typography>
                  </Box>
                )}

                {/* วันที่เวลา User - แยกแสดง */}
                {message.sender === 'user' && (
                  <Typography
                    variant="caption"
                    sx={{
                      color: 'text.disabled',
                      fontSize: { xs: '0.65rem', sm: '0.7rem' },
                    }}
                  >
                    {dayjs(message.timestamp).format('DD/MM/YYYY | HH:mm น.')}
                  </Typography>
                )}
              </Box>
            </Box>
          </Box>
        );
      })}

      {/* ตัวบ่งชี้การโหลด */}
      {isLoading && (
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'flex-start',
            width: '100%',
          }}
        >
          <Box
            sx={{
              display: 'flex',
              gap: 2,
              alignItems: 'flex-start',
              maxWidth: { xs: '85%', sm: '75%', md: '65%' },
            }}
          >
            <Avatar
              sx={{
                width: { xs: 32, sm: 40 },
                height: { xs: 32, sm: 40 },
                backgroundColor: 'primary.main',
              }}
            >
              🤖
            </Avatar>
            
            <Box
              sx={{
                backgroundColor: 'grey.100',
                borderRadius: 3,
                p: { xs: 2, sm: 2.5 },
                position: 'relative',
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  top: 12,
                  left: -8,
                  width: 0,
                  height: 0,
                  borderTop: '8px solid transparent',
                  borderBottom: '8px solid transparent',
                  borderRight: '8px solid',
                  borderRightColor: 'grey.100',
                },
              }}
            >
              <Box sx={{ display: 'flex', gap: 0.5, mb: 0.5 }}>
                {[...Array(3)].map((_, i) => (
                  <Box
                    key={i}
                    sx={{
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      backgroundColor: 'primary.main',
                      animation: 'typing 1.4s ease-in-out infinite',
                      animationDelay: `${i * 0.2}s`,
                      '@keyframes typing': {
                        '0%, 60%, 100%': {
                          transform: 'translateY(0)',
                          opacity: 0.4,
                        },
                        '30%': {
                          transform: 'translateY(-10px)',
                          opacity: 1,
                        },
                      },
                    }}
                  />
                ))}
              </Box>
              <Typography variant="caption" color="text.secondary">
                กำลังพิมพ์...
              </Typography>
            </Box>
          </Box>
        </Box>
      )}

      {/* จุดอ้างอิงสำหรับการเลื่อนอัตโนมัติ */}
      <div ref={messagesEndRef} />

      {/* ปุ่มควบคุมการ scroll (แสดงเมื่อมีข้อความมาก) */}
      {messages.length > 5 && (
        <Box
          sx={{
            position: 'fixed',
            right: { xs: 16, md: 24 },
            bottom: { xs: 100, md: 120 },
            display: 'flex',
            flexDirection: 'column',
            gap: 1,
            zIndex: 1000,
          }}
        >
          {/* ปุ่มไปบนสุด */}
          <IconButton
            onClick={scrollToTop}
            size="small"
            sx={{
              backgroundColor: (theme) => theme.palette.mode === 'dark' 
                ? theme.palette.grey[800] 
                : 'background.paper',
              color: (theme) => theme.palette.mode === 'dark' 
                ? 'grey.100' 
                : 'text.primary',
              border: (theme) => theme.palette.mode === 'dark' 
                ? '1px solid rgba(255,255,255,0.1)' 
                : 'none',
              boxShadow: (theme) => theme.palette.mode === 'dark' 
                ? '0 4px 8px rgba(0,0,0,0.3)' 
                : 2,
              '&:hover': {
                backgroundColor: (theme) => theme.palette.mode === 'dark' 
                  ? theme.palette.grey[700] 
                  : 'grey.100',
              },
            }}
          >
            <ArrowUpIcon />
          </IconButton>
          
          {/* ปุ่มไปล่างสุด */}
          <IconButton
            onClick={scrollToBottom}
            size="small"
            sx={{
              backgroundColor: (theme) => theme.palette.mode === 'dark' 
                ? theme.palette.grey[800] 
                : 'background.paper',
              color: (theme) => theme.palette.mode === 'dark' 
                ? 'grey.100' 
                : 'text.primary',
              border: (theme) => theme.palette.mode === 'dark' 
                ? '1px solid rgba(255,255,255,0.1)' 
                : 'none',
              boxShadow: (theme) => theme.palette.mode === 'dark' 
                ? '0 4px 8px rgba(0,0,0,0.3)' 
                : 2,
              '&:hover': {
                backgroundColor: (theme) => theme.palette.mode === 'dark' 
                  ? theme.palette.grey[700] 
                  : 'grey.100',
              },
            }}
          >
            <ArrowDownIcon />
          </IconButton>
        </Box>
      )}
    </Box>
  );
};

export default MessageList;