import { Resend } from "resend";

const apiKey = process.env.RESEND_API_KEY;
const inviteUrl = process.env.TEST_INVITE_URL;

if (!apiKey) {
  console.error("RESEND_API_KEY belum diatur.");
  process.exitCode = 1;
} else if (!inviteUrl) {
  console.error("TEST_INVITE_URL belum diatur.");
  process.exitCode = 1;
} else {
  try {
    new URL(inviteUrl);
  } catch {
    console.error("TEST_INVITE_URL bukan URL yang valid.");
    process.exitCode = 1;
  }

  if (!process.exitCode) {
    const resend = new Resend(apiKey);

    try {
      const { data, error } = await resend.emails.send({
        from: "IjatLLM <noreply@ijatllm.my.id>",
        to: ["wannstoree17@gmail.com"],
        replyTo: "support@ijatllm.my.id",

        template: {
          id: "ijatllm-pembuatan-akun-1",
          variables: {
            user_name: "Ijat",
            invite_url: inviteUrl,
          },
        },
      });

      if (error) {
        console.error(
          "Pengiriman email gagal:",
          JSON.stringify(error, null, 2),
        );
        process.exitCode = 1;
      } else {
        console.log("Email berhasil dikirim:");
        console.log(JSON.stringify(data, null, 2));
        console.log("Invite URL:", inviteUrl);
      }
    } catch (error) {
      console.error("Kesalahan program:", error);
      process.exitCode = 1;
    }
  }
}