import { writeFile } from "node:fs/promises";
import { Resend } from "resend";

const apiKey = process.env.RESEND_API_KEY;

if (!apiKey) {
  console.error("RESEND_API_KEY belum diatur.");
  process.exitCode = 1;
} else {
  const resend = new Resend(apiKey);

  try {
    const { data, error } = await resend.templates.get(
      "ijatllm-pembuatan-akun-1",
    );

    if (error) {
      console.error(
        "Gagal mengambil template:",
        JSON.stringify(error, null, 2),
      );
      process.exitCode = 1;
    } else if (!data?.html) {
      console.error("Template ditemukan, tetapi HTML kosong.");
      process.exitCode = 1;
    } else {
      await writeFile(
        "./template-ijatllm.html",
        data.html,
        "utf8",
      );

      console.log("HTML berhasil disimpan:");
      console.log("C:\\IjatLLM\\template-ijatllm.html");

      console.log("\nInformasi template:");
      console.log({
        id: data.id,
        alias: data.alias,
        name: data.name,
        status: data.status,
      });
    }
  } catch (error) {
    console.error("Kesalahan program:", error);
    process.exitCode = 1;
  }
}