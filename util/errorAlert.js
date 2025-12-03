// utils/errorAlert.js
import Swal from "sweetalert2";

// ดึงข้อความ error จาก Apollo / GraphQL / ทั่วไป
export function extractErrorMessage(error, fallbackMessage = "เกิดข้อผิดพลาด ไม่สามารถทำรายการได้") {
  if (!error) return fallbackMessage;

  const err = error;

  // 1) Apollo graphQLErrors
  if (Array.isArray(err?.graphQLErrors) && err.graphQLErrors.length) {
    return err.graphQLErrors.map((e) => e.message).join("\n");
  }

  // 2) networkError ของ Apollo (บางเคส error จะอยู่ใน result)
  if (err?.networkError) {
    const ne = err.networkError;

    if (Array.isArray(ne?.result?.errors) && ne.result.errors.length) {
      return ne.result.errors.map((e) => e.message).join("\n");
    }

    if (typeof ne.message === "string" && ne.message) {
      return ne.message;
    }
  }

  // 3) message ปกติ
  if (typeof err?.message === "string" && err.message) {
    // ตัด prefix "CombinedGraphQLErrors:" ออกถ้ามี
    return err.message.replace(/^CombinedGraphQLErrors:\s*/i, "");
  }

  // 4) error เป็น string ตรง ๆ
  if (typeof err === "string") {
    return err;
  }

  return fallbackMessage;
}

// แสดง SweetAlert2 สำหรับ error (ใช้ซ้ำได้ทุกหน้า)
export function showErrorAlert(error, theme = "light", options = {}) {
  const message = extractErrorMessage(
    error,
    options.fallbackMessage || "เกิดข้อผิดพลาด ไม่สามารถทำรายการได้"
  );
  // console.log("message", message);

  if (theme === "dark") {
    return Swal.fire({
      icon: options.icon || "error",
      title: options.title || "เกิดข้อผิดพลาด",
      text: message,
      confirmButtonText: "ตกลง",
      background: "#2F2F30", // สีพื้นหลังดำ
      color: "#fff", // สีข้อความเป็นขาว
      titleColor: "#fff", // สี title เป็นขาว
      textColor: "#fff", // สี text เป็นขาว
    });
  } else {
    return Swal.fire({
      icon: options.icon || "error",
      title: options.title || "เกิดข้อผิดพลาด",
      text: message,
      confirmButtonText: "ตกลง",
    });
  }
}
