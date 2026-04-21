import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: NextRequest) {
  const { email, role } = await req.json();

  if (!email || typeof email !== "string") {
    return NextResponse.json({ error: "Invalid email" }, { status: 400 });
  }

  const registerUrl = `https://caia.andreashagman.no/register?email=${encodeURIComponent(email)}`;

  const { error } = await resend.emails.send({
    from: "Caia <noreply@caia.andreashagman.no>",
    to: email,
    subject: "You've been invited to Caia!",
    html: `
      <p>Hi there,</p>
      <p>You've been invited to join <strong>Caia</strong> as a <strong>${role}</strong>.</p>
      <p style="margin:24px 0;">
        <a href="${registerUrl}" style="display:inline-block;padding:12px 24px;background:#5F8663;color:#fff;border-radius:8px;text-decoration:none;font-weight:600;">
          Create your account
        </a>
      </p>
      <p style="color:#888;font-size:13px;">Or paste this link into your browser:<br>${registerUrl}</p>
    `,
  });

  if (error) {
    console.error("Resend error:", error);
    return NextResponse.json({ error: "Failed to send email" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
