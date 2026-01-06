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
import { LanguageProvider, useLanguage } from "./context/LanguageContext";
import { SidebarProvider } from "./context/SidebarContext";
import { InitTextProvider } from "./context/InitTextContext";

import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

function IntlWrapper({ children }) {
  const { locale } = useLanguage();
  const messages = locale === "th" ? thMessages : enMessages;
  return (
    <NextIntlClientProvider
      locale={locale}
      timeZone="Asia/Bangkok" // 👈 ใส่ตรงนี้
      messages={messages}
    >
      {children}
    </NextIntlClientProvider>
  );
}

export default function Providers({ children }) {
  return (
    <LanguageProvider>
      <NextThemesProvider
        attribute="class"
        defaultTheme="light"
        value={{ light: "light", dark: "dark" }}
        enableSystem={false}
      >
        <MuiThemeProvider>
          <IntlWrapper>
            <ApolloProvider client={client}>
              <AuthProvider>
                <SidebarProvider>
                  <InitTextProvider>
                    {children}
                    {/* ✅ ToastContainer อยู่ข้างนอกทั้งหมด */}
                    <ToastContainer newestOnTop />
                  </InitTextProvider>
                </SidebarProvider>
              </AuthProvider>
            </ApolloProvider>
          </IntlWrapper>
        </MuiThemeProvider>
      </NextThemesProvider>
    </LanguageProvider>
  );
}
