"use client";

import { createContext, useContext, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { setCookie, getCookie, deleteCookie } from "cookies-next";

const AuthContext = createContext();

const initUser = { 
  id: "",
  firstname: "",
  lastname: "",
  ai_access: "",
  color_mode: "",
  email: "",
  login_type: "",
  phone: "",
  position: "",
  group_name: "",
  role_name: "",
  username: "",
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(initUser);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const checkAuth = () => {
      // const userData = getCookie("user");
      const userData = localStorage.getItem("user");

      if (userData) {
        try {
          setUser(JSON.parse(userData));
        } catch (error) {
          console.error("Error parsing user data:", error);
          deleteCookie("user");
        }
      }
      setLoading(false);
    };
    checkAuth();
  }, []);

  const accessTokenContext = (token) => {
    setCookie("accessToken", token, {
      path: "/",
      maxAge: 60 * 15,
      sameSite: "lax",
      // secure: process.env.NODE_ENV === "production",
    });
  };

  const userContext = (userData, locale) => {
    console.log("userData", userData, locale);

    setUser(userData);
    localStorage.setItem("user", JSON.stringify(userData));
    localStorage.setItem("locale", locale);
  };

  const logoutContext = () => {
    setUser(null);
    deleteCookie("accessToken", { path: "/" });
    localStorage.removeItem("user");
    //localStorage.removeItem("locale");
    router.push("/auth/login");
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        accessTokenContext,
        logoutContext,
        userContext,
        loading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
