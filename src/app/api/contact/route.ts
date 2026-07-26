import { NextRequest, NextResponse } from "next/server";
import { contactMessageSchema } from "@/lib/validations";
import { sendContactNotification } from "@/lib/email";
import { contactFormLimit, isRateLimited } from "@/lib/rateLimit";

function clientIp(req: NextRequest): string {
  return req.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? "unknown";
}

export async function POST(req: NextRequest) {
  if (await isRateLimited(contactFormLimit, clientIp(req))) {
    return NextResponse.json({ error: "Too many messages. Try again shortly." }, { status: 429 });
  }

  const body = await req.json();
  const parsed = contactMessageSchema.safeParse(body);
  if (!parsed.success) {
    // Includes the honeypot failing validation — bots get the same generic
    // error as a real validation failure, no signal that a honeypot exists.
    return NextResponse.json({ error: "Please check your message and try again." }, { status: 400 });
  }

  const delivered = await sendContactNotification(parsed.data);
  if (!delivered) {
    // Distinguish "we understood you" from "it actually reached anyone" —
    // an admin who hasn't configured RESEND_API_KEY yet deserves a clear
    // signal in logs, and the visitor deserves an honest error rather than
    // a false "sent!" for a message that went nowhere.
    return NextResponse.json(
      { error: "Message received but couldn't be delivered right now. Please try emailing directly." },
      { status: 502 }
    );
  }

  return NextResponse.json({ ok: true });
}
