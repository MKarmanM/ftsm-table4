import nodemailer, { type Transporter } from "nodemailer";

let cachedTransporter: Promise<Transporter> | null = null;
let usingEthereal = false;

// If SMTP_HOST etc. are set in .env, use real SMTP. Otherwise, auto-create
// a free Ethereal test account (fake inbox) so email notifications work
// out of the box for local testing — every "sent" email gets a preview
// link printed to the terminal instead of actually being delivered.
function getTransporter(): Promise<Transporter> {
  if (cachedTransporter) return cachedTransporter;

  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env;

  if (SMTP_HOST && SMTP_USER && SMTP_PASS) {
    cachedTransporter = Promise.resolve(
      nodemailer.createTransport({
        host: SMTP_HOST,
        port: Number(SMTP_PORT ?? 587),
        secure: Number(SMTP_PORT) === 465,
        auth: { user: SMTP_USER, pass: SMTP_PASS },
      })
    );
    return cachedTransporter;
  }

  usingEthereal = true;
  cachedTransporter = nodemailer.createTestAccount().then((testAccount) =>
    nodemailer.createTransport({
      host: "smtp.ethereal.email",
      port: 587,
      secure: false,
      auth: { user: testAccount.user, pass: testAccount.pass },
    })
  );
  console.warn(
    "[email] SMTP_HOST tidak ditetapkan dalam .env — menggunakan akaun ujian " +
      "Ethereal sementara. Emel TIDAK akan sampai ke inbox sebenar; pautan " +
      "pratonton akan dipaparkan dalam log terminal setiap kali emel " +
      "'dihantar'. Tetapkan SMTP_HOST/SMTP_PORT/SMTP_USER/SMTP_PASS dalam " +
      ".env untuk emel sebenar."
  );
  return cachedTransporter;
}

export async function sendEmail(params: {
  to: string | string[];
  subject: string;
  html: string;
}) {
  try {
    const transporter = await getTransporter();
    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM ?? '"Table 4 FTSM" <noreply@ftsm.local>',
      to: params.to,
      subject: params.subject,
      html: params.html,
    });

    if (usingEthereal) {
      const previewUrl = nodemailer.getTestMessageUrl(info);
      console.log(`[email] (Ethereal, tidak sampai sebenar) ${params.subject} -> ${params.to}`);
      if (previewUrl) console.log(`[email] Pratonton: ${previewUrl}`);
    }
  } catch (err) {
    // Notifications are best-effort — a failed email should never break
    // the workflow action that triggered it.
    console.error("[email] Gagal menghantar emel:", err);
  }
}
