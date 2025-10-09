"use client";

import { ApolloProvider } from "@apollo/client/react";
import { client } from "@/lib/apolloClient";
import { ThemeProvider as NextThemesProvider } from "next-themes";
import MuiThemeProvider from "./MuiThemeProvider";
import { AuthProvider } from "./context/AuthContext";

export default function Providers({ children }) {
  return (
    <ApolloProvider client={client}>
      <AuthProvider>
        <NextThemesProvider
          attribute="class"
          defaultTheme="light"
          value={{ light: "light", dark: "dark" }}
          enableSystem={false}
        >
          <MuiThemeProvider>{children}</MuiThemeProvider>
        </NextThemesProvider>
      </AuthProvider>
    </ApolloProvider>
  )
}
