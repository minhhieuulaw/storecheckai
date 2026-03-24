import { NextRequest, NextResponse } from "next/server";
import { findUser, createUser, hashPassword, createSession, COOKIE_NAME, DISPLAY_COOKIE, SESSION_DAYS } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const { email, name, password } = await req.json() as { email?: string; name?: string; password?: string };

    if (!email || !name || !password) {
      return NextResponse.json({ error: "All fields are required." }, { status: 400 });
    }

    const emailTrimmed = email.trim().toLowerCase();
    const nameTrimmed  = name.trim();

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailTrimmed)) {
      return NextResponse.json({ error: "Please enter a valid email address." }, { status: 400 });
    }
    if (password.length < 6) {
      return NextResponse.json({ error: "Password must be at least 6 characters." }, { status: 400 });
    }
    if (nameTrimmed.length < 2) {
      return NextResponse.json({ error: "Please enter your full name." }, { status: 400 });
    }

    if (await findUser(emailTrimmed)) {
      return NextResponse.json({ error: "An account with this email already exists." }, { status: 409 });
    }

    const passwordHash = await hashPassword(password);
    const user = await createUser(emailTrimmed, nameTrimmed, passwordHash);

    const token = await createSession({ sub: user.id, email: user.email, name: user.name });
    const maxAge = SESSION_DAYS * 24 * 60 * 60;
    const isProduction = process.env.NODE_ENV === "production";

    const res = NextResponse.json({ success: true, name: user.name });
    res.cookies.set(COOKIE_NAME, token, { httpOnly: true, secure: isProduction, sameSite: "strict", maxAge, path: "/" });
    res.cookies.set(DISPLAY_COOKIE, JSON.stringify({ email: user.email, name: user.name }), { httpOnly: false, secure: isProduction, sameSite: "strict", maxAge, path: "/" });
    return res;
  } catch {
    return NextResponse.json({ error: "Registration failed. Please try again." }, { status: 500 });
  }
}
