import { Resend } from "resend";

const apiKey = process.env.RESEND_API_KEY;

if (!apiKey) {
  console.error("RESEND_API_KEY belum diatur.");
  process.exitCode = 1;
} else {
  const resend = new Resend(apiKey);

  try {
    const { data, error } = await resend.emails.send({
      from: "IjatLLM <noreply@ijatllm.my.id>",

      // Ganti dengan alamat email penerima pengujian
      to: ["wannstoree17@gmail.com"],

      replyTo: "support@ijatllm.my.id",

      template: {
        // Alias template Resend
        id: "ijatllm-pembuatan-akun-1",

        variables: {
          user_name: "Ijat",
          invite_url:
            "https://lite.ijatllm.my.id/ui/login/?test_invite=1",
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
    }
  } catch (error) {
    console.error("Kesalahan program:", error);
    process.exitCode = 1;
  }
}