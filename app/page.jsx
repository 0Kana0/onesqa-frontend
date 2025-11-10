// app/upload/page.jsx (หรือ components/UploadBox.jsx)
"use client";
import { useState, useMemo } from "react";
import { useMutation, useApolloClient } from "@apollo/client/react";
import { MULTIPLE_UPLOAD } from "@/graphql/file/mutations";

export default function UploadPage() {
  const client = useApolloClient();
  const [files, setFiles] = useState([]); // Array<File>
  const [mutate, { data, loading, error }] = useMutation(MULTIPLE_UPLOAD, {
    client,
  });

  const onChange = (e) => {
    const incoming = Array.from(e.target.files ?? []);

    setFiles((prev) => {
      // กันไฟล์ซ้ำด้วย key ที่น่าจะ unique พอสำหรับฝั่งเบราเซอร์
      const seen = new Set(
        prev.map((f) => `${f.name}|${f.size}|${f.lastModified}`)
      );
      const merged = [...prev];

      for (const f of incoming) {
        const key = `${f.name}|${f.size}|${f.lastModified}`;
        if (!seen.has(key)) {
          seen.add(key);
          merged.push(f);
        }
      }
      return merged;
    });

    // รีเซ็ตค่า input เพื่อให้เลือกชุดเดิมซ้ำได้ (บางเบราเซอร์ไม่ยิง change ถ้าไฟล์เดิม)
    e.target.value = "";
  };

  const totalBytes = useMemo(
    () => files.reduce((sum, f) => sum + (f?.size ?? 0), 0),
    [files]
  );

  const onClear = () => setFiles([]);
  const onSubmit = async (e) => {
    e.preventDefault();
    if (!files.length) return;
    await mutate({ variables: { files } });
    onClear()
  };

  const removeAt = (idx) =>
    setFiles((prev) => prev.filter((_, i) => i !== idx));

  return (
    <div style={{ maxWidth: 560, margin: "40px auto" }}>
      <h3>อัปโหลดไฟล์หลายไฟล์ (GraphQL)</h3>

      <form onSubmit={onSubmit}>
        <input type="file" multiple onChange={onChange} />
        <button
          type="submit"
          disabled={!files.length || loading}
          style={{ marginLeft: 8 }}
        >
          {loading ? "กำลังอัปโหลด..." : `อัปโหลด (${files.length} ไฟล์)`}
        </button>
        <button
          type="button"
          onClick={onClear}
          disabled={!files.length || loading}
          style={{ marginLeft: 8 }}
        >
          ล้างรายการ
        </button>
      </form>

      {files.length > 0 && (
        <div style={{ marginTop: 12, fontSize: 13 }}>
          <div>
            ไฟล์ที่เลือก: {files.length} ไฟล์ • รวม ~
            {(totalBytes / 1024 / 1024).toFixed(2)} MB
          </div>
          <ul style={{ marginTop: 8 }}>
            {files.map((f, i) => (
              <li key={`${f.name}-${f.lastModified}-${i}`}>
                {f.name} ({(f.size / 1024).toFixed(1)} KB) —{" "}
                {f.type || "unknown"}
                <button
                  type="button"
                  onClick={() => removeAt(i)}
                  style={{ marginLeft: 8 }}
                >
                  ลบ
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {error && <p style={{ color: "crimson" }}>{error.message}</p>}

      {data?.multipleUpload && (
        <div style={{ marginTop: 16 }}>
          <h4>อัปโหลดสำเร็จ</h4>
          <ul>
            {data.multipleUpload.map((f, i) => (
              <li key={i}>
                <div>ชื่อไฟล์: {f.filename}</div>
                <div>
                  ขนาด: {f.size} bytes • ชนิด: {f.mimetype}
                </div>
                <div>
                  URL:{" "}
                  <a
                    href={(process.env.NEXT_PUBLIC_FILE_URL || "") + f.url}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {f.url}
                  </a>
                </div>
                <hr />
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
