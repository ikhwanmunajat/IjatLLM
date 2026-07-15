"use client";

import { useState } from "react";

export default function LandingPage() {
  const [english, setEnglish] = useState(false);
  const [banner, setBanner] = useState(true);

  return (
    <main className="koboi-home" id="top">
      {banner && (
        <div className="language-banner">
          <span>
            {english
              ? "This page is displayed in English."
              : "Halaman ini menggunakan Bahasa Indonesia. Klik tombol untuk beralih ke English."}
          </span>
          <button onClick={() => setEnglish(!english)}>
            {english ? "Bahasa Indonesia" : "Switch to English"}
          </button>
          <button className="banner-close" onClick={() => setBanner(false)}>×</button>
        </div>
      )}

      <header className="koboi-header">
        <a className="koboi-logo" href="#top">
          <span className="koboi-logo-icon"><i/><i/><i/></span>
          <b>Ijat<span>LLM</span></b>
        </a>

        <nav>
          <a href="#implementasi">Implementasi⌄</a>
          <a href="#layanan">Produk & Layanan⌄</a>
          <a href="#model">AI Model⌄</a>
          <a href="https://docs.ijatllm.my.id/docs">Dokumentasi</a>
          <a href="#kontak">Kontak & Info</a>
        </nav>

        <div className="koboi-header-actions">
          <button onClick={() => setEnglish(!english)}>ID <b>ID</b>⌄</button>
          <a href="https://platform.ijatllm.my.id/info">Log in →</a>
        </div>
      </header>

      <section className="koboi-hero">
        <div className="koboi-visual">
          <div className="visual-card">
            <div className="server-stack">
              <i/><i/><i/><i/>
            </div>

            <div className="connection-line">
              <span/><span/><span/><span/>
            </div>

            <div className="code-window">
              <div className="window-dots"><i/><i/><i/></div>
              <code>
                <span>const</span> client = new OpenAI({"{"}<br/>
                &nbsp;&nbsp;apiKey: <b>"sk-ijat-xxxx"</b>,<br/>
                &nbsp;&nbsp;baseURL: <b>"https://api.ijatllm.my.id/v1"</b><br/>
                {"}"});<br/><br/>
                response = client.chat.completions.create({"{"}<br/>
                &nbsp;&nbsp;model: <b>"smart-fast"</b><br/>
                {"}"});
              </code>
            </div>

            <div className="model-nodes">
              <span>OpenAI</span>
              <span>Gemini</span>
              <span>Claude</span>
            </div>
          </div>
        </div>

        <div className="koboi-copy">
          <span className="hero-label">AI GATEWAY INDONESIA</span>

          <h1>
            {english
              ? <>LLM API Keys.<br/>Local Payments.</>
              : <>API Key LLM.<br/>Pembayaran Lokal.</>}
          </h1>

          <p>
            {english
              ? "Access leading AI models through one OpenAI-compatible API. Local payments, transparent pricing, and simple integration."
              : "Menyediakan berbagai model API key dari OpenAI, Gemini, Claude, DeepSeek, dan provider AI lainnya. Tersedia layanan gateway, pengelolaan API key, serta implementasi khusus untuk organisasi dan perusahaan."}
          </p>

          <strong>
            {english ? "Easy Access. No Hassle." : "Akses Mudah. Anti Ribet."}
          </strong>

          <a className="koboi-cta" href="https://platform.ijatllm.my.id/info">
            {english ? "Get Started" : "Coba Sekarang"} <span>→</span>
          </a>
        </div>
      </section>

      <section className="koboi-provider">
        <p>TERHUBUNG DENGAN PROVIDER AI TERKEMUKA</p>
        <div>
          {["OpenAI","Google Gemini","Anthropic","DeepSeek","Mistral","Meta Llama"].map(name =>
            <span key={name}>{name}</span>
          )}
        </div>
      </section>

      <section className="koboi-section" id="implementasi">
        <div className="koboi-section-title">
          <span>IMPLEMENTASI</span>
          <h2>Satu endpoint untuk seluruh model AI.</h2>
          <p>Integrasikan layanan AI ke aplikasi Anda menggunakan format API yang kompatibel dengan OpenAI.</p>
        </div>

        <div className="koboi-feature-grid">
          {[
            ["01","Integrasi API","Gunakan SDK OpenAI, Python, JavaScript, PHP, cURL, dan berbagai framework populer."],
            ["02","Pembayaran Rupiah","Top-up menggunakan metode pembayaran lokal tanpa kartu kredit internasional."],
            ["03","Virtual API Key","Buat, batasi, nonaktifkan, dan pantau setiap API key dari satu dashboard."],
            ["04","Multi Provider","Akses berbagai provider AI tanpa harus mengubah struktur aplikasi."],
            ["05","Usage Monitoring","Pantau token, biaya, latensi, status request, dan aktivitas pengguna."],
            ["06","Fallback Otomatis","Alihkan request ke provider cadangan ketika model utama mengalami gangguan."]
          ].map(item => (
            <article key={item[0]}>
              <span>{item[0]}</span>
              <h3>{item[1]}</h3>
              <p>{item[2]}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="koboi-services" id="layanan">
        <div>
          <span>PRODUK & LAYANAN</span>
          <h2>Infrastruktur AI yang siap digunakan.</h2>
          <p>Dibangun untuk developer, startup, lembaga pendidikan, instansi, dan perusahaan Indonesia.</p>
          <a href="https://platform.ijatllm.my.id/info">Lihat portal IjatLLM →</a>
        </div>

        <div className="service-list">
          <article><b>API Gateway</b><span>Satu API untuk seluruh model AI.</span></article>
          <article><b>Virtual Keys</b><span>Budget, rate limit, tim, dan masa aktif.</span></article>
          <article><b>Observability</b><span>Usage, biaya, log, dan performa real-time.</span></article>
          <article><b>Custom Deployment</b><span>Implementasi khusus untuk organisasi.</span></article>
        </div>
      </section>

      <section className="koboi-models" id="model">
        <div className="koboi-section-title">
          <span>AI MODEL</span>
          <h2>Model terbaik dalam satu dashboard.</h2>
        </div>

        <div className="koboi-model-grid">
          {[
            ["OpenAI","GPT untuk chat, reasoning, vision, audio, dan embedding."],
            ["Google Gemini","Context panjang, multimodal, vision, dan pemrosesan dokumen."],
            ["Anthropic Claude","Penulisan, analisis dokumen, coding, dan workflow agentic."],
            ["DeepSeek","Reasoning dan coding dengan biaya yang kompetitif."]
          ].map(model => (
            <article key={model[0]}>
              <div>{model[0].charAt(0)}</div>
              <h3>{model[0]}</h3>
              <p>{model[1]}</p>
              <a href="https://lite.ijatllm.my.id/ui/">Lihat model →</a>
            </article>
          ))}
        </div>
      </section>

      <section className="koboi-final">
        <div>
          <span>MULAI SEKARANG</span>
          <h2>Bangun aplikasi AI lebih cepat bersama IjatLLM.</h2>
          <p>Satu akun, satu saldo, satu API, dan akses ke berbagai model AI.</p>
        </div>
        <a href="https://platform.ijatllm.my.id/info">Dapatkan API Key →</a>
      </section>

      <footer className="koboi-footer" id="kontak">
        <div>
          <a className="koboi-logo" href="#top">
            <span className="koboi-logo-icon"><i/><i/><i/></span>
            <b>Ijat<span>LLM</span></b>
          </a>
          <p>API gateway dan infrastruktur AI untuk Indonesia.</p>
        </div>

        <div>
          <b>Produk</b>
          <a href="#implementasi">Implementasi</a>
          <a href="#layanan">Layanan</a>
          <a href="#model">Model AI</a>
        </div>

        <div>
          <b>Developer</b>
          <a href="https://docs.ijatllm.my.id/docs">Dokumentasi</a>
          <a href="https://api.ijatllm.my.id/health">Status API</a>
          <a href="https://lite.ijatllm.my.id/ui/">Dashboard</a>
        </div>

        <div>
          <b>Kontak</b>
          <a href="mailto:support@ijatllm.my.id">Email</a>
          <a href="https://platform.ijatllm.my.id/info">Pusat Informasi</a>
        </div>
      </footer>

      <div className="koboi-copyright">
        © 2026 IjatLLM. Seluruh hak dilindungi.
      </div>
    </main>
  );
}
