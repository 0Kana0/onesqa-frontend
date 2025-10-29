"use client";

import React, { useState, useRef, useEffect } from 'react';
import {
  Box,
  TextField,
  IconButton,
  Button,
  Paper,
  Chip,
  useTheme,
  useMediaQuery,
  CircularProgress,
} from '@mui/material';
import {
  Send as SendIcon,
  Add as AddIcon,
  KeyboardVoiceOutlined,
  AttachFileOutlined,
  Stop as StopIcon,
} from '@mui/icons-material';

const ChatInput = ({ 
  onSendMessage, 
  onAttachFile, 
  onVoiceRecord, 
  disabled = false,
  placeholder = "พิมพ์ข้อความ...",
  suggestedPrompts = [
    "มาตรฐานที่ใช้ในการประเมินคุณภาพภายนอกคืออะไร?",
    "ขั้นตอนของการประเมินคุณภาพภายนอกมีอะไรบ้าง?", 
    "กรุณาเตรียมร่างจดหมายแจ้งสถาบันการศึกษาเกี่ยวกับวันที่ประเมินคุณภาพภายนอก",
    // TODO: ฟีเจอร์เสียงยังไม่ได้ใช้งาน - ปิดไว้ชั่วคราว เผื่อเขาต้องการค่อยเปิด
    // "🔊 ทดสอบเสียง - ส่งข้อความเสียง",
    "🖼️ ทดสอบรูป - แสดงแผนภูมิ", 
    "🔗 ทดสอบลิงก์ - ส่งเอกสาร",
    "📊 ทดสอบตาราง - แสดงข้อมูล",
    "📄 ทดสอบไฟล์ - ส่งไฟล์ข้อความ"
  ]
}) => {
  const isLoading = disabled; // ใช้ disabled แทน isLoading
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const inputRef = useRef(null);
  const fileInputRef = useRef(null);
  
  const [message, setMessage] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [attachedFiles, setAttachedFiles] = useState([]);
  const [recognition, setRecognition] = useState(null);
  const [speechLang, setSpeechLang] = useState('th-TH'); // ภาษาสำหรับการบันทึกเสียง

  // ตั้งค่า Speech Recognition
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognitionInstance = new SpeechRecognition();
        recognitionInstance.continuous = false;
        recognitionInstance.interimResults = true;
        recognitionInstance.lang = speechLang;
        
        recognitionInstance.onresult = (event) => {
          const transcript = event.results[0][0].transcript;
          setMessage(prevMessage => prevMessage + transcript);
        };
        
        recognitionInstance.onend = () => {
          setIsRecording(false);
        };
        
        recognitionInstance.onerror = (event) => {
          console.error('Speech recognition error:', event.error);
          setIsRecording(false);
          // แสดงข้อผิดพลาดให้ผู้ใช้
          alert(`เกิดข้อผิดพลาดในการบันทึกเสียง: ${event.error}`);
        };
        
        setRecognition(recognitionInstance);
      }
    }
  }, [speechLang]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey && !isMobile) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSend = () => {
    if (!message.trim() && attachedFiles.length === 0) return;
    onSendMessage(message.trim());
    setMessage('');
    setAttachedFiles([]);
  };

  const handlePromptClick = (prompt) => {
    setMessage(prompt);
    inputRef.current?.focus();
  };

  const handleFileAttach = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files || []);
    setAttachedFiles(prev => [...prev, ...files]);
  };

  const handleRemoveFile = (index) => {
    setAttachedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleVoiceRecord = () => {
    if (!recognition) {
      alert('เบราว์เซอร์ของคุณไม่รองรับการบันทึกเสียง');
      return;
    }

    if (isRecording) {
      // หยุดการบันทึกเสียง
      recognition.stop();
      setIsRecording(false);
      onVoiceRecord?.(false);
    } else {
      // เริ่มบันทึกเสียง
      try {
        recognition.start();
        setIsRecording(true);
        onVoiceRecord?.(true);
      } catch (error) {
        console.error('Error starting speech recognition:', error);
        alert('ไม่สามารถเริ่มการบันทึกเสียงได้');
      }
    }
  };

  return (
    <Box
      sx={{
        py: { xs: 2, md: 3 },
        position: 'sticky',
        bottom: 0,
        backgroundColor: 'background.default',
        borderTop: 1,
        borderColor: 'divider',
      }}
    >
      {/* ไฟล์ที่แนบ */}
      {attachedFiles.length > 0 && (
        <Box sx={{ mb: 2 }}>
          {attachedFiles.map((file, index) => (
            <Chip
              key={index}
              label={file.name}
              onDelete={() => handleRemoveFile(index)}
              variant="outlined"
              sx={{ mr: 1, mb: 1 }}
            />
          ))}
        </Box>
      )}

      {/* Main Input Area */}
      <Paper
        elevation={1}
        sx={{
          p: { xs: 1.5, md: 2 },
          borderRadius: 4,
          border: 1,
          borderColor: 'divider',
          mb: 2,
          backgroundColor: 'background.paper',
        }}
      >
        {/* แถวบน: ช่องพิมพ์ข้อความ */}
        <Box sx={{ mb: 2 }}>
          <TextField
            ref={inputRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder={isMobile ? "พิมพ์ข้อความ..." : placeholder}
            variant="outlined"
            fullWidth
            multiline
            maxRows={isMobile ? 3 : 4}
            disabled={disabled}
            onKeyDown={handleKeyDown}
            sx={{
              '& .MuiOutlinedInput-root': {
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 3,
                '& fieldset': { border: 'none' },
                fontSize: { xs: '0.9rem', md: '1rem' },
                '&:hover': {
                  borderColor: 'primary.main',
                },
                '&.Mui-focused': {
                  borderColor: 'primary.main',
                },
              },
            }}
          />
        </Box>

        {/* แถวล่าง: ปุ่มต่างๆ แยกซ้ายขวา */}
        <Box 
          sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between',
            gap: 1,
          }}
        >
          {/* ปุ่มซ้าย */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {/* ปุ่มแนบไฟล์ */}
            <IconButton 
              size="small" 
              color="primary"
              onClick={handleFileAttach}
              disabled={disabled}
              sx={{ 
                backgroundColor: 'action.hover',
                '&:hover': {
                  backgroundColor: 'primary.light',
                },
              }}
            >
              <AddIcon />
            </IconButton>

            {/* ปุ่ม Deep Research และ Canvas (Desktop เท่านั้น) */}
            {!isMobile && (
              <>
                <Button
                  variant="outlined"
                  size="small"
                  disabled={disabled}
                  sx={{ 
                    borderRadius: 6, 
                    minWidth: 'auto', 
                    px: 2,
                    fontSize: '0.75rem',
                    textTransform: 'none',
                  }}
                >
                  Deep Research
                </Button>
                <Button
                  variant="outlined"
                  size="small"
                  disabled={disabled}
                  sx={{ 
                    borderRadius: 6, 
                    minWidth: 'auto', 
                    px: 2,
                    fontSize: '0.75rem',
                    textTransform: 'none',
                  }}
                >
                  Canvas
                </Button>
              </>
            )}
          </Box>

          {/* ปุ่มขวา */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {/* ปุ่มบันทึกเสียง */}
            <IconButton 
              color={isRecording ? "error" : "primary"}
              disabled={disabled}
              onClick={handleVoiceRecord}
              title={isRecording ? 'หยุดบันทึกเสียง' : `เริ่มบันทึกเสียง (${speechLang === 'th-TH' ? 'ภาษาไทย' : 'English'})`}
              sx={{ 
                backgroundColor: isRecording ? 'error.light' : 'action.hover',
                '&:hover': {
                  backgroundColor: isRecording ? 'error.main' : 'primary.light',
                },
                ...(isRecording && {
                  animation: 'pulse 1.5s infinite',
                  '@keyframes pulse': {
                    '0%': { transform: 'scale(1)', opacity: 1 },
                    '50%': { transform: 'scale(1.1)', opacity: 0.7 },
                    '100%': { transform: 'scale(1)', opacity: 1 },
                  },
                }),
              }}
            >
              {isRecording ? <StopIcon /> : <KeyboardVoiceOutlined />}
            </IconButton>
            
            {/* ปุ่มส่ง */}
            <IconButton
              onClick={handleSend}
              disabled={(!message.trim() && attachedFiles.length === 0) || disabled || isLoading}
              color="primary"
              sx={{
                backgroundColor: (message.trim() || attachedFiles.length > 0) && !disabled ? 'primary.main' : 'grey.300',
                color: 'white',
                '&:hover': {
                  backgroundColor: (message.trim() || attachedFiles.length > 0) && !disabled ? 'primary.dark' : 'grey.400',
                },
                '&.Mui-disabled': {
                  backgroundColor: 'grey.300',
                  color: 'grey.500',
                },
              }}
            >
              {isLoading ? (
                <CircularProgress size={20} color="inherit" />
              ) : (
                <SendIcon />
              )}
            </IconButton>
          </Box>
        </Box>
      </Paper>

      {/* แสดงสถานะการบันทึกเสียง */}
      {isRecording && (
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            mt: 1,
            py: 1,
            px: 2,
            backgroundColor: 'error.light',
            color: 'error.contrastText',
            borderRadius: 2,
            animation: 'fadeIn 0.3s ease',
            '@keyframes fadeIn': {
              '0%': { opacity: 0, transform: 'translateY(-10px)' },
              '100%': { opacity: 1, transform: 'translateY(0)' },
            },
          }}
        >
          <Box
            sx={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              backgroundColor: 'error.main',
              mr: 1,
              animation: 'blink 1s infinite',
              '@keyframes blink': {
                '0%, 50%': { opacity: 1 },
                '51%, 100%': { opacity: 0.3 },
              },
            }}
          />
          กำลังบันทึกเสียง... พูดเลย! (ภาษา: {speechLang === 'th-TH' ? 'ไทย' : 'English'})
        </Box>
      )}

      {/* คำแนะนำที่แนะนำ */}
      {suggestedPrompts.length > 0 && (
        <Box
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', md: 'row' },
            gap: 1,
            flexWrap: 'wrap',
          }}
        >
          {suggestedPrompts.map((prompt, index) => (
            <Chip
              key={index}
              label={prompt}
              onClick={() => handlePromptClick(prompt)}
              variant="outlined"
              disabled={disabled}
              sx={{
                borderRadius: 3,
                cursor: disabled ? 'default' : 'pointer',
                fontSize: { xs: '0.75rem', md: '0.875rem' },
                height: { xs: 'auto', md: 32 },
                '& .MuiChip-label': {
                  px: { xs: 1.5, md: 2 },
                  py: { xs: 1, md: 0.5 },
                  whiteSpace: 'normal',
                  textAlign: 'left',
                },
                '&:hover': {
                  backgroundColor: disabled ? 'transparent' : 'action.hover',
                },
                transition: 'all 0.2s ease',
              }}
            />
          ))}
        </Box>
      )}

      {/* ช่องเลือกไฟล์ที่ซ่อนอยู่ */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        style={{ display: 'none' }}
        onChange={handleFileChange}
        accept="image/*,audio/*,.pdf,.doc,.docx,.txt"
      />
    </Box>
  );
};

export default ChatInput;