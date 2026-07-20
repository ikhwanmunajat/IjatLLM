import { Resend } from "resend";

const apiKey = process.env.RESEND_API_KEY;

if (!apiKey) {
  console.error("RESEND_API_KEY belum diatur.");
  process.exit(1);
}

const resend = new Resend(apiKey);

async function sendTestInvitation() {
  const recipientEmail = "wannstoree17@gmail.com";
  const templateId = "564dd21c-7da4-444b-b95a-61ec2194d405";

  const { data, error } = await resend.emails.send({
    from: "IjatLLM <noreply@ijatllm.my.id>",

    to: [recipientEmail],

    template: {
      id: templateId,

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

    process.exit(1);
  }

  console.log("Email berhasil dikirim.");
  console.log(JSON.stringify(data, null, 2));
}

sendTestInvitation().catch((error) => {
  console.error("Terjadi kesalahan:", error);
  process.exit(1);
});