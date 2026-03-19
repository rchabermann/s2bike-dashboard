import { NextRequest, NextResponse } from "next/server";

// Users are managed via Vercel Environment Variables.
// Format: USER_NOME=usuario:senha:admin  or  USER_NOME=usuario:senha:client
// Example:
//   USER_ROBERTO = roberto:minhasenha:admin
//   USER_GAVAIA  = gavaia:outrasenha:client
//
// To add a user: add a new env var starting with USER_
// To remove:     delete the env var
// To change pwd: edit the value
// After any change: redeploy in Vercel (Settings → Environment Variables → Save → Redeploy)

function loadUsers(): Record<string, { password: string; role: "admin" | "client"; displayName: string }> {
  const users: Record<string, { password: string; role: "admin" | "client"; displayName: string }> = {};

  for (const [key, value] of Object.entries(process.env)) {
    if (!key.startsWith("USER_") || !value) continue;
    const parts = value.split(":");
    if (parts.length < 3) continue;
    const [username, password, role] = parts;
    if (!username || !password || !role) continue;
    users[username.toLowerCase()] = {
      password,
      role: role === "admin" ? "admin" : "client",
      displayName: username.charAt(0).toUpperCase() + username.slice(1),
    };
  }

  // Fallback defaults (only used if NO USER_ env vars are defined)
  if (Object.keys(users).length === 0) {
    users["roberto"] = { password: "adm_roberto10", role: "admin", displayName: "Roberto" };
    users["gavaia"]  = { password: "gavaia.01",    role: "client", displayName: "Gavaia" };
  }

  return users;
}

export async function POST(req: NextRequest) {
  const { username, password } = await req.json();
  const users = loadUsers();
  const user = users[username?.toLowerCase()];

  if (!user || user.password !== password) {
    return NextResponse.json({ error: "Usuário ou senha incorretos" }, { status: 401 });
  }

  const payload = JSON.stringify({
    user: username.toLowerCase(),
    role: user.role,
    displayName: user.displayName,
    exp: Date.now() + 8 * 60 * 60 * 1000, // 8 hours
  });
  const token = Buffer.from(payload).toString("base64");

  const res = NextResponse.json({ ok: true, role: user.role, displayName: user.displayName });
  res.cookies.set("auth_token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 8,
    path: "/",
  });

  return res;
}
