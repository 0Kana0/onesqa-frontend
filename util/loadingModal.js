import Swal from "sweetalert2";

export function showLoading(title = "กำลังดำเนินการ...", theme = "light") {
  if (theme === "dark") {
    return Swal.fire({
      title,
      allowOutsideClick: false,
      allowEscapeKey: false,
      didOpen: () => {
        Swal.showLoading();
      },
      background: "#2F2F30", // สีพื้นหลังดำ
      color: "#fff", // สีข้อความเป็นขาว
      titleColor: "#fff", // สี title เป็นขาว
      textColor: "#fff", // สี text เป็นขาว
  });
  } else {
    return Swal.fire({
      title,
      allowOutsideClick: false,
      allowEscapeKey: false,
      didOpen: () => {
        Swal.showLoading();
      },
    });
  }
}

export function closeLoading() {
  Swal.close();
}

export const showSuccessAlert = async ({
  title = "สำเร็จ",
  text = "ดำเนินการเรียบร้อย",
  timer = 1400,
  theme = "light"
} = {}) => {
  if (theme === "dark") {
    return Swal.fire({
      icon: "success",
      title,
      text,
      timer,
      showConfirmButton: false,
      background: "#2F2F30", // สีพื้นหลังดำ
      color: "#fff", // สีข้อความเป็นขาว
      titleColor: "#fff", // สี title เป็นขาว
      textColor: "#fff", // สี text เป็นขาว
    });
  } else {
    return Swal.fire({
      icon: "success",
      title,
      text,
      timer,
      showConfirmButton: false,
    });
  }
};
