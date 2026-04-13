import { NextRequest, NextResponse } from "next/server";
import { clerkClient } from "@clerk/nextjs/server";

function getDemoEmail(role: string): string | undefined {
  if (role === "admin") return process.env.NEXT_PUBLIC_DEMO_ADMIN_EMAIL;
  if (role === "installer") return process.env.NEXT_PUBLIC_DEMO_INSTALLER_EMAIL;
  return undefined;
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const role = body?.role;
  const email = getDemoEmail(role);

  if (!email) {
    return NextResponse.json(
      { error: "Invalid demo role", role, emailFound: !!email },
      { status: 400 }
    );
  }

  try {
    const clerk = await clerkClient();

    // Find the demo user by email
    const { data: users } = await clerk.users.getUserList({
      emailAddress: [email],
      limit: 1,
    });

    if (users.length === 0) {
      return NextResponse.json(
        { error: "Demo account not found" },
        { status: 404 }
      );
    }

    // Create a sign-in token for the demo user
    const token = await clerk.signInTokens.createSignInToken({
      userId: users[0].id,
      expiresInSeconds: 60,
    });

    return NextResponse.json({ ticket: token.token });
  } catch (err) {
    console.error("Demo login failed:", err);
    return NextResponse.json(
      { error: "Demo login unavailable" },
      { status: 500 }
    );
  }
}
