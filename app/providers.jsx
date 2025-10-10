"use client";

import { useState, useEffect } from "react";
import { ApolloProvider } from "@apollo/client/react";
import { client } from "@/lib/apolloClient";
import { ThemeProvider as NextThemesProvider } from "next-themes";
import MuiThemeProvider from "./MuiThemeProvider";
import { AuthProvider } from "./context/AuthContext";
import { NextIntlClientProvider } from "next-intl";
import enMessages from "../messages/en.json"; // ภาษาอังกฤษ
import thMessages from "../messages/th.json"; // ภาษาไทย

export default function Providers({ children }) {
  const [locale, setLocale] = useState(null);

  useEffect(() => {
    // โหลดค่า locale จาก localStorage ถ้ามี
    const savedLocale = localStorage.getItem('locale');
    if (savedLocale) {
      setLocale(savedLocale);
    } else {
      setLocale('th');  // ค่าเริ่มต้นเป็นภาษาไทย
    }
  }, []);

  if (!locale) return null;  // ไม่แสดงจนกว่าจะได้ locale

  // เลือกข้อความจาก locale
  const messages = locale === "th" ? thMessages : enMessages;

  // ฟังก์ชันเปลี่ยนภาษา
  const handleLanguageChange = (newLocale) => {
    setLocale(newLocale);  // เปลี่ยนภาษา
    localStorage.setItem("locale", newLocale);  // เก็บภาษาใน localStorage
  };

  return (
    <ApolloProvider client={client}>
      <AuthProvider>
        <NextIntlClientProvider locale={locale} messages={messages}>
          <NextThemesProvider
            attribute="class"
            defaultTheme="light"
            value={{ light: "light", dark: "dark" }}
            enableSystem={false}
          >
            <MuiThemeProvider>
              {children}

              {/* ปุ่มเปลี่ยนภาษา */}
              <div style={{ position: "fixed", bottom: 20, right: 20 }}>
                <button onClick={() => handleLanguageChange("en")}>English</button>
                <button onClick={() => handleLanguageChange("th")}>ไทย</button>
              </div>
            </MuiThemeProvider>
          </NextThemesProvider>
        </NextIntlClientProvider>
      </AuthProvider>
    </ApolloProvider>
  );
}
