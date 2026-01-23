// app/api/proxy-file/route.js
export const runtime = "nodejs";

import { Agent } from "undici";

// ===== allowlist =====
const ALLOWED_HOSTS_EXACT = new Set([
  "esar.onesqa.or.th",
  "aqa2.onesqa.or.th",
  "thaiqa.net",
  "drive.google.com",
  "drive.usercontent.google.com",
  "esar.opec.go.th"
]);

function isAllowedHost(host) {
  if (ALLOWED_HOSTS_EXACT.has(host)) return true;
  // ✅ allow subdomains ของ googleusercontent.com (เช่น doc-xx.googleusercontent.com)
  return host === "googleusercontent.com" || host.endsWith(".googleusercontent.com");
}

// ===== bypass SSL เฉพาะบาง host (ชั่วคราว) =====
const INSECURE_HOSTS = new Set(["esar.onesqa.or.th", "aqa2.onesqa.or.th"]);
const insecureDispatcher = new Agent({ connect: { rejectUnauthorized: false } });

// ===== helpers =====
function safeFilenameFromUrl(u) {
  const p = u.pathname.split("/").pop() || "file";
  try { return decodeURIComponent(p); } catch { return p; }
}

// แปลง Google Drive view link -> uc?export=download&id=...
function rewriteDriveUrl(u) {
  if (u.hostname !== "drive.google.com") return u;

  // /file/d/<id>/view
  const m = u.pathname.match(/^\/file\/d\/([^/]+)/);
  if (m?.[1]) {
    return new URL(`https://drive.google.com/uc?export=download&id=${m[1]}`);
  }

  // /open?id=<id>
  if (u.pathname === "/open" && u.searchParams.get("id")) {
    const id = u.searchParams.get("id");
    return new URL(`https://drive.google.com/uc?export=download&id=${id}`);
  }

  // /uc?export=download&id=...
  if (u.pathname === "/uc" && u.searchParams.get("id")) return u;

  return u;
}

function mergeCookies(currentCookie, res) {
  // undici headers มี getSetCookie() (บาง runtime อาจไม่มี) เลยเผื่อไว้
  const arr =
    (typeof res.headers.getSetCookie === "function" ? res.headers.getSetCookie() : []) ||
    [];

  let setCookies = arr;
  if (!setCookies.length) {
    const sc = res.headers.get("set-cookie");
    if (sc) setCookies = [sc];
  }

  const pairs = setCookies
    .map((x) => String(x).split(";")[0])
    .filter(Boolean);

  if (!pairs.length) return currentCookie || "";

  const jar = {};
  if (currentCookie) {
    currentCookie.split("; ").forEach((p) => {
      const i = p.indexOf("=");
      if (i > 0) jar[p.slice(0, i)] = p.slice(i + 1);
    });
  }

  pairs.forEach((p) => {
    const i = p.indexOf("=");
    if (i > 0) jar[p.slice(0, i)] = p.slice(i + 1);
  });

  return Object.entries(jar)
    .map(([k, v]) => `${k}=${v}`)
    .join("; ");
}

async function fetchWithRedirects(startUrl, { max = 8 } = {}) {
  let url = startUrl;
  let cookie = "";

  for (let i = 0; i < max; i++) {
    if (!isAllowedHost(url.hostname)) {
      return { error: `Forbidden redirect host: ${url.hostname}`, status: 403 };
    }

    const useInsecure = INSECURE_HOSTS.has(url.hostname);

    const res = await fetch(url.toString(), {
      method: "GET",
      redirect: "manual", // ✅ เราจะตาม redirect เองเพื่อเช็ค allowlist
      headers: {
        "User-Agent": "onesqa-proxy",
        ...(cookie ? { Cookie: cookie } : {}),
      },
      ...(useInsecure ? { dispatcher: insecureDispatcher } : {}),
    });

    cookie = mergeCookies(cookie, res);

    // redirect
    if (res.status >= 300 && res.status < 400) {
      const loc = res.headers.get("location");
      if (!loc) return { error: "Redirect without location", status: 502 };
      url = new URL(loc, url); // รองรับ relative redirect
      continue;
    }

    // ✅ Google Drive บางไฟล์จะตอบเป็น HTML confirm page
    const ct = res.headers.get("content-type") || "";
    if (ct.includes("text/html") && url.hostname === "drive.google.com" && url.pathname === "/uc") {
      const text = await res.text();

      const id = url.searchParams.get("id");
      const confirm =
        (text.match(/confirm=([0-9A-Za-z_]+)&amp;id=/)?.[1]) ||
        (text.match(/confirm=([0-9A-Za-z_]+)&id=/)?.[1]);

      if (id && confirm) {
        url = new URL(`https://drive.google.com/uc?export=download&confirm=${confirm}&id=${id}`);
        continue; // ลองใหม่
      }
    }

    return { res, finalUrl: url };
  }

  return { error: "Too many redirects", status: 502 };
}

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const raw = searchParams.get("url");
  if (!raw) return new Response("Missing url", { status: 400 });

  let target;
  try {
    target = new URL(raw);
  } catch {
    return new Response("Invalid url", { status: 400 });
  }

  if (target.protocol !== "https:" || !isAllowedHost(target.hostname)) {
    return new Response("Forbidden", { status: 403 });
  }

  target = rewriteDriveUrl(target);

  const result = await fetchWithRedirects(target);
  if (result?.error) {
    return new Response(result.error, { status: result.status || 502 });
  }

  const { res, finalUrl } = result;

  if (!res.ok || !res.body) {
    return new Response(`Upstream error: ${res.status}`, { status: 502 });
  }

  const contentType = res.headers.get("content-type") || "application/octet-stream";
  const cd = res.headers.get("content-disposition");
  const filename = safeFilenameFromUrl(finalUrl);

  return new Response(res.body, {
    status: 200,
    headers: {
      "Content-Type": contentType,
      "Content-Disposition": cd || `inline; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
