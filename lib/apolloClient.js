// lib/apolloClient.js
"use client";

import { ApolloClient, InMemoryCache, ApolloLink, Observable } from "@apollo/client/core";
import { HttpLink } from "@apollo/client/link/http";
import { setCookie, getCookie, deleteCookie } from "cookies-next";
import UploadHttpLink from "apollo-upload-client/UploadHttpLink.mjs";

// ---------- GraphQL endpoint ----------
const GRAPHQL_ENDPOINT = process.env.NEXT_PUBLIC_GRAPHQL_ENDPOINT;

// ---------- HttpLink หลัก (ส่งคุกกี้ไป-กลับ) ----------
// const httpLink = new HttpLink({
//   uri: GRAPHQL_ENDPOINT,
//   credentials: "include", // ✅ ให้คุกกี้ไป-กลับได้ (ใช้ refresh cookie ฝั่ง server)
// });
const httpLink = new UploadHttpLink({
  uri: GRAPHQL_ENDPOINT,
  credentials: "include", // ✅ ให้คุกกี้ไป-กลับได้ (ใช้ refresh cookie ฝั่ง server)
});

// ---------- ตัว refresh mutation (แบบ string ตรงๆ เพื่อไม่ต้อง import gql/print) ----------
const REFRESH_TOKEN_MUTATION = `
  mutation refreshToken {
    refreshToken {
      user {
        id
        firstname
        lastname
        ai_access
        color_mode
        email
        login_type
        locale
        alert
        is_online
        phone
        position
        group_name
        role_name_th
        role_name_en
      }
      token
    }
  }
`;

// ---------- ตัวแปรกันยิง refresh ซ้ำซ้อนพร้อมกันหลายครั้ง ----------
let refreshLock = null; // Promise<string|null> | null

// เรียก refresh token โดยใช้ fetch ตรง (แนบ cookie จาก browser เพราะ credentials:"include")
async function doRefreshToken() {
  try {
    const res = await fetch(GRAPHQL_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ query: REFRESH_TOKEN_MUTATION }),
    });

    const json = await res.json();
    const newToken = json?.data?.refreshToken?.token ?? null;

    if (newToken) {
      localStorage.setItem("user", JSON.stringify(json?.data?.refreshToken?.user));
      // เก็บ accessToken ใหม่ลง cookie
      setCookie("accessToken", newToken, {
        path: "/",
        sameSite: "lax",
        //secure: process.env.NODE_ENV === "production",
        maxAge: 60 * 15, // 7 วัน (ปรับตามนโยบาย)
      });
      return newToken;
    }

    // refresh ไม่สำเร็จ ลบ token เดิมทิ้งไว้ให้ระบบเด้ง login เองตาม flow ของคุณ
    deleteCookie("accessToken");
    return null;
  } catch (e) {
    console.error("[Apollo] refreshToken failed:", e);
    deleteCookie("accessToken");
    return null;
  }
  finally {
    refreshLock = null; // ปลดล็อกเสมอ
  }
}

// คืนค่า token ที่พร้อมใช้งาน: ถ้าไม่มีใน cookie จะไป refresh ให้ก่อน
async function ensureAccessToken() {
  let token = getCookie("accessToken");

  if (!token) {
    // กันยิงซ้ำ: ถ้ามี refresh กำลังทำอยู่แล้ว ให้รออันเดิม
    if (!refreshLock) {
      refreshLock = doRefreshToken();
    }
    token = await refreshLock;
  }

  return token || null;
}

// ---------- ApolloLink: เติม Authorization ก่อนยิงคำขอ ----------
const authLink = new ApolloLink((operation, forward) => {
  return new Observable((observer) => {
    (async () => {
      try {
        const token = await ensureAccessToken();
        console.log(token);
        
        // ใส่ header ถ้ามี token
        operation.setContext(({ headers = {} }) => ({
          headers: {
            ...headers,
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        }));

        const sub = forward(operation).subscribe({
          next: (value) => observer.next(value),
          error: (err) => {
            // (ออปชัน) จะเพิ่ม logic จับ UNAUTHENTICATED แล้วลอง refresh/รีทรายอีกครั้งที่นี่ก็ได้
            observer.error(err);
          },
          complete: () => observer.complete(),
        });

        return () => sub.unsubscribe();
      } catch (e) {
        observer.error(e);
      }
    })();
  });
});

// ---------- Export client ----------
export const client = new ApolloClient({
  link: authLink.concat(httpLink),
  cache: new InMemoryCache(),
});
