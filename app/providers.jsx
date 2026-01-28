"use client";

import { useState, useEffect } from "react";
import { ApolloProvider } from "@apollo/client/react";
import { client } from "@/lib/apolloClient";
import { ThemeProvider as NextThemesProvider, useTheme } from "next-themes";
import MuiThemeProvider from "./MuiThemeProvider";
import { AuthProvider } from "./context/AuthContext";
import { NextIntlClientProvider } from "next-intl";
import enMessages from "../messages/en.json";
import thMessages from "../messages/th.json";
import { LanguageProvider, useLanguage } from "./context/LanguageContext";
import { SidebarProvider } from "./context/SidebarContext";
import { InitTextProvider } from "./context/InitTextContext";

import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import AuthRedirectLoadingProvider from "./AuthRedirectLoadingProvider";

function IntlWrapper({ children }) {
  const { locale } = useLanguage();
  const messages = locale === "th" ? thMessages : enMessages;

  return (
    <NextIntlClientProvider locale={locale} timeZone="Asia/Bangkok" messages={messages}>
      {children}
    </NextIntlClientProvider>
  );
}

function ToastContainerWithTheme() {
  const { theme } = useTheme();
  return (
    <ToastContainer
      theme={theme === "dark" ? "dark" : "light"}
      newestOnTop
    />
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
            <AuthRedirectLoadingProvider>
              <ApolloProvider client={client}>
                <AuthProvider>
                  <SidebarProvider>
                    <InitTextProvider>
                      {children}
                      {/* ✅ อยู่ใน NextThemesProvider แล้ว เลยเปลี่ยนตามธีมได้ */}
                      <ToastContainerWithTheme />
                    </InitTextProvider>
                  </SidebarProvider>
                </AuthProvider>
              </ApolloProvider>
            </AuthRedirectLoadingProvider>
          </IntlWrapper>
        </MuiThemeProvider>
      </NextThemesProvider>
    </LanguageProvider>
  );
}
