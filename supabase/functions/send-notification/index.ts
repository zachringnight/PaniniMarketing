// Supabase Edge Function: Send email notification via SMTP
// Deploy with: supabase functions deploy send-notification

// This edge function handles sending transactional emails via SMTP.
// Environment variables needed: SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

const SMTP_HOST = Deno.env.get("SMTP_HOST") || "";
const SMTP_PORT = parseInt(Deno.env.get("SMTP_PORT") || "587");
const SMTP_USER = Deno.env.get("SMTP_USER") || "";
const SMTP_PASS = Deno.env.get("SMTP_PASS") || "";
const SMTP_FROM = Deno.env.get("SMTP_FROM") || "noreply@partnershiphub.com";

interface EmailPayload {
  to: string;
  subject: string;
  html: string;
}

serve(async (req: Request) => {
  try {
    const { to, subject, html }: EmailPayload = await req.json();

    if (!to || !subject || !html) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: to, subject, html" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // If SMTP is not configured, log and return success
    if (!SMTP_HOST || !SMTP_USER) {
      console.log(`[Email] Would send to ${to}: ${subject}`);
      console.log(`[Email] Body preview: ${html.substring(0, 200)}...`);
      return new Response(
        JSON.stringify({ success: true, message: "Email logged (SMTP not configured)" }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }

    // Build SMTP email using Deno's SMTP capabilities
    // Using raw SMTP connection for maximum compatibility
    const encoder = new TextEncoder();
    const decoder = new TextDecoder();

    const conn = await Deno.connect({ hostname: SMTP_HOST, port: SMTP_PORT });

    // Helper to send command and read response
    async function sendCommand(command: string): Promise<string> {
      await conn.write(encoder.encode(command + "\r\n"));
      const buf = new Uint8Array(1024);
      const n = await conn.read(buf);
      return decoder.decode(buf.subarray(0, n || 0));
    }

    // Read greeting
    const buf = new Uint8Array(1024);
    await conn.read(buf);

    // SMTP conversation
    await sendCommand(`EHLO partnershiphub.com`);
    await sendCommand(`AUTH LOGIN`);
    await sendCommand(btoa(SMTP_USER));
    await sendCommand(btoa(SMTP_PASS));
    await sendCommand(`MAIL FROM:<${SMTP_FROM}>`);
    await sendCommand(`RCPT TO:<${to}>`);
    await sendCommand(`DATA`);

    const message = [
      `From: Partnership Hub <${SMTP_FROM}>`,
      `To: ${to}`,
      `Subject: ${subject}`,
      `MIME-Version: 1.0`,
      `Content-Type: text/html; charset=UTF-8`,
      ``,
      html,
      `.`,
    ].join("\r\n");

    await sendCommand(message);
    await sendCommand(`QUIT`);
    conn.close();

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Email send error:", error);
    return new Response(
      JSON.stringify({ error: "Failed to send email", details: String(error) }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});
