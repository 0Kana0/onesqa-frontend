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

  const fileName = ln === "th" ? "รายการ logs.xlsx" : "Log_List.xlsx";

  // ✅ ดาวน์โหลดไฟล์
  saveAs(blob, fileName);
}

export function exportUsersToExcel(users, ln = "th") {
  // ✅ รวม model ทั้งหมดจากทุก user เพื่อสร้างหัวคอลัมน์แบบ dynamic
  const allModels = Array.from(
    new Set(users.flatMap((u) => u.aiModels?.map((m) => m.model_use) || []))
  );

  // ✅ แปลงเป็นหัวตาราง "จำนวน <model>"
  const allTranModels = allModels.map((name) => `Token ${name}`);

  // ✅ กำหนด header ตามภาษา
  const baseHeaders =
    ln === "en"
      ? ["Name", "Email", "Phone", "Role", "Position", "Group", "Status", "AI Access", "Last Login"]
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
      u.status,
      u.aiAccess ? (ln === "en" ? "Active" : "อนุญาติ") : (ln === "en" ? "Inactive" : "ไม่อนุญาติ"),
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

  const fileName = ln === "th" ? "รายชื่อผู้ใช้งาน.xlsx" : "User_List.xlsx";

  saveAs(blob, fileName);
}

export function exportHistoryToExcel(history, ln = "th") {
  // ✅ กำหนด header ตามภาษา
  const headers =
    ln === "en"
      ? ["Name", "Role", "Group", "Usage type", "Usage time", "Browser"]
      : ["ชื่อ - นามสกุล", "บทบาท", "กลุ่ม", "ประเภทการใช้งาน", "เวลาใช้งาน", "Browser"];

  // ✅ แปลงข้อมูลแต่ละ user
  const data = history.map((u) => {
    return [
      u.fullName || "-",
      u.role || "-",
      u.group || "-",
      u.event || "-",
      u.createdAt || "-",
      u.userAgent || "-",
    ];
  })

  const worksheetData = [headers, ...data];

  // ✅ สร้าง worksheet & workbook
  const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "History");

  // ✅ ปรับความกว้างคอลัมน์ (แยก base + model)
  worksheet["!cols"] = [
    { wch: 30 }, // ชื่อ - นามสกุล
    { wch: 20 }, // บทบาท
    { wch: 30 }, // กลุ่ม
    { wch: 20 }, // สถานะ
    { wch: 20 }, // AI Access
    { wch: 20 }, // ลงชื่อเข้าใช้ล่าสุด
  ];

  // ✅ สร้างไฟล์ Excel
  const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
  const blob = new Blob([excelBuffer], {
    type: "application/octet-stream",
  });

  const fileName = ln === "th" ? "ประวัติการใช้งาน.xlsx" : "User_History.xlsx";

  saveAs(blob, fileName);
}

export function exportReportsToExcel(reports, ln = "th") {
  // ✅ กำหนดหัวตารางตามภาษา
  const headers =
    ln === "en"
      ? ["Date", "User", "Group", "Conversations", "Tokens"]
      : ["วันที่", "ผู้ใช้งาน", "กลุ่ม", "การสนทนา", "Tokens"];

  // ✅ แปลงข้อมูลให้อยู่ในรูปแบบ Array ของ Array
  const rows = reports.map((item) => [
    item.date || "-",
    item.user || "-",
    item.group || "-",
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

  const fileName = ln === "th" ? "สรุปรายงาน.xlsx" : "Report_Summary.xlsx";

  saveAs(blob, fileName);
}

export function exportReportPeriodsToExcel(reports, ln = "th", period) {
  const localeIntl = ln === "en" ? "en-US" : "th-TH";

  // ✅ กำหนดหัวตารางตามภาษา
  const headers =
    ln === "en"
      ? ["Period", "User", "Group", "Conversations", "Tokens"]
      : ["ช่วงเวลา", "ผู้ใช้งาน", "กลุ่ม", "การสนทนา", "Tokens"];

  const formatMonthShortFromDate = (d) => {
    if (!d) return "-";
    const dateObj = d instanceof Date ? d : new Date(d);
    if (isNaN(dateObj.getTime())) return "-";
    return new Intl.DateTimeFormat(localeIntl, { month: "short" }).format(dateObj);
  };

  const formatPeriodCell = (item) => {
    // ✅ รายปี: แสดงชื่อเดือนแบบในตาราง (month short)
    if (period?.mode === "yearly") {
      // backend ของคุณมี period_start อยู่แล้ว (ตามที่ใช้ในตาราง)
      return formatMonthShortFromDate(item.period_start || item.period || "-");
    }

    // ค่าเดิม (monthly/daily ใช้ item.period เป็นหลัก)
    return item.period || "-";
  };

  // ✅ แปลงข้อมูลให้อยู่ในรูปแบบ Array ของ Array
  const rows = reports.map((item) => [
    formatPeriodCell(item),
    item.user || "-",
    item.group || "-",
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
    { wch: 18 }, // ช่วงเวลา
    { wch: 25 }, // ผู้ใช้งาน
    { wch: 25 }, // กลุ่ม
    { wch: 15 }, // การสนทนา
    { wch: 15 }, // Tokens
  ];

  // ✅ สร้างชื่อไฟล์ตาม period
  const safe = (s) => String(s || "").replace(/[\\/:*?"<>|]/g, "-");

  let suffix = ln === "en" ? "All" : "ทั้งหมด";

  if (period?.mode === "daily") {
    const d =
      period.date?.format?.("YYYY-MM-DD") ||
      (typeof period.date === "string" ? period.date : "");
    suffix = ln === "en" ? `Daily_${d || "Date"}` : `รายวัน_${d || "วันที่"}`;
  } else if (period?.mode === "monthly") {
    const y = period.year ?? "";
    const m = Number(period.month ?? 0);

    // ✅ ชื่อเดือน + ปี (ตามภาษา)
    const monthName =
      y && m
        ? new Intl.DateTimeFormat(localeIntl, { month: "long" }).format(
            new Date(Number(y), m - 1, 1)
          )
        : ln === "en"
        ? "Month"
        : "เดือน";

    suffix =
      ln === "en"
        ? `Monthly_${safe(monthName)}_${y || ""}`
        : `รายเดือน_${safe(monthName)}_${y || ""}`;
  } else if (period?.mode === "yearly") {
    const y = period.year ?? "";
    suffix = ln === "en" ? `Yearly_${y}` : `รายปี_${y}`;
  }

  const fileName =
    ln === "th"
      ? `สรุปรายงาน_${safe(suffix)}.xlsx`
      : `Report_Summary_${safe(suffix)}.xlsx`;

  // ✅ เขียนและบันทึกไฟล์
  const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
  const blob = new Blob([excelBuffer], { type: "application/octet-stream" });
  saveAs(blob, fileName);
}
