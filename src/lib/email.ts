import nodemailer from "nodemailer";

function hasSmtpConfig() {
  return !!(
    process.env.SMTP_HOST &&
    process.env.SMTP_PORT &&
    process.env.SMTP_USER &&
    process.env.SMTP_PASS &&
    process.env.EMAIL_FROM
  );
}

export async function sendPasswordResetEmail(to: string, resetUrl: string) {
  if (!hasSmtpConfig()) {
    console.log(`[UniConnect] Reset link for ${to}: ${resetUrl}`);
    return;
  }

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    secure: Number(process.env.SMTP_PORT) === 465,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to,
    subject: "UniConnect password reset",
    text: `Click this link to reset your password: ${resetUrl}\n\nThis link expires in 15 minutes and can only be used once.`,
    html: `<p>Click this link to reset your password:</p><p><a href="${resetUrl}">${resetUrl}</a></p><p>This link expires in 15 minutes and can only be used once.</p>`,
  });
}

export async function sendAdminEmailVerificationEmail(to: string, verifyUrl: string) {
  if (!hasSmtpConfig()) {
    console.log(`[UniConnect] Admin email verification link for ${to}: ${verifyUrl}`);
    return;
  }

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    secure: Number(process.env.SMTP_PORT) === 465,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to,
    subject: "UniConnect admin email verification",
    text: `Verify your new admin email by opening this link: ${verifyUrl}\n\nThis link expires in 30 minutes and can only be used once.`,
    html: `<p>Verify your new admin email by opening this link:</p><p><a href="${verifyUrl}">${verifyUrl}</a></p><p>This link expires in 30 minutes and can only be used once.</p>`,
  });
}
