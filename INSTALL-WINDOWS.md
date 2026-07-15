# Instalasi IjatLLM di Windows 11

Paket ini menjalankan IjatLLM, LiteLLM Proxy, PostgreSQL, Redis, worker, Prometheus, Grafana, dan Nginx dengan Docker Compose. Cloudflare Tunnel menyediakan HTTPS untuk `ijatllm.my.id` tanpa membuka port router.

## Persiapan

- Windows 11 64-bit dengan virtualisasi aktif.
- Minimal RAM 16 GB, ruang kosong 30 GB, dan laptop dapat menyala saat layanan digunakan.
- Zone `ijatllm.my.id` berstatus Active di Cloudflare.
- Minimal satu API key provider AI.

## Instalasi satu perintah

1. Ekstrak paket ke folder permanen, misalnya `C:\IjatLLM`.
2. Buka **Windows Terminal sebagai Administrator**.
3. Jalankan:

```powershell
Set-ExecutionPolicy -Scope Process Bypass
cd C:\IjatLLM
.\deployment\windows\install-ijatllm.ps1
```

Installer akan:

1. Memasang Docker Desktop dan `cloudflared` melalui `winget` bila diperlukan.
2. Membuat password database dan master key secara acak.
3. Membuka `.env` agar provider API key dapat diisi.
4. Membangun seluruh container.
5. Membuka login Cloudflare satu kali.
6. Membuat tunnel `ijatllm-windows` serta DNS untuk landing, app, API, admin, docs, dan status.
7. Menjalankan Cloudflare Tunnel sebagai Windows service otomatis bernama `IjatLLMTunnel`.

Jika Docker atau WSL2 baru dipasang, restart Windows lalu jalankan perintah yang sama kembali.

Installer mendukung Windows PowerShell 5.1 dan PowerShell 7. Docker Desktop akan dibuka otomatis dan ditunggu hingga Linux Engine siap. Jika tampilan persetujuan awal Docker muncul, selesaikan dahulu lalu jalankan installer kembali.

## Alamat layanan

| Layanan | URL |
|---|---|
| Landing | `https://ijatllm.my.id` |
| Dashboard | `https://app.ijatllm.my.id` |
| OpenAI-compatible API | `https://api.ijatllm.my.id/v1` |
| LiteLLM technical dashboard | `https://gateway.ijatllm.my.id/ui` |
| Admin | `https://admin.ijatllm.my.id` |
| Dokumentasi | `https://docs.ijatllm.my.id` |
| Status | `https://status.ijatllm.my.id` |

## Operasional

```powershell
# Diagnosis dan log
.\deployment\windows\diagnose-ijatllm.ps1

# Update image dan aplikasi
.\deployment\windows\update-ijatllm.ps1

# Hentikan tanpa menghapus database
.\deployment\windows\uninstall-ijatllm.ps1

# Hapus container, database, dan tunnel
.\deployment\windows\uninstall-ijatllm.ps1 -DeleteData -DeleteTunnel
```

## Keamanan Cloudflare

- Aktifkan Cloudflare Access untuk `admin.ijatllm.my.id` dan `gateway.ijatllm.my.id` sebelum memberikan akses kepada orang lain.
- Jangan membuat DNS langsung ke IP rumah. Semua hostname harus menunjuk ke Tunnel.
- Jangan mengekspos port PostgreSQL, Redis, Grafana, atau LiteLLM UI.
- Simpan `.env` hanya pada laptop dan jangan commit ke Git.
- Nonaktifkan sleep otomatis bila layanan harus tersedia 24 jam.

## Batas laptop hosting

Domain hanya aktif ketika laptop menyala, Docker Desktop berjalan, koneksi internet tersedia, dan service `cloudflared` sehat. Untuk SLA produksi 24/7, pindahkan stack yang sama ke VPS atau server khusus.
