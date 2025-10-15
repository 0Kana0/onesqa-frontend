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

export function exportUsersToExcel(logs, ln = "th") {

}
