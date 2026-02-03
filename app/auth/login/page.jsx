"use client";

import {
  Box,
  Button,
  Container,
  Paper,
  TextField,
  Typography,
  ToggleButton,
  ToggleButtonGroup,
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  Link,
  useMediaQuery
} from "@mui/material";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "@apollo/client/react";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "next-themes";
import { useTranslations } from 'next-intl';
import { useLanguage } from "@/app/context/LanguageContext";
import Header from "../../components/layout/Header";
import Footer from "../../components/layout/Footer";
import FullScreenLoading from "../../components/FullScreenLoading";
import { SIGNIN, SIGNIN_WITH_ID, VERIFY_SIGNIN_WITH_ID } from "@/graphql/auth/mutations";
import { useRedirectIfAuthed } from "../../components/ui/useAuthGuard"
import { extractErrorMessage, showErrorAlert } from "@/util/errorAlert"; // ปรับ path ให้ตรงโปรเจกต์จริง
import { showSuccessAlert } from "@/util/loadingModal";
import { getStoredUser } from "@/util/authStorage";

export default function LoginPage() {
  useRedirectIfAuthed()
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const { handleLanguageChange, locale } = useLanguage();
  const { accessTokenContext, userContext } = useAuth();
  const t = useTranslations('LoginPage');
  const tloginerror = useTranslations('LoginError');
  const tError = useTranslations('ErrorAlert');

  const isMobile = useMediaQuery("(max-width:600px)"); // < md คือจอเล็ก

  const [signin] = useMutation(SIGNIN);
  const [signinWithIdennumber] = useMutation(SIGNIN_WITH_ID);
  const [verifySigninWithIdennumber] = useMutation(VERIFY_SIGNIN_WITH_ID);

  const [loading, setLoading] = useState(false);

  const [role, setRole] = useState("staff"); // staff | external
  //const [form, setForm] = useState({ username: "Admin01", password: "admin1234@" });
  //const [form, setForm] = useState({ username: "Minerta", password: "096-896-5242" });
  const [form, setForm] = useState({ username: "", password: "" });
  //const [citizenId, setCitizenId] = useState("6-3758-67232-20-1");
  const [citizenId, setCitizenId] = useState("");
  const [channel, setChannel] = useState("sms"); // sms | email
  const [showOTP, setShowOTP] = useState(false);
  const [otp, setOtp] = useState("");
  const [loginError, setLoginError] = useState("");

  const [lockRemaining, setLockRemaining] = useState(null); // วินาทีที่เหลือ

  const formatTime = (totalSeconds) => {
    const m = Math.floor(totalSeconds / 60);
    const s = totalSeconds % 60;
    const mm = String(m).padStart(2, "0");
    const ss = String(s).padStart(2, "0");

    return locale === "th" ? `${mm}:${ss} นาที` : `${mm}:${ss} minutes`;
  };

  const mapTheme = (value) => {
    const v = String(value ?? "").toUpperCase();
    if (v === "DARK") return "dark";
    if (v === "LIGHT") return "light";
    return value; // หรือ return null / "light" ตามที่ต้องการ
  };

  const [method, setMethod] = useState("");

  // useEffect สำหรับ countdown
  useEffect(() => {
    if (lockRemaining === null) return;

    const timer = setInterval(() => {
      setLockRemaining((prev) => {
        if (prev === null) return null;

        if (prev <= 1) {
          // หมดเวลาแล้ว
          clearInterval(timer);
          setLoginError("");      // เคลียร์ข้อความ error
          return null;            // หยุด countdown
        }

        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [lockRemaining]);

  useEffect(() => {
    sessionStorage.removeItem("__logout_in_progress__");
  }, []);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // format citizen ID
  const formatCitizenId = (value) => {
    const digits = value.replace(/\D/g, "");
    let result = "";
    if (digits.length > 0) result += digits.substring(0, 1);
    if (digits.length > 1) result += "-" + digits.substring(1, 5);
    if (digits.length > 5) result += "-" + digits.substring(5, 10);
    if (digits.length > 10) result += "-" + digits.substring(10, 12);
    if (digits.length > 12) result += "-" + digits.substring(12, 13);
    return result;
  };

  const handleCitizenChange = (e) => {
    setCitizenId(formatCitizenId(e.target.value));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (role === "staff") {
      const storedUser = getStoredUser();
      if (storedUser) {
        window.location.replace("/onesqa/dashboard")
        return;
      }

      console.log("Login data:", { role, form, citizenId, channel });

      try {
        // Step 1: Login
        const loginResult = await signin({
          variables: {
            input: {
              username: form.username,
              password: form.password,
              locale
            }
          },
        });

        console.log(loginResult?.data?.signin?.user);
        console.log(loginResult?.data?.signin?.token);

        // Step 2: บันทึก token
        accessTokenContext(loginResult?.data?.signin?.token || null);
        userContext(loginResult?.data?.signin?.user);
        handleLanguageChange(loginResult?.data?.signin?.user?.locale || "th");
        setTheme(mapTheme(loginResult?.data?.signin?.user?.color_mode) || "light");
        if (loginResult?.data?.signin?.user?.alert === true) {
          localStorage.setItem("alert", loginResult?.data?.signin?.user?.alert);
        } else {
          localStorage.removeItem("alert");
        }

        setLoading(true); // ✅ เปิด loading ทันที

        // Step 4: Redirect
        if (
          loginResult?.data?.signin?.user?.role_name_th === "ผู้ดูแลระบบ" || 
          loginResult?.data?.signin?.user?.role_name_th === "superadmin"
        ) {
          router.replace("/onesqa/dashboard");
          router.refresh();
        } else {
          router.replace("/onesqa/chat");
          router.refresh();
        }
      } catch (error) {
        // 👉 ดึงข้อความ error มาเก็บใน state
        const message = extractErrorMessage(error, "บันทึกข้อมูลไม่สำเร็จ");
        // แสดง error เฉพาะกรณีที่ข้อความไม่ใช่ 2 ข้อความนี้
        if (
          message !== "ชื่อผู้ใช้งานห้ามเป็นค่าว่าง" && message !== "Username must not be empty" && 
          message !== "รหัสผ่านห้ามเป็นค่าว่าง" && message !== "Password must not be empty" 
        ) {
          setLoginError(message);
        }

        // ถ้าเป็นข้อความล็อก ให้ดึง mm:ss มาแล้วเริ่ม countdown
        if (message.includes("บัญชีนี้ถูกล็อกชั่วคราว") || message.includes("This account is temporarily locked.")) {
          // match mm:ss ตรงไหนก็ได้ในข้อความ
          const match = message.match(/(\d{1,2}):(\d{2})/);
          if (match) {
            const mm = parseInt(match[1], 10);
            const ss = parseInt(match[2], 10);
            const totalSeconds = mm * 60 + ss;
            console.log("⏱ ตั้ง lockRemaining =", totalSeconds);
            setLockRemaining(totalSeconds);
          }
        } else {
          setLockRemaining(null)
        }

        showErrorAlert(error, theme, {
          title: tloginerror('error1'),
          t: tError
        });
      }

    } else if (role === "external") {
      const storedUser = getStoredUser();
      if (storedUser) {
        window.location.replace("/onesqa/dashboard")
        return;
      }

      console.log("Login data:", { role, form, citizenId, channel });

      // ✅ เก็บเฉพาะตัวเลข
      const onlyDigits = citizenId.replace(/\D/g, "");
      console.log("🔄 ส่งเลขปปช", onlyDigits);

      try {
        // Step 1: Login
        const sendResult = await signinWithIdennumber({
          variables: {
            input: {
              idennumber: onlyDigits,
              otp_type: channel,
              locale
            }
          },
        });

        console.log(sendResult);
      
        // แสดงช่องกรอก OTP
        setShowOTP(true);
        setMethod(sendResult.data.signinWithIdennumber.method)
        setLoginError("")
      } catch (error) {
        // 👉 ดึงข้อความ error มาเก็บใน state
        const message = extractErrorMessage(error, "บันทึกข้อมูลไม่สำเร็จ");
        // แสดง error เฉพาะกรณีที่ข้อความไม่ใช่ 2 ข้อความนี้
        if (
          message !== "เลขบัตรประชาชนห้ามเป็นค่าว่าง" && message !== "National ID number must not be empty" &&
          message !== "otp_type ห้ามเป็นค่าว่าง" && message !== "otp_type must not be empty" &&
          message !== "เลขบัตรประชาชนต้องมี 13 หลัก" && message !== "National ID number must be 13 digits" &&
          message !== "ไม่พบเบอร์โทรศัพท์สำหรับส่ง OTP" && message !== "Phone number for sending OTP was not found" &&
          message !== "ส่ง OTP ไม่สำเร็จ" && message !== "Failed to send OTP" &&
          message !== "ไม่พบอีเมลสำหรับส่ง OTP" && message !== "Email address for sending OTP was not found" &&
          message !== "otp_type ไม่ถูกต้อง" && message !== "Invalid otp_type" 
        ) {
          setLoginError(message);
        }

        // ถ้าเป็นข้อความล็อก ให้ดึง mm:ss มาแล้วเริ่ม countdown
        if (message.includes("บัญชีนี้ถูกล็อกชั่วคราว") || message.includes("This account is temporarily locked.")) {
          // match mm:ss ตรงไหนก็ได้ในข้อความ
          const match = message.match(/(\d{1,2}):(\d{2})/);
          if (match) {
            const mm = parseInt(match[1], 10);
            const ss = parseInt(match[2], 10);
            const totalSeconds = mm * 60 + ss;
            console.log("⏱ ตั้ง lockRemaining =", totalSeconds);
            setLockRemaining(totalSeconds);
          }
        } else {
          setLockRemaining(null)
        }

        showErrorAlert(error, theme, {
          title: tloginerror('error2'),
          t: tError
        });
      }
    }
  };

  const handleResendOtp = async (e) => {
    e.preventDefault();

    const storedUser = getStoredUser();
    if (storedUser) {
      window.location.replace("/onesqa/dashboard")
      return;
    }

    // ✅ เก็บเฉพาะตัวเลข
    const onlyDigits = citizenId.replace(/\D/g, "");

    console.log("🔄 ส่ง OTP ใหม่", onlyDigits);

    // TODO: call API ส่ง OTP ใหม่ พร้อมส่ง onlyDigits ไป
    // api.sendOtp({ citizenId: onlyDigits })
    try {
      // Step 1: Login
      const resendResult = await signinWithIdennumber({
        variables: {
          input: {
            idennumber: onlyDigits,
            otp_type: channel,
            locale
          }
        },
      });

      console.log(resendResult);

      await showSuccessAlert({
        title: t("recheck3"),
        text: t("recheck4"),
        theme,
      });
    } catch (error) {
      // 👉 ดึงข้อความ error มาเก็บใน state
      const message = extractErrorMessage(error, "บันทึกข้อมูลไม่สำเร็จ");
      // แสดง error เฉพาะกรณีที่ข้อความไม่ใช่ 2 ข้อความนี้
      if (
        message !== "เลขบัตรประชาชนห้ามเป็นค่าว่าง" && message !== "National ID number must not be empty" &&
        message !== "otp_type ห้ามเป็นค่าว่าง" && message !== "otp_type must not be empty" &&
        message !== "เลขบัตรประชาชนต้องมี 13 หลัก" && message !== "National ID number must be 13 digits" &&
        message !== "ไม่พบเบอร์โทรศัพท์สำหรับส่ง OTP" && message !== "Phone number for sending OTP was not found" &&
        message !== "ส่ง OTP ไม่สำเร็จ" && message !== "Failed to send OTP" &&
        message !== "ไม่พบอีเมลสำหรับส่ง OTP" && message !== "Email address for sending OTP was not found" &&
        message !== "otp_type ไม่ถูกต้อง" && message !== "Invalid otp_type" 
      ) {
        setLoginError(message);
      }

      // ถ้าเป็นข้อความล็อก ให้ดึง mm:ss มาแล้วเริ่ม countdown
      if (message.includes("บัญชีนี้ถูกล็อกชั่วคราว") || message.includes("This account is temporarily locked.")) {
        // match mm:ss ตรงไหนก็ได้ในข้อความ
        const match = message.match(/(\d{1,2}):(\d{2})/);
        if (match) {
          const mm = parseInt(match[1], 10);
          const ss = parseInt(match[2], 10);
          const totalSeconds = mm * 60 + ss;
          console.log("⏱ ตั้ง lockRemaining =", totalSeconds);
          setLockRemaining(totalSeconds);
        }
      } else {
        setLockRemaining(null)
      }
      
      showErrorAlert(error, theme, {
        title: tloginerror('error2'),
        t: tError
      });
    }
  };

  const handleOtpSubmit = async (e) => {
    e.preventDefault();

    const storedUser = getStoredUser();
    if (storedUser) {
      window.location.replace("/onesqa/dashboard")
      return;
    }
    
    // ✅ เก็บเฉพาะตัวเลข
    const onlyDigits = citizenId.replace(/\D/g, "");
    console.log("🔄 ตรวจสอบบัตรปปช", onlyDigits);
    console.log("ตรวจสอบ OTP:", otp);
    // TODO: เรียก API ตรวจสอบ OTP ที่นี่

    try {
      // Step 1: Login
      const loginResult = await verifySigninWithIdennumber({
        variables: {
          input: {
            idennumber: onlyDigits,
            otp: otp,
            locale
          }
        },
      });

      console.log(loginResult?.data?.verifySigninWithIdennumber?.user);
      console.log(loginResult?.data?.verifySigninWithIdennumber?.token);

      // Step 2: บันทึก token
      accessTokenContext(loginResult?.data?.verifySigninWithIdennumber?.token || null);
      userContext(loginResult?.data?.verifySigninWithIdennumber?.user);
      handleLanguageChange(loginResult?.data?.verifySigninWithIdennumber?.user?.locale || "th");
      setTheme(mapTheme(loginResult?.data?.verifySigninWithIdennumber?.user?.color_mode) || "light");
      if (loginResult?.data?.verifySigninWithIdennumber?.user?.alert === true) {
        localStorage.setItem("alert", loginResult?.data?.verifySigninWithIdennumber?.user?.alert);
      } else {
        localStorage.removeItem("alert");
      }

      setLoading(true); // ✅ เปิด loading ทันที

      // Step 4: Redirect
      if (
        loginResult?.data?.verifySigninWithIdennumber?.user?.role_name_th === "ผู้ดูแลระบบ" || 
        loginResult?.data?.verifySigninWithIdennumber?.user?.role_name_th === "superadmin"
      ) {
        router.replace("/onesqa/dashboard");
        router.refresh();
      } else {
        router.replace("/onesqa/chat");
        router.refresh();
      }
    } catch (error) {
      // 👉 ดึงข้อความ error มาเก็บใน state
      const message = extractErrorMessage(error, "บันทึกข้อมูลไม่สำเร็จ");
      // แสดง error เฉพาะกรณีที่ข้อความไม่ใช่ 2 ข้อความนี้
      if (
        message !== "เลขบัตรประชาชนห้ามเป็นค่าว่าง" && message !== "National ID number must not be empty" &&
        message !== "เลขบัตรประชาชนต้องมี 13 หลัก" && message !== "National ID number must be 13 digits" &&
        message !== "เลข OTP ห้ามเป็นค่าว่าง" && message !== "OTP must not be empty"
      ) {
        setLoginError(message);
      }

      // ถ้าเป็นข้อความล็อก ให้ดึง mm:ss มาแล้วเริ่ม countdown
      if (message.includes("บัญชีนี้ถูกล็อกชั่วคราว") || message.includes("This account is temporarily locked.")) {
        // match mm:ss ตรงไหนก็ได้ในข้อความ
        const match = message.match(/(\d{1,2}):(\d{2})/);
        if (match) {
          const mm = parseInt(match[1], 10);
          const ss = parseInt(match[2], 10);
          const totalSeconds = mm * 60 + ss;
          console.log("⏱ ตั้ง lockRemaining =", totalSeconds);
          setLockRemaining(totalSeconds);
        }
      } else {
        setLockRemaining(null)
      }

      showErrorAlert(error, theme, {
        title: tloginerror('error1'),
        t: tError
      });
    }
  };

  return (
    <>
      {loading && <FullScreenLoading text={t('loading')} />}

      <Box
        sx={{
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          bgcolor: "transparent",
          background: (theme) =>
            `linear-gradient(to bottom, ${theme.palette.primary.main} 50%, ${theme.palette.background.default} 50%)`,
        }}
      >
        {/* Header */}
        <Header />

        {/* Title Section */}
        <Box
          sx={{
            height: isMobile ? "160px" : "220px",
            display: "flex",
            alignItems: "center",
            //justifyContent: isMobile ? "center" : "flex-start",
            px: isMobile ? 4 : 10,
          }}
        >
          <Box sx={{ color: "white"}}>
            <Typography variant="h5" fontWeight="bold">
              {t('title1')}
            </Typography>
            <Typography variant="body1">
              {t('title2')}
            </Typography>
          </Box>
        </Box>

        <Container
          maxWidth="sm"
          sx={{
            flex: 1, // ดัน footer ลงไปล่าง
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            mb: 5,
          }}
        >
          <Box
            elevation={3}
            sx={{ p: 4, width: "100%", textAlign: "center", borderRadius: 5, bgcolor: "background.paper", }}
          >
            {/* เลือก role */}
            <ToggleButtonGroup
              value={role}
              exclusive
              onChange={(e, newRole) => {
                if (!newRole) return;

                setRole(newRole);
                setLoginError("");
                setLockRemaining(null);
                setOtp("");
              }}
              fullWidth
              sx={{
                mb: 3,
              }}
            >
              <ToggleButton
                value="staff"
                sx={{
                  flex: 1,
                  border: "none",
                  borderRadius: 0,
                  fontSize: "1.2rem", // ✅ ขนาดใหญ่ขึ้น
                  fontWeight: 600, // ✅ หนาขึ้น
                  color: role === "staff" ? "#3E8EF7" : "background.text",
                  position: "relative",
                  "&::after": {
                    content: '""',
                    position: "absolute",
                    left: 0,
                    bottom: 0,
                    width: role === "staff" ? "100%" : "0%",
                    height: "2px",
                    bgcolor: "primary.main",
                    transition: "width 0.3s ease-in-out", // ✅ animation
                  },
                  "&.Mui-selected": {
                    bgcolor: "background.paper",
                    color: "#3E8EF7",
                  },
                  "&:hover": {
                    bgcolor: "background.paper",
                  },
                }}
              >
                {t('role1')}
              </ToggleButton>

              <ToggleButton
                value="external"
                sx={{
                  flex: 1,
                  border: "none",
                  borderRadius: 0,
                  fontSize: "1.2rem", // ✅ ขนาดใหญ่ขึ้น
                  fontWeight: 600, // ✅ หนาขึ้น
                  color: role === "external" ? "#3E8EF7" : "background.text",
                  position: "relative",
                  "&::after": {
                    content: '""',
                    position: "absolute",
                    left: 0,
                    bottom: 0,
                    width: role === "external" ? "100%" : "0%",
                    height: "2px",
                    bgcolor: "primary.main",
                    transition: "width 0.3s ease-in-out", // ✅ animation
                  },
                  "&.Mui-selected": {
                    bgcolor: "background.paper",
                    color: "#3E8EF7",
                  },
                  "&:hover": {
                    bgcolor: "background.paper",
                  },
                }}
              >
                {t('role2')}
              </ToggleButton>
            </ToggleButtonGroup>

            {/* ฟอร์มสลับตาม role */}
            {role === "staff" && (
              <Box component="form" onSubmit={handleSubmit}>
                {/* แสดง error บนสุด */}
                {loginError && (
                  <Typography
                    variant="body2"
                    color="error"
                    sx={{ mt: 1, mb: 1 }}
                  >
                    {
                      lockRemaining !== null
                        ? locale === "th"
                          ? `บัญชีนี้ถูกล็อกชั่วคราว กรุณารอสักครู่เพื่อเข้าสู่ระบบอีกครั้ง ${formatTime(lockRemaining)}`
                          : `This account is temporarily locked. Please wait and try logging in again in ${formatTime(lockRemaining)}`
                        : loginError
                    }
                  </Typography>
                )}
                
                <TextField
                  fullWidth
                  margin="normal"
                  label={t('label1')}
                  placeholder={t('placeholder1')}
                  name="username"
                  value={form.username}
                  onChange={handleChange}
                />
                <TextField
                  fullWidth
                  margin="normal"
                  type="password"
                  label={t('label2')}
                  placeholder={t('placeholder2')}
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                />

                <Button
                  type="submit"
                  variant="contained"
                  fullWidth
                  sx={{ mt: 2, bgcolor: "#3E8EF7" }}
                >
                  {t('button1')}
                </Button>
              </Box>
            )}

            {role === "external" && (
              <Box component="form" onSubmit={handleSubmit}>
                {/* แสดง error บนสุด */}
                {loginError && (
                  <Typography
                    variant="body2"
                    color="error"
                    sx={{ mt: 1, mb: 1 }}
                  >
                    {
                      lockRemaining !== null
                        ? locale === "th"
                          ? `บัญชีนี้ถูกล็อกชั่วคราว กรุณารอสักครู่เพื่อเข้าสู่ระบบอีกครั้ง ${formatTime(lockRemaining)}`
                          : `This account is temporarily locked. Please wait and try logging in again in ${formatTime(lockRemaining)}`
                        : loginError
                    }
                  </Typography>
                )}

                <TextField
                  fullWidth
                  margin="normal"
                  label={t("label3")}
                  placeholder="0-0000-00000-00-0"
                  value={citizenId}
                  onChange={handleCitizenChange}
                  inputProps={{
                    maxLength: 17,
                    readOnly: showOTP,
                  }}
                />

                <Typography
                  variant="body2"
                  align="left"
                  sx={{ mt: 2, mb: 1, fontWeight: "500" }}
                >
                  {t('title3')}
                </Typography>
                <FormControl
                  component="fieldset"
                  sx={{
                    width: "100%",
                    mb: 3,
                  }}
                >
                  <RadioGroup
                    row
                    value={channel}
                    onChange={(e) => {
                      const nextChannel = e.target.value;

                      // ถ้าเปลี่ยนช่องทางให้ซ่อน OTP ก่อน
                      if (nextChannel !== channel) {
                        setShowOTP(false);
                        setOtp("")
                      }

                      setChannel(nextChannel);
                    }}                  
                    sx={{
                      display: "flex",
                      justifyContent: "center", // ✅ จัดทั้งกลุ่มให้อยู่กลาง
                      width: "100%",
                      gap: 2,
                    }}
                  >
                    <FormControlLabel
                      value="sms"
                      control={<Radio />}
                      label="SMS"
                      sx={{
                        flex: 1, // ✅ กินครึ่ง
                        border: "1px solid #3E8EF7",
                        borderRadius: 2,
                        px: 2,
                        py: 1,
                        m: 0, // เอา margin default ของ MUI ออก
                      }}
                    />
                    <FormControlLabel
                      value="email"
                      control={<Radio />}
                      label="Email"
                      sx={{
                        flex: 1, // ✅ กินครึ่ง
                        border: "1px solid #3E8EF7",
                        borderRadius: 2,
                        px: 2,
                        py: 1,
                        m: 0,
                      }}
                    />
                  </RadioGroup>
                </FormControl>

                {!showOTP ? (
                  <Button
                    type="submit"
                    variant="contained"
                    fullWidth
                    sx={{ mt: 2, bgcolor: "#3E8EF7" }}
                  >
                    {t('button2')}
                  </Button>
                ) : (
                  <Box sx={{ mt: 1 }}>
                    <Typography
                      variant="body2"
                      align="left"
                      sx={{ fontWeight: 500 }}
                    >
                      {t(channel === "sms" ? "title4p1phone" : "title4p1email")} {method} {t("title4p2")}
                    </Typography>

                    <TextField
                      fullWidth
                      margin="normal"
                      label={t("otp1")}
                      placeholder={t("otp2")}
                      value={otp}
                      sx={{ mb: 2 }}
                      onChange={(e) => {
                        const value = e.target.value.replace(/\D/g, "");
                        setOtp(value);
                      }}
                      inputProps={{ maxLength: 6, inputMode: "numeric" }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();       // ❌ กันไม่ให้ form ข้างนอก submit เอง
                          handleOtpSubmit(e);       // ✅ ทำงานเหมือนกดปุ่ม
                        }
                      }}
                    />

                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 0.5, // ระยะห่างระหว่างข้อความกับลิงก์
                      }}
                    >
                      <Typography
                        variant="body2"
                        sx={{ fontWeight: 500 }}
                      >
                        {t("recheck1")}
                        <Link
                          component="button"
                          variant="body2"
                          underline="none"
                          sx={{
                            color: "#3E8EF7",
                            cursor: "pointer",
                            fontWeight: 500
                          }}
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleResendOtp(e);
                          }}
                        >
                          {t("recheck2")}
                        </Link>
                      </Typography>
                    </Box>

                    <Button
                      type="button"                  // ❗ ไม่ใช้ submit เพื่อไม่ไปชน form ใหญ่
                      variant="contained"
                      fullWidth
                      onClick={(e) => handleOtpSubmit(e)}
                      sx={{ mt: 2, bgcolor: "#3E8EF7" }}
                    >
                      {t("button1")}
                    </Button>
                  </Box>
                )}
              </Box>
            )}
          </Box>
        </Container>

        {/* Footer */}
        <Footer />
      </Box>
    </>
  );
}
