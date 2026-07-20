import { Resend } from "resend";

const apiKey = process.env.RESEND_API_KEY;
const emailId = "MASUKKAN_ID_EMAIL_HASIL_PENGIRIMAN";

if (!apiKey) {
  console.error("RESEND_API_KEY belum diatur.");
  process.exitCode = 1;
} else {
  const resend = new Resend(apiKey);

  try {
    const { data, error } = await resend.emails.get(emailId);

    if (error) {
      console.error(
        "Gagal membaca email:",
        JSON.stringify(error, null, 2),
      );
      process.exitCode = 1;
    } else {
      console.log({
        id: data.id,
        subject: data.subject,
        from: data.from,
        to: data.to,
        status: data.last_event,
      });

      console.log("\nHTML yang benar-benar dikirim:\n");
      console.log(data.html);
    }
  } catch (error) {
    console.error("Kesalahan program:", error);
    process.exitCode = 1;
  }
}