"use client";

import { useQuery, useMutation } from "@apollo/client/react";
import { USER_ONLINE, USER_OFFLINE } from "@/graphql/userStatus/mutations";
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
  locale: "",
  alert: "",
  is_online: "",
  phone: "",
  position: "",
  group_name: "",
  role_name: "",
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(initUser);
  const [loading, setLoading] = useState(true);

  const [setUserOnline] = useMutation(USER_ONLINE);
  const [setUserOffline] = useMutation(USER_OFFLINE);

  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      // const userData = getCookie("user");
      const userData = localStorage.getItem("user");
      const parseUserData = JSON.parse(userData);

      if (userData) {
        try {
          setUser(parseUserData);

          try {
            // ✅ เรียก mutation ไป backend
            const { data } = await setUserOnline({
              variables: {
                user_id: parseUserData.id, // ต้องตรงกับ schema
              },
            });

            console.log("✅ Update success:", data.setUserOnline);
          } catch (error) {
            console.log(error);
          }

          // // ❌ แจ้งว่าออฟไลน์เมื่อปิดแท็บหรือออก
          // const handleBeforeUnload = () => {
          //   setUserOffline({ variables: { user_id: parseUserData.id } });
          // };

          // window.addEventListener("beforeunload", handleBeforeUnload);
          // return () => {
          //   window.removeEventListener("beforeunload", handleBeforeUnload);
          //   handleBeforeUnload();
          // };
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

  const userContext = async (userData, locale) => {
    console.log("userData", userData, locale);

    try {
      // ✅ เรียก mutation ไป backend
      console.log("userData.id", userData.id);
      
      const { data } = await setUserOnline({
        variables: {
          user_id: userData.id, // ต้องตรงกับ schema
        },
      });

      console.log("✅ Update success:", data.setUserOnline);
    } catch (error) {
      console.log(error);
    }

    setUser(userData);
    localStorage.setItem("user", JSON.stringify(userData));
    localStorage.setItem("locale", locale);
  };

  const logoutContext = async () => {
    try {
      // ✅ เรียก mutation ไป backend
      const userData = localStorage.getItem("user");
      const parseUserData = JSON.parse(userData);

      const { data } = await setUserOffline({
        variables: {
          user_id: parseUserData.id, // ต้องตรงกับ schema
        },
      });

      console.log("✅ Update success:", data.setUserOffline);
    } catch (error) {
      console.log(error);
    }

    setUser(null);
    router.push("/auth/login");
    deleteCookie("accessToken", { path: "/" });
    localStorage.removeItem("user");
    //localStorage.removeItem("locale");
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
