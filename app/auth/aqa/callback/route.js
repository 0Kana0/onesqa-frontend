import { NextResponse } from "next/server";

export async function POST(request) {
  console.log("HIT /auth/aqa/callback");  // ✅ ถ้าไม่ขึ้น log = ไม่ถึง handler
  try {
    const form = await request.formData();
    const username = String(form.get("username") || "");
    const aqa_code = String(form.get("aqa_code") || "");

    if (!username || !aqa_code) {
      return NextResponse.redirect(new URL("/auth/login", request.url), 303);
    }

    const endpoint = process.env.NEXT_PUBLIC_GRAPHQL_ENDPOINT_INTERNAL;
    console.log("GRAPHQL endpoint =", endpoint);
    if (!endpoint) return NextResponse.redirect(new URL("/auth/login", request.url), 303);

    const gqlRes = await fetch(endpoint, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        query: `
          mutation signinFromAQA($username: String!, $aqa_code: String!) {
            signinFromAQA(username: $username, aqa_code: $aqa_code) {
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
        `,
        variables: { username, aqa_code },
      }),
      cache: "no-store",
      credentials: 'include'
    });

    const gqlJson = await gqlRes.json();
    const payload = gqlJson?.data?.signinFromAQA;

    if (!payload?.token) {
      return NextResponse.redirect(new URL("/auth/login", request.url), 303);
    }

    const isAdmin =
      payload.user?.role_name_th === "ผู้ดูแลระบบ" ||
      payload.user?.role_name_th === "superadmin";

    const target = isAdmin ? "/onesqa/dashboard" : "/onesqa/chat";

    console.log(gqlRes.headers);
    
    // ✅ 1) forward Set-Cookie (refreshToken) จาก GraphQL -> Browser
    const setCookies =
      typeof gqlRes.headers.getSetCookie === "function"
        ? gqlRes.headers.getSetCookie()
        : (gqlRes.headers.get("set-cookie") ? [gqlRes.headers.get("set-cookie")] : []);

    console.log("setCookies", setCookies);
    
    // ไปหน้า bridge ก่อน
    const bridgeUrl = new URL("/auth/after-login", request.url);
    bridgeUrl.searchParams.set("target", target);

    const res = NextResponse.redirect(bridgeUrl, 303);

    // ส่ง Set-Cookie ให้ browser
    for (const c of setCookies) {
      if (c) res.headers.append("set-cookie", c);
    }

    const cookieStr = setCookies?.[0] || "";
    const token = cookieStr.split(";")[0].split("=").slice(1).join("="); // กันกรณีมี '=' ใน jwt

    // cookie อื่น ๆ ที่คุณ set เองได้ตามเดิม
    res.cookies.set("accessToken", payload.token, {
      path: "/",
      sameSite: "lax",
      maxAge: 60 * 15,
    });

    res.cookies.set("refreshToken", token, {
      httpOnly: true,
      path: "/",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60,
    });

    return res;

  } catch (e) {
    console.error(e);
    return NextResponse.redirect(new URL("/auth/login", request.url), 303);
  }
}
