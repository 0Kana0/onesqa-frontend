// utils/errorAlert.js
import Swal from "sweetalert2";

// ดึงข้อความ error จาก Apollo / GraphQL / ทั่วไป
export function extractErrorMessage(error, fallbackMessage) {
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
// ✅ รองรับ i18n โดยส่ง `t` (จาก useTranslations("ErrorAlert")) เข้ามาใน options
export function showErrorAlert(error, theme = "light", options = {}) {
  const t = options.t; // function จาก next-intl (เช่น useTranslations("ErrorAlert"))

  const fallbackMessage =
    options.fallbackMessage ?? (t ? t("fallbackMessage") : "An error has occurred.");

  const title = options.title ?? (t ? t("title") : "An Error Has Occurred");

  const confirmButtonText =
    options.confirmButtonText ?? (t ? t("confirm") : "OK");

  const message = extractErrorMessage(error, fallbackMessage);

  const commonConfig = {
    icon: options.icon || "error",
    title,
    text: message,
    confirmButtonText,
  };

  if (theme === "dark") {
    return Swal.fire({
      ...commonConfig,
      background: "#2F2F30",
      color: "#fff",
    });
  }

  return Swal.fire(commonConfig);
}
