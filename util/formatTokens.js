/**
 * แปลงตัวเลข token ให้อยู่ในรูปแบบอ่านง่าย
 * เช่น 2,000,000,000 → 2000 M (บนมือถือ)
 * หรือ → 2,000,000,000 (บน Desktop)
 *
 * @param {number} value - จำนวน token
 * @param {boolean} isMobile - ถ้าเป็น true จะย่อหน่วย (K, M, B)
 * @param {boolean} always - ถ้าเป็น true จะย่อหน่วยเสมอไม่สนว่าเป็น mobile หรือไม่
 * @returns {string} - ข้อความที่ format แล้ว
 */
export function formatTokens(value, isMobile = false, always = false) {
  if (value == null || isNaN(value)) return "0";

  // ✅ ถ้าไม่ได้อยู่ใน mobile และไม่ได้บังคับย่อหน่วย ให้แสดงเต็ม
  if (!isMobile && !always) {
    return value.toLocaleString();
  }

  // ✅ แปลงหน่วย (ใช้ทั้งตอน mobile หรือ always = true)
  if (value >= 1_000_000_000) return `${(value / 1_000_000).toFixed(0)} M`; // 2,000,000,000 → 2000 M
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)} M`; // 5,500,000 → 5.5 M
  if (value >= 1_000) return `${(value / 1_000).toFixed(0)} K`; // 2,000 → 2 K

  return value.toString();
}
