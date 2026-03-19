import { NextRequest, NextResponse } from "next/server";

const USERS: Record<string, { password: string; role: "admin" | "client"; displayName: string }> = {
  roberto: {
    password: process.env.PASSWORD_ADMIN ?? "adm_roberto10",
    role: "admin",
    displayName: "Roberto",
  },
  gavaia: {
    password: process.env.PASSWORD_GAVAIA ?? "gavaia.01",
    role: "client",
    displayName: "Gavaia",
  },
};

export async function POST(req: NextRequest) {
  const { username, password } = await req.json();

  const user = USERS[username?.toLowerCase()];
  if (!user || user.password !== password) {
    return NextResponse.json({ error: "Usuário ou senha incorretos" }, { status: 401 });
  }

  // Simple base64 token (8h expiry)
  const payload = JSON.stringify({
    user: username.toLowerCase(),
    role: user.role,
    displayName: user.displayName,
    exp: Date.now() + 8 * 60 * 60 * 1000,
  });
  const token = Buffer.from(payload).toString("base64");

  const res = NextResponse.json({ ok: true, role: user.role, displayName: user.displayName });
  res.cookies.set("auth_token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 8, // 8 hours
    path: "/",
  });

  return res;
}
