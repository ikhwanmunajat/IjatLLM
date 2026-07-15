# IjatLLM

IjatLLM adalah platform SaaS AI API Gateway berbahasa Indonesia. Aplikasi menyediakan landing page, katalog model, dokumentasi, status page, customer dashboard, playground terhubung gateway, virtual API key, usage analytics, wallet rupiah, top-up Midtrans/Xendit, support ticket, team workspace, serta admin portal.

LiteLLM Proxy tetap menjadi mesin gateway. Aplikasi bisnis menangani akun, wallet, pembayaran, pricing rupiah, invoice, notifikasi, support, dan rekonsiliasi.

## Menjalankan antarmuka

```bash
npm ci
npm run dev
```

Rute utama:

- `/` marketing website
- `/info` pusat informasi
- `/models` katalog model
- `/docs` dokumentasi API
- `/status` status sistem
- `/login` dan `/register` autentikasi
- `/dashboard` customer portal
- `/admin` admin portal

## Menjalankan stack mandiri

1. Salin `.env.example` menjadi `.env`.
2. Ganti seluruh nilai `change-me` dan isi minimal tiga provider API key.
3. Pastikan Docker Engine dan Compose tersedia.
4. Jalankan `docker compose up --build -d`.
5. Periksa health check dengan `docker compose ps`.

Untuk Windows 11 dan domain `ijatllm.my.id`, gunakan paket otomatis pada [INSTALL-WINDOWS.md](INSTALL-WINDOWS.md). Installer menyiapkan Docker Desktop, rahasia lokal, seluruh container, Cloudflare Tunnel, DNS, HTTPS, diagnosis, pembaruan, dan uninstall.

Endpoint publik LiteLLM tersedia melalui reverse proxy pada `/v1`. PostgreSQL dan Redis hanya berada di jaringan internal. UI teknis LiteLLM `/ui` tidak boleh dibuka untuk customer dan perlu dilindungi dengan VPN, allowlist, atau autentikasi reverse proxy sebelum produksi.

## Aturan keamanan penting

- Jangan commit `.env`.
- Jangan pernah mengirim `LITELLM_MASTER_KEY` ke browser.
- Provider key hanya dibaca dari environment variables.
- Virtual API key mentah hanya ditampilkan satu kali.
- Saldo produksi hanya bertambah setelah webhook pembayaran terverifikasi.
- Gunakan transaksi database dan idempotency key untuk setiap debit usage.
- Ganti seluruh password demo sebelum produksi.

## Integrasi provider

Alias publik didefinisikan di `litellm/config.yaml`. Contoh integrasi:

```javascript
import OpenAI from "openai";

const client = new OpenAI({
  baseURL: "https://api.domainanda.com/v1",
  apiKey: process.env.IJAT_API_KEY,
});

const response = await client.chat.completions.create({
  model: "smart-fast",
  messages: [{ role: "user", content: "Halo, Ijat!" }],
});
```

## Batas implementasi saat ini

Deployment website memakai Sign In with ChatGPT untuk identitas. Playground meneruskan request ke LiteLLM bila `LITELLM_PLAYGROUND_KEY` tersedia dan menampilkan sandbox secara eksplisit bila belum tersedia. Pembayaran memakai Midtrans atau Xendit bila `PAYMENT_PROVIDER` serta kredensialnya terpasang; sandbox hanya aktif saat provider tidak dikonfigurasi. Aktivasi production tetap memerlukan provider API key, SMTP, domain, dan kebijakan akses yang sesuai. Endpoint aplikasi FastAPI menyediakan health check, pembuatan virtual key melalui LiteLLM Management API, serta verifikasi webhook Midtrans dan Xendit dengan idempotency Redis.

## Lisensi

Pertahankan seluruh copyright dan license notice dependency. LiteLLM memiliki fitur yang mungkin memerlukan lisensi enterprise. Jangan menganggap seluruh fitur komersial tercakup oleh lisensi MIT. Lihat halaman `/open-source-notices`.
