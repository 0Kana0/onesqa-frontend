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

function IntlWrapper({ children }) {
  const { locale } = useLanguage();
  const messages = locale === "th" ? thMessages : enMessages;
  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      {children}
    </NextIntlClientProvider>
  );
}

export default function Providers({ children }) {
  return (
    <ApolloProvider client={client}>
      <AuthProvider>
        <LanguageProvider>
          <NextThemesProvider
            attribute="class"
            defaultTheme="light"
            value={{ light: "light", dark: "dark" }}
            enableSystem={false}
          >
            <MuiThemeProvider>
              <IntlWrapper>{children}</IntlWrapper>
            </MuiThemeProvider>
          </NextThemesProvider>
        </LanguageProvider>
      </AuthProvider>
    </ApolloProvider>
  );
}
