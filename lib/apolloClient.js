// lib/apolloClient.js
"use client";

import { ApolloClient, InMemoryCache, ApolloLink, Observable } from "@apollo/client/core";
import { onError } from "@apollo/client/link/error";
import { CombinedGraphQLErrors } from "@apollo/client/errors";
import { setCookie, getCookie, deleteCookie } from "cookies-next";
import UploadHttpLink from "apollo-upload-client/UploadHttpLink.mjs";

// ---------- Config ----------
const GRAPHQL_ENDPOINT = process.env.NEXT_PUBLIC_GRAPHQL_ENDPOINT;
const LOGIN_PATH = "/auth/login";

const LOGOUT_FLAG = "__logout_in_progress__";

function isLogoutInProgress(operation) {
  console.log("operation", operation);
  console.log("sessionStorage.getItem(LOGOUT_FLAG)", sessionStorage.getItem(LOGOUT_FLAG));
  
  // ✅ 1) per-operation flag
  const ctx = operation?.getContext?.() || {};
  console.log("ctx", ctx);
  if (ctx?.suppressAuthRedirect) return true;

  // ✅ 2) global flag ช่วง logout
  try {
    return typeof window !== "undefined" &&
      sessionStorage.getItem(LOGOUT_FLAG) === "1";
  } catch {
    return false;
  }
}

const LOGOUT_MUTATION = `
  mutation logout {
    logout {
      message
    }
  }
`;

async function clearAuthAndGoLogin() {
  // if (redirecting) return;
  // redirecting = true;

  // 1) ลบฝั่ง client เท่าที่ลบได้
  deleteCookie("accessToken", { path: "/" });

  // ✅ ถ้า refreshToken เป็น cookie ที่ไม่ใช่ HttpOnly จะลบได้ตรงนี้
  //deleteCookie("refreshToken", { path: "/" });

  // ✅ ถ้าเคยเก็บ refreshToken ใน storage ก็ลบด้วย
  try {
    localStorage.removeItem("user");
  } catch {}

  // 2) บังคับให้ backend เคลียร์ refreshToken (สำหรับ HttpOnly cookie)
  try {
    await fetch(GRAPHQL_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",     // สำคัญ: ให้แนบ cookie ไปด้วย
      keepalive: true,            // ช่วยให้ request ยังส่งได้แม้กำลังจะ redirect
      body: JSON.stringify({ query: LOGOUT_MUTATION }),
    });
  } catch (e) {
    // ไม่ต้องทำอะไร ต่อให้ยิงไม่ติดก็ยังไปหน้า login ได้
  }

  // 3) redirect
  if (typeof window !== "undefined" && window.location.pathname !== LOGIN_PATH) {
    // ✅ โชว์ loading overlay ก่อน
    window.dispatchEvent(
      new CustomEvent("auth:redirect-loading:show")
    );

    // กัน repaint ไม่ทัน (ให้ UI มีโอกาส render overlay)
    requestAnimationFrame(() => {
      window.location.replace(LOGIN_PATH);
    });
  }
}

function isUnauthorizedError(error, result) {
  console.log("error", error);
  console.log("result", result);

  // --- GraphQL errors (200 แต่มี errors[]) ---
  const gqlErrors =
    (CombinedGraphQLErrors.is(error) ? error.errors : null) ||
    result?.errors ||
    error?.result?.errors ||
    error?.errors ||
    null;

  if (Array.isArray(gqlErrors) && gqlErrors.length) {
    const hit = gqlErrors.some((e) => {
      const code = e?.extensions?.code;
      const msg = String(e?.message || "").toLowerCase();
      console.log("msg", msg);
      
      return code === "UNAUTHENTICATED" || 
        code === "FORBIDDEN" || 
        msg.includes("Unauthorized") || 
        msg.includes("unauthorized") ||
        msg === "no user found" ||
        msg === "No User Found" ||
        msg.includes("AuthUser.id");
    });
    if (hit) return true;
  }

  // --- Network / HTTP errors (เช่น 401, 403, 5xx) ---
  const status =
    error?.statusCode ||
    error?.response?.status ||
    error?.status;

  if (status === 401) return true;

  const nmsg = String(error?.message || "").toLowerCase();
  console.log("nmsg", nmsg);
  
  if (
    nmsg.includes("401") || 
    nmsg.includes("Unauthorized") || 
    nmsg.includes("unauthorized")  || 
    nmsg === "ไม่พบ refreshtoken ถูกส่งมา" ||
    nmsg === "no user found" ||
    nmsg === "No User Found" ||
    nmsg.includes("AuthUser.id")
  ) return true;

  return false;
}

// ---------- UploadHttpLink ----------
const httpLink = new UploadHttpLink({
  uri: GRAPHQL_ENDPOINT,
  credentials: "include",
});

// ---------- Refresh mutation (string) ----------
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

// ---------- กันยิง refresh ซ้ำ ----------
let refreshLock = null; // Promise<string|null> | null

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
      try {
        localStorage.setItem("user", JSON.stringify(json?.data?.refreshToken?.user));
      } catch {}

      setCookie("accessToken", newToken, {
        path: "/",
        sameSite: "lax",
        // secure: process.env.NODE_ENV === "production",
        maxAge: 60 * 15, // 15 นาที (ปรับตามนโยบายจริง)
      });

      return newToken;
    }

    deleteCookie("accessToken", { path: "/" });
    return null;
  } catch (e) {
    console.log("[Apollo] refreshToken failed:", e);
    deleteCookie("accessToken", { path: "/" });
    return null;
  } finally {
    refreshLock = null;
  }
}

async function ensureAccessToken() {
  let token = getCookie("accessToken");
  if (!token) {
    if (!refreshLock) refreshLock = doRefreshToken();
    token = await refreshLock;
  }
  return token || null;
}

// ---------- Auth link: เติม Authorization ----------
const authLink = new ApolloLink((operation, forward) => {
  return new Observable((observer) => {
    (async () => {
      try {
        const token = await ensureAccessToken();

        operation.setContext(({ headers = {} }) => ({
          headers: {
            ...headers,
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        }));

        const sub = forward(operation).subscribe({
          next: (value) => observer.next(value),
          error: (err) => observer.error(err),
          complete: () => observer.complete(),
        });

        return () => sub.unsubscribe();
      } catch (e) {
        observer.error(e);
      }
    })();
  });
});

// ---------- Error link: เจอ Unauthorized => ล้างแล้วเด้ง login ทันที ----------
const errorLink = onError(({ error, result, operation }) => {
  // ✅ ระหว่าง logout: ไม่ต้องทำ clearAuthAndGoLogin
  if (isLogoutInProgress(operation)) return;

  if (isUnauthorizedError(error, result)) {
    console.log("checkkkk", isUnauthorizedError(error, result));
    
    clearAuthAndGoLogin();
  }
});


// ---------- Export client ----------
export const client = new ApolloClient({
  link: ApolloLink.from([errorLink, authLink, httpLink]),
  cache: new InMemoryCache(),
});
