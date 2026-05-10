import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { apiBaseUrl } from "@/lib/api-client";

export async function POST(request: Request) {
  const h = await headers();
  const cookie = h.get("cookie") ?? "";

  const upstream = await fetch(`${apiBaseUrl}/api/auth/sign-out`, {
    method: "POST",
    headers: {
      cookie,
      "content-type": "application/json",
    },
    body: "{}",
  });

  const url = new URL("/login", request.url);
  const res = NextResponse.redirect(url, { status: 303 });

  const setCookie = upstream.headers.get("set-cookie");
  if (setCookie) {
    res.headers.set("set-cookie", setCookie);
  }
  return res;
}
