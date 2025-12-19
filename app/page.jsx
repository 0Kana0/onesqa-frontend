// app/record/page.jsx
"use client";

import { useRef, useState } from "react";

export default function RecordPage() {
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const [isRecording, setIsRecording] = useState(false);
  const [audioUrl, setAudioUrl] = useState(null);
  const [audioBlob, setAudioBlob] = useState(null);

  const startRecording = async () => {
    try {
      // ขอสิทธิ์ใช้ไมโครโฟน
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);
        setAudioBlob(blob);

        // ปิดไมค์
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error("ไม่สามารถเข้าถึงไมโครโฟนได้:", err);
      alert("อนุญาตไมโครโฟนในเบราว์เซอร์ก่อนนะ");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleUpload = async () => {
    if (!audioBlob) {
      alert("ยังไม่มีไฟล์เสียง");
      return;
    }

    const formData = new FormData();
    formData.append("file", audioBlob, "voice.webm");

    try {
      const res = await fetch("/api/upload-voice", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      console.log("อัปโหลดสำเร็จ:", data);
      alert("อัปโหลดสำเร็จ");
    } catch (err) {
      console.error("อัปโหลดล้มเหลว:", err);
      alert("อัปโหลดไม่สำเร็จ");
    }
  };

  return (
    <div style={{ padding: 20 }}>
      <h1>ทดสอบบันทึกเสียง</h1>

      <div style={{ marginBottom: 16 }}>
        {!isRecording ? (
          <button onClick={startRecording}>เริ่มบันทึกเสียง</button>
        ) : (
          <button onClick={stopRecording}>หยุดบันทึก</button>
        )}
      </div>

      {audioUrl && (
        <div style={{ marginTop: 16 }}>
          <p>ตัวอย่างเสียงที่บันทึก:</p>
          <audio src={audioUrl} controls />

          <div style={{ marginTop: 8 }}>
            <a href={audioUrl} download="voice.webm">
              ดาวน์โหลดไฟล์เสียง
            </a>
          </div>

          <div style={{ marginTop: 8 }}>
            <button onClick={handleUpload}>อัปโหลดไปเซิร์ฟเวอร์</button>
          </div>
        </div>
      )}
    </div>
  );
}
