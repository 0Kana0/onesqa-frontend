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
  Link
} from "@mui/material";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "@apollo/client/react";
import { useAuth } from "../../context/AuthContext";
import { useTranslations } from 'next-intl';
import Header from "../../components/layout/Header";
import Footer from "../../components/layout/Footer";
import { SIGNIN, SIGNIN_WITH_ID, VERIFY_SIGNIN_WITH_ID } from "@/graphql/auth/mutations";
import { useRedirectIfAuthed } from "../../components/ui/useAuthGuard"

export default function LoginPage() {
  useRedirectIfAuthed()
  const router = useRouter();
  const { accessTokenContext, userContext } = useAuth();
  const t = useTranslations('LoginPage');

  const [signin] = useMutation(SIGNIN);
  const [signinWithIdennumber] = useMutation(SIGNIN_WITH_ID);
  const [verifySigninWithIdennumber] = useMutation(VERIFY_SIGNIN_WITH_ID);

  const [role, setRole] = useState("staff"); // staff | external
  const [form, setForm] = useState({ username: "Minerta", password: "096-896-5242" });
  //const [form, setForm] = useState({ username: "", password: "" });
  const [citizenId, setCitizenId] = useState("6-3758-67232-20-1");
  const [channel, setChannel] = useState("sms"); // sms | email
  const [showOTP, setShowOTP] = useState(false);
  const [otp, setOtp] = useState("");

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
      console.log("Login data:", { role, form, citizenId, channel });

      try {
        // Step 1: Login
        const loginResult = await signin({
          variables: {
            input: {
              username: form.username,
              password: form.password
            }
          },
        });

        console.log(loginResult?.data?.signin?.user);
        console.log(loginResult?.data?.signin?.token);

        // Step 2: บันทึก token
        accessTokenContext(loginResult?.data?.signin?.token || null);
        userContext(loginResult?.data?.signin?.user, "th");


        // Step 4: Redirect
        router.push("/onesqa/dashboard");
      } catch (error) {
        console.log(error);
      }

    } else if (role === "external") {
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
              otp_type: channel
            }
          },
        });

        console.log(sendResult);
      
        // แสดงช่องกรอก OTP
        setShowOTP(true);
      } catch (error) {
        console.log(error);
      }
    }
  };

  const handleResendOtp = async (e) => {
    e.preventDefault();

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
            otp_type: channel
          }
        },
      });

      console.log(resendResult);
    } catch (error) {
      console.log(error);
    }
  };

  const handleOtpSubmit = async (e) => {
    e.preventDefault();
    
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
            otp: otp
          }
        },
      });

      console.log(loginResult?.data?.verifySigninWithIdennumber?.user);
      console.log(loginResult?.data?.verifySigninWithIdennumber?.token);

      // Step 2: บันทึก token
      accessTokenContext(loginResult?.data?.verifySigninWithIdennumber?.token || null);
      userContext(loginResult?.data?.verifySigninWithIdennumber?.user, "th");

      // Step 4: Redirect
      router.push("/onesqa/dashboard");
    } catch (error) {
      console.log(error);
    }
  };

  return (
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
          width: "100%",
          display: "flex",
          justifyContent: "center", // ✅ ชิดซ้าย
          alignItems: "center",
          //pl: 40, // padding ซ้าย
          pr: 120, // padding ขวา
          pt: 10, // padding บน
          color: "white",
          textAlign: "left",
        }}
      >
        <Box sx={{ textAlign: "left" }}>
          <Typography variant="h5" gutterBottom fontWeight="bold">
            {t('title1')}
          </Typography>
          <Typography variant="subtitle1" gutterBottom>
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
            onChange={(e, newRole) => newRole && setRole(newRole)}
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
              <TextField
                fullWidth
                margin="normal"
                label={t('label3')}
                placeholder="0-0000-00000-00-0"
                value={citizenId}
                onChange={handleCitizenChange}
                inputProps={{ maxLength: 17 }}
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
                  onChange={(e) => setChannel(e.target.value)}
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
                    sx={{ fontWeight: "500" }}
                  >
                    {t('title4p1')} 0629088xxx {t('title4p2')}
                  </Typography>
                  <TextField
                    fullWidth
                    margin="normal"
                    label={t('otp1')}
                    placeholder={t('otp2')}
                    value={otp}
                    sx={{ mb: 2 }}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, ""); // 👈 กรองเอาเฉพาะตัวเลข
                      setOtp(value);
                    }}
                    inputProps={{ maxLength: 6, inputMode: "numeric" }}
                  />
                  <Typography variant="body2" align="left" sx={{ fontWeight: "500" }}>
                    {t('recheck1')}
                    <Link
                      component="button"
                      variant="body2"
                      underline="none"   // ❌ ตัดเส้นขีดใต้
                      sx={{ color: "#3E8EF7", cursor: "pointer" }}
                      onClick={(e) => handleResendOtp(e)}
                    >
                      {t('recheck2')}
                    </Link>
                  </Typography>

                  <Button
                    type="submit"
                    variant="contained"
                    //color="secondary"
                    fullWidth
                    onClick={(e) => handleOtpSubmit(e)}
                    sx={{ mt: 2, bgcolor: "#3E8EF7" }}
                  >
                    {t('button1')}
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
  );
}
