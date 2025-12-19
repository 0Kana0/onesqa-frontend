import Swal from "sweetalert2";

export function showLoading(title = "กำลังดำเนินการ...") {
  Swal.fire({
    title,
    allowOutsideClick: false,
    allowEscapeKey: false,
    didOpen: () => {
      Swal.showLoading();
    },
  });
}

export function closeLoading() {
  Swal.close();
}

export const showSuccessAlert = async ({
  title = "สำเร็จ",
  text = "ดำเนินการเรียบร้อย",
  timer = 1400,
} = {}) => {
  return Swal.fire({
    icon: "success",
    title,
    text,
    timer,
    showConfirmButton: false,
  });
};
