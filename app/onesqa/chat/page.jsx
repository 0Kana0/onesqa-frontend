"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Box, useTheme, useMediaQuery } from '@mui/material';
import ChatHeader from '../../components/chat/ChatHeader';
import ChatInput from '../../components/chat/ChatInput';
import MessageList from '../../components/chat/MessageList';
import EmptyState from '../../components/chat/EmptyState';

const ChatPage = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedModel, setSelectedModel] = useState('Gemini 2.5 Pro');
  
  const models = [
    { id: 'gemini-2.5-pro', name: 'Gemini 2.5 Pro', provider: 'Google' },
    { id: 'gpt-5', name: 'GPT-5', provider: 'OpenAI' },
    { id: 'claude-3', name: 'Claude 3', provider: 'Anthropic' }
  ];

  // จำลองการส่งข้อความ
  const handleSendMessage = async (message) => {
    if (!message.trim()) return;

    // เพิ่มข้อความของผู้ใช้
    const userMessage = {
      id: Date.now(),
      content: message,
      sender: 'user',
      timestamp: new Date(),
      type: 'text'
    };
    
    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    // จำลองการตอบกลับของ AI ตามประเภทข้อความ
    setTimeout(() => {
      let aiMessage = {
        id: Date.now() + 1,
        sender: 'assistant',
        timestamp: new Date(),
      };

      // ตรวจสอบประเภทการทดสอบ
      if (message.includes('ทดสอบรูป') || message.includes('แผนภูมิ')) {
        aiMessage = {
          ...aiMessage,
          content: 'นี่คือตัวอย่างแผนภูมิ',
          type: 'image',
          imageUrl: '/images/chart-example.png',
          alt: 'ตัวอย่างแผนภูมิ'
        };
      } else if (message.includes('ทดสอบลิงก์') || message.includes('เอกสาร')) {
        aiMessage = {
          ...aiMessage,
          content: 'คู่มือการประเมินคุณภาพภายนอก ONESQA 2025',
          type: 'link',
          linkUrl: 'https://www.onesqa.or.th/th/Home/Index',
          linkTitle: 'คู่มือการประเมินคุณภาพภายนอก ONESQA 2025',
          linkDescription: 'เอกสารคู่มือปฏิบัติงานสำหรับการประเมินคุณภาพภายนอก ระดับอุดมศึกษา รวมถึงแนวทางและเครื่องมือประเมิน'
        };
      } else if (message.includes('ทดสอบตาราง') || message.includes('ข้อมูล')) {
        aiMessage = {
          ...aiMessage,
          content: 'ข้อมูลสถิติการประเมินคุณภาพภายนอก',
          type: 'table',
          tableData: [
            ['หัวข้อ', 'ค่าเฉลี่ย', 'เอกสารสำคัญ'],
            ['องค์การและการจัดการ', 'A-5 มาตรฐาน กว่า 2542 และ พ.ศ. กว่า 2543 (และปีการศึกษา พ.ศ.2561) การปฏิบัติงานและการรักษาข้อมูลระดับคุณภาพการศึกษาภายนอก วิธีปฏิบัติ', 'และแนวปฏิบัติที่เกี่ยวข้อง'],
            ['หลักสูตรและการเรียนการสอน', 'A-5 มาตรฐาน มากกว่า กว่า กว่า และประเมินผล', 'และแนวปฏิบัติที่เกี่ยวข้อง'],
            ['การพิจารณาดูแลคุณภาพ และแลงาคารดานนักศีกษา', 'A-5 มาตรฐาน เฉลี่ย กว่าวซ่า มาตรฐาน A-6 วิชาการสู่การบริหารการจัดการทรัพยากรมนุษย์ เน้น ดรส.', 'และแนวปฏิบัติที่เกี่ยวข้อง']
          ]
        };
      } else if (message.includes('ทดสอบไฟล์') || message.includes('ส่งไฟล์')) {
        aiMessage = {
          ...aiMessage,
          content: 'เอกสารตัวอย่าง',
          type: 'file',
          filename: 'example-document.pdf',
          downloadUrl: '#',
          fileSize: '2.5 MB'
        };
      } else {
        aiMessage = {
          ...aiMessage,
          content: `นี่คือการตอบกลับจำลองจาก ${selectedModel} สำหรับข้อความ: "${message}"`,
          type: 'text'
        };
      }
      
      setMessages(prev => [...prev, aiMessage]);
      setIsLoading(false);
    }, Math.random() * 2000 + 1000);
  };

  const handleModelChange = (newModel) => {
    setSelectedModel(newModel);
  };

  const handleAttachFile = (files) => {
    // TODO: Implement file attachment
    console.log('Files attached:', files);
  };

  const handleVoiceRecord = (isRecording) => {
    // TODO: Implement voice recording
    console.log('Voice recording:', isRecording);
  };

  return (
    <Box
      sx={{
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: 'background.default',
      }}
    >
      {/* Header */}
      <ChatHeader 
        selectedModel={selectedModel}
        onModelChange={handleModelChange}
        models={models}
      />
      
      {/* Messages Area */}
      <Box sx={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
        {messages.length === 0 ? (
          <EmptyState />
        ) : (
          <MessageList 
            messages={messages}
            isLoading={isLoading}
          />
        )}
      </Box>

      {/* Input Area */}
      <ChatInput
        onSendMessage={handleSendMessage}
        onAttachFile={handleAttachFile}
        onVoiceRecord={handleVoiceRecord}
        disabled={isLoading}
        placeholder="พิมพ์ข้อความของคุณที่นี่..."
      />
    </Box>
  );
};

export default ChatPage;
