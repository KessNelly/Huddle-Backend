import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendPasswordResetEmail(to: string, resetLink: string): Promise<void> {
  await resend.emails.send({
    from: process.env.EMAIL_FROM!,
    to,
    subject: "Reset your password",
    html: `
      <p>You requested a password reset.</p>
      <p><a href="${resetLink}">Click here to reset your password</a></p>
      <p>This link expires in 30 minutes. If you didn't request this, you can ignore this email.</p>
    `,
  });
}