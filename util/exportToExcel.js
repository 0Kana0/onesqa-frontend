import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

export function exportLogsToExcel(logs, ln = "th") {
  // ✅ Header ตามภาษา
  const header =
    ln === "en"
      ? ["Times", "Name", "Title", "Old Data", "Changed Data"]
      : ["เวลา", "ชื่อ", "หัวข้อ", "ข้อมูลเดิม", "ข้อมูลที่เปลี่ยนแปลง"];


  // ✅ แปลงข้อมูลให้อยู่ในรูปแบบ Array ของ Array
  const data = logs.map((log) => [
    log.time,
    log.name,
    log.topic,
    log.oldData,
    log.newData,
  ]);

  // ✅ รวม header และ data
  const worksheetData = [header, ...data];

  // ✅ สร้าง worksheet และ workbook
  const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Logs");

  // ✅ กำหนดความกว้างคอลัมน์
  worksheet["!cols"] = [
    { wch: 20 }, // เวลา
    { wch: 25 }, // ชื่อ
    { wch: 30 }, // หัวข้อ
    { wch: 50 }, // ข้อมูลเดิม
    { wch: 50 }, // ข้อมูลที่เปลี่ยนแปลง
  ];

  // ✅ สร้างไฟล์ Excel
  const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
  const blob = new Blob([excelBuffer], {
    type: "application/octet-stream",
  });

  // ✅ ดาวน์โหลดไฟล์
  saveAs(blob, `รายการ logs.xlsx`);
}

export function exportUsersToExcel(users, ln = "th") {
  // ✅ รวม model ทั้งหมดจากทุก user เพื่อสร้างหัวคอลัมน์แบบ dynamic
  const allModels = Array.from(
    new Set(users.flatMap((u) => u.aiModels?.map((m) => m.model_use) || []))
  );

  // ✅ แปลงเป็นหัวตาราง "จำนวน <model>"
  const allTranModels = allModels.map((name) => `จำนวน ${name}`);

  // ✅ กำหนด header ตามภาษา
  const baseHeaders =
    ln === "en"
      ? ["Name", "Role", "Email", "Phone", "Position", "Group", "Status", "AI Access", "Last Login"]
      : ["ชื่อ - นามสกุล", "อีเมล", "เบอร์โทรศัพท์", "บทบาท", "ตำแหน่ง", "กลุ่ม", "สถานะ", "AI Access", "ลงชื่อเข้าใช้ล่าสุด"];

  const headers = [...baseHeaders, ...allTranModels];

  // ✅ แปลงข้อมูลแต่ละ user
  const data = users.map((u) => {
    // map model → token
    const modelTokens = {};
    u.aiModels?.forEach((m) => {
      modelTokens[m.model_use] = m.token;
    });

    return [
      u.fullName || "-",
      u.email || "-",
      u.phone || "-",
      u.role || "-",
      u.position || "-",
      u.group || "-",
      ln === "en"
        ? u.status === "ใช้งานอยู่"
          ? "Active"
          : "Inactive"
        : u.status,
      u.aiAccess ? (ln === "en" ? "ON" : "เปิด") : (ln === "en" ? "OFF" : "ปิด"),
      u.lastLogin || "-",
      // ✅ เติม token ตาม model
      ...allModels.map((model) => modelTokens[model] ?? 0),
    ];
  })

  const worksheetData = [headers, ...data];

  // ✅ สร้าง worksheet & workbook
  const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Users");

  // ✅ ปรับความกว้างคอลัมน์ (แยก base + model)
  const baseCols = [
    { wch: 30 }, // ชื่อ - นามสกุล
    { wch: 20 }, // email
    { wch: 20 }, // phone
    { wch: 20 }, // บทบาท
    { wch: 20 }, // ตำแหน่ง
    { wch: 30 }, // กลุ่ม
    { wch: 20 }, // สถานะ
    { wch: 15 }, // AI Access
    { wch: 20 }, // ลงชื่อเข้าใช้ล่าสุด
  ];

  // ✅ เพิ่มคอลัมน์ model (แต่ละ model มี wch:25)
  const modelCols = allModels.map(() => ({ wch: 20 }));

  // ✅ รวมเข้าด้วยกัน
  worksheet["!cols"] = [...baseCols, ...modelCols];

  // ✅ สร้างไฟล์ Excel
  const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
  const blob = new Blob([excelBuffer], {
    type: "application/octet-stream",
  });

  const fileName =`รายชื่อผู้ใช้งาน.xlsx`;

  saveAs(blob, fileName);
}

export function exportReportsToExcel(reports, ln = "th") {
  // ✅ กำหนดหัวตารางตามภาษา
  const headers =
    ln === "en"
      ? ["Date", "User", "Position", "Conversations", "Tokens"]
      : ["วันที่", "ผู้ใช้งาน", "ตำแหน่ง", "การสนทนา", "Tokens"];

  // ✅ แปลงข้อมูลให้อยู่ในรูปแบบ Array ของ Array
  const rows = reports.map((item) => [
    item.date || "-",
    item.user || "-",
    item.position || "-",
    item.chats ?? 0,
    item.tokens ?? 0,
  ]);

  // ✅ รวม header + rows
  const worksheetData = [headers, ...rows];

  // ✅ สร้าง worksheet และ workbook
  const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Summary");

  // ✅ ปรับความกว้างคอลัมน์
  worksheet["!cols"] = [
    { wch: 15 }, // วันที่
    { wch: 25 }, // ผู้ใช้งาน
    { wch: 25 }, // ตำแหน่ง
    { wch: 15 }, // การสนทนา
    { wch: 15 }, // Tokens
  ];

  // ✅ เขียนและบันทึกไฟล์
  const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
  const blob = new Blob([excelBuffer], { type: "application/octet-stream" });

  const fileName = `สรุปรายงาน.xlsx`;

  saveAs(blob, fileName);
}
