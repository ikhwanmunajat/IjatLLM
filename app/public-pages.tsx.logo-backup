"use client";
import { useMemo, useState } from "react";

const docsNav = ["Pengenalan","Memulai","Authentication","Models","Chat Completions","Responses API","Anthropic Messages","Embeddings","Image Generation","Speech-to-Text","Text-to-Speech","Batches","Files","Rerank","Vector Stores","Python SDK","JavaScript SDK","PHP","cURL","n8n","Error Codes","Rate Limits","Billing","Webhooks","FAQ"];
const allModels = [
  ["smart-fast","Ijat Swift","OpenAI","Text + Vision","128K","Rp2,7","Rp10,9"], ["smart-pro","Ijat Creative","Anthropic","Text + Vision","200K","Rp5,5","Rp27,4"],
  ["reasoning-pro","Ijat Reason","DeepSeek","Reasoning","64K","Rp1,1","Rp4,4"], ["vision-fast","Ijat Vision","Google","Text + Vision","1M","Rp1,8","Rp7,3"],
  ["llama-large","Ijat Open","Meta","Text","128K","Rp0,9","Rp3,5"], ["mistral-fast","Ijat Mix","Mistral","Text","32K","Rp0,8","Rp2,9"],
  ["embedding-small","Ijat Embed","Cohere","Embedding","8K","Rp0,2","â€”"], ["audio-transcribe","Ijat Listen","OpenAI","Audio","25 MB","Rp95/mnt","â€”"],
  ["voice-standard","Ijat Voice","OpenAI","Speech","4K","Rp245/1K","â€”"], ["image-standard","Ijat Canvas","Google","Image","4K","Rp480/img","â€”"],
];

function PublicHeader(){return <header className="public-header"><a className="brand" href="/"><span className="brand-mark"><i/><i/><i/></span><span>Ijat<span>LLM</span></span></a><nav><a href="/#fitur">Produk</a><a href="/models">Model AI</a><a href="/#harga">Harga</a><a href="/docs">Dokumentasi</a><a href="/status">Status</a></nav><div><a className="btn ghost" href="/login">Masuk</a><a className="btn primary small" href="/register">Mulai sekarang â†’</a></div></header>}
function PublicFooter(){return <footer className="simple-footer"><span>Â© 2026 IjatLLM</span><div><a href="/privacy">Privasi</a><a href="/terms">Syarat</a><a href="/open-source-notices">Open source</a></div><span><i/> Semua sistem normal</span></footer>}

export function ModelsPage(){const [query,setQuery]=useState("");const [filter,setFilter]=useState("Semua");const rows=useMemo(()=>allModels.filter(r=>(filter==="Semua"||r[3].includes(filter))&&r.join(" ").toLowerCase().includes(query.toLowerCase())),[query,filter]);return <main className="public-page"><PublicHeader/><section className="public-hero compact-hero"><span className="kicker">MODEL CATALOG</span><h1>Model terbaik untuk setiap pekerjaan.</h1><p>Bandingkan kapabilitas, context window, dan harga. Gunakan alias publik agar aplikasi tidak terkunci pada satu provider.</p></section><section className="catalog-section"><div className="catalog-tools"><label>âŒ•<input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Cari model, provider, atau modalitas..."/></label><div>{["Semua","Text","Vision","Reasoning","Embedding","Audio","Image"].map(x=><button className={filter===x?"active":""} onClick={()=>setFilter(x)} key={x}>{x}</button>)}</div></div><div className="public-model-table"><div className="model-row table-head"><span>MODEL</span><span>PROVIDER</span><span>MODALITAS</span><span>CONTEXT</span><span>INPUT / 1K</span><span>OUTPUT / 1K</span><span>STATUS</span><span/></div>{rows.map((r,i)=><div className="model-row" key={r[0]}><span className="model-name"><i className={`c${i}`}>{r[1].charAt(5)}</i><b>{r[1]}<small>{r[0]}</small></b></span><span>{r[2]}</span><span>{r[3]}</span><span>{r[4]}</span><span>{r[5]}</span><span>{r[6]}</span><span className="status-ok"><i/>Operational</span><a href={`/playground?model=${r[0]}`}>Coba â†—</a></div>)}</div><div className="pricing-note"><i>i</i><p>Harga dalam rupiah dan dapat berubah mengikuti kurs serta provider. Setiap transaksi menyimpan versi harga dan kurs yang digunakan.</p></div></section><PublicFooter/></main>}

export function DocsPage(){const [active,setActive]=useState("Chat Completions");const [lang,setLang]=useState("JavaScript");const code=lang==="JavaScript"?`import OpenAI from "openai";\n\nconst client = new OpenAI({\n  baseURL: "https://api.ijat.ai/v1",\n  apiKey: process.env.IJAT_API_KEY\n});\n\nconst response = await client.chat.completions.create({\n  model: "smart-fast",\n  messages: [{ role: "user", content: "Halo, Ijat!" }]\n});`:lang==="Python"?`from openai import OpenAI\n\nclient = OpenAI(\n  base_url="https://api.ijat.ai/v1",\n  api_key=os.environ["IJAT_API_KEY"]\n)\n\nresponse = client.chat.completions.create(\n  model="smart-fast",\n  messages=[{"role": "user", "content": "Halo, Ijat!"}]\n)`: `curl https://api.ijat.ai/v1/chat/completions \\\n  -H "Authorization: Bearer $IJAT_API_KEY" \\\n  -H "Content-Type: application/json" \\\n  -d '{"model":"smart-fast","messages":[{"role":"user","content":"Halo!"}]}'`;return <main className="docs-shell"><PublicHeader/><div className="docs-layout"><aside className="docs-sidebar"><label>âŒ•<input placeholder="Cari dokumentasi..."/><kbd>âŒ˜K</kbd></label>{docsNav.map((x,i)=><button className={active===x?"active":""} onClick={()=>setActive(x)} key={x}>{i===0&&<span>GET STARTED</span>}{i===2&&<span>API REFERENCE</span>}{i===11&&<span>SDK & TOOLS</span>}{x}</button>)}</aside><article className="docs-article"><div className="doc-breadcrumb">Dokumentasi / API Reference / <b>{active}</b></div><span className="method-badge">POST</span><h1>/v1/chat/completions</h1><p className="lead">Membuat respons model berdasarkan percakapan yang diberikan. Endpoint ini kompatibel dengan OpenAI SDK dan mendukung streaming.</p><div className="doc-callout"><i>i</i><p>Gunakan virtual API key IjatLLM pada header <code>Authorization</code>. Jangan pernah menaruh key di kode frontend.</p></div><h2>Request</h2><div className="parameter"><code>model</code><span>string Â· required</span><p>Alias model publik, misalnya <code>smart-fast</code> atau <code>reasoning-pro</code>.</p></div><div className="parameter"><code>messages</code><span>array Â· required</span><p>Daftar pesan dengan role <code>system</code>, <code>user</code>, atau <code>assistant</code>.</p></div><div className="parameter"><code>stream</code><span>boolean Â· optional</span><p>Aktifkan Server-Sent Events untuk menerima token secara bertahap.</p></div><h2>Response</h2><p>Respons berisi pilihan model, konten, dan ringkasan penggunaan token.</p><div className="doc-nav"><button>â† Models</button><button>Responses API â†’</button></div></article><aside className="code-sidebar"><div className="code-tabs">{["JavaScript","Python","cURL"].map(x=><button className={lang===x?"active":""} onClick={()=>setLang(x)} key={x}>{x}</button>)}</div><div className="doc-code"><button onClick={()=>void navigator.clipboard.writeText(code)}>Salin</button><pre>{code}</pre></div><div className="response-code"><span>200 RESPONSE</span><pre>{`{\n  "id": "chatcmpl_01...",\n  "model": "smart-fast",\n  "choices": [{\n    "message": {\n      "role": "assistant",\n      "content": "Halo! Ada yang..."\n    }\n  }],\n  "usage": {\n    "total_tokens": 42\n  }\n}`}</pre></div></aside></div></main>}

export function StatusPage(){const components=[["API Gateway","Operational","82 ms","99.99%"],["Authentication","Operational","105 ms","99.98%"],["Dashboard","Operational","138 ms","99.97%"],["Payment Gateway","Operational","221 ms","99.95%"],["OpenAI Provider","Operational","420 ms","99.91%"],["Gemini Provider","Operational","382 ms","99.94%"],["Anthropic Provider","Degraded Performance","714 ms","99.72%"],["DeepSeek Provider","Operational","458 ms","99.89%"]];return <main className="public-page status-page"><PublicHeader/><section className="status-hero"><div className="status-badge"><i/> Semua layanan utama beroperasi normal</div><h1>Status sistem IjatLLM</h1><p>Pembaruan terakhir 13 Juli 2026, 22.42 WIB. Pemeriksaan otomatis setiap 60 detik.</p></section><section className="status-content"><div className="uptime-summary"><div><span>UPTIME 90 HARI</span><b>99,97%</b></div><div><span>RESPONSE TIME</span><b>314 ms</b></div><div><span>INSIDEN AKTIF</span><b>0</b></div></div><h2>Komponen layanan</h2><div className="component-list">{components.map((r,i)=><article key={r[0]}><div><span className={r[1].startsWith("Degraded")?"component-icon warning":"component-icon"}>{i<4?"I":"P"}</span><b>{r[0]}<small>Uptime {r[3]}</small></b></div><div className="uptime-bars">{Array.from({length:38},(_,j)=><i className={r[1].startsWith("Degraded")&&j>31&&j<35?"degraded":""} key={j}/>)}</div><span className={r[1].startsWith("Degraded")?"component-state degraded":"component-state"}><i/>{r[1]}<small>{r[2]}</small></span></article>)}</div><div className="incident-head"><h2>Riwayat insiden</h2><select><option>90 hari terakhir</option><option>30 hari terakhir</option></select></div><article className="incident"><span>12 JUL 2026</span><div><h3>Peningkatan latensi Anthropic</h3><p>Sebagian request mengalami latensi di atas normal. Routing otomatis memindahkan traffic ke provider cadangan.</p><small><i/> Resolved Â· Durasi 24 menit</small></div></article><article className="incident"><span>28 JUN 2026</span><div><h3>Maintenance database terjadwal</h3><p>Pemeliharaan indeks usage analytics selesai tanpa gangguan terhadap API Gateway.</p><small><i/> Completed Â· Durasi 18 menit</small></div></article></section><PublicFooter/></main>}

export function InfoPage(){
  return <main className="ijat-portal">
    <section className="portal-heading">
      <div className="portal-title">
        <span className="brand-mark"><i/><i/><i/></span>
        <h1>Ijat<span>LLM</span> Portal</h1>
      </div>

      <p>Login, Top-Up Saldo & Info Terbaru platform IjatLLM.</p>

      <div className="portal-status">
        Status Server: <b><i/> ONLINE</b>
      </div>

      <small>Ikuti saluran informasi untuk maintenance dan pembaruan model.</small>

      <div className="portal-actions">
        <a className="portal-topup" href="/register">
          💳 <span>Top up saldo instan, QRIS, e-wallet, dll.<b>Langsung Masuk</b></span>
        </a>

        <a className="portal-login"
          href="https://lite.ijatllm.my.id/ui/login/?source=info">
          🚀 Lanjut ke halaman login <span>→</span>
        </a>

        <a className="portal-login-help"
          href="https://lite.ijatllm.my.id/ui/login/?source=info">
          Klik di sini apabila tombol login tidak ditemukan
        </a>
      </div>
    </section>

    <section className="portal-board">
      <header>
        <div><span className="board-icon">ⓘ</span><h2>Papan Informasi</h2></div>
        <nav>
          <a href="#" aria-label="YouTube">▣ YouTube</a>
          <a href="#" aria-label="TikTok">♪ TikTok</a>
          <a href="#" aria-label="Instagram">◎ Instagram</a>
        </nav>
      </header>

      <div className="portal-grid">
        <article className="topup-info">
          <h3><span>◎</span> Info Top-up</h3>

          <div className="info-message">
            <b className="new-user">✕ Belum punya akun</b>
            <p>Klik top-up saldo, masukkan jumlah saldo yang ingin diisi, serta alamat email. Anda akan menerima informasi akun baru beserta saldo.</p>
          </div>

          <div className="info-message">
            <b className="old-user">☑ Sudah punya akun</b>
            <p>Klik top-up saldo dan masukkan email yang sama dengan akun sebelumnya. Saldo akan otomatis masuk ke akun Anda.</p>
          </div>
        </article>

        <aside className="portal-links">
          <a className="whatsapp" href="mailto:support@ijatllm.my.id">
            <span>◯</span>
            <div><b>Saluran Bantuan <em>WAJIB</em></b><small>Info maintenance dan pembaruan model.</small></div>
            <strong>Hubungi Kami</strong>
          </a>

          <a href="https://docs.ijatllm.my.id/docs">
            <span>▣</span>
            <div><b>Dokumentasi</b><small>Tutorial dan petunjuk pemakaian platform.</small></div>
          </a>

          <a href="mailto:support@ijatllm.my.id">
            <span>☎</span>
            <div><b>Admin IjatLLM</b><small>support@ijatllm.my.id</small></div>
          </a>

          <div className="provider-alert">
            <span>⚠</span>
            <div><b>Informasi Provider AI</b><small>Status provider dan ketersediaan model dapat dilihat pada halaman status.</small></div>
          </div>
        </aside>
      </div>
    </section>

    <footer className="portal-footer">
      © 2026 IjatLLM · Platform API AI Indonesia
    </footer>
  </main>
}

export function LegalPage({type}:{type:"terms"|"privacy"|"security"|"open-source"}){const content={terms:["Syarat Layanan","Ketentuan penggunaan platform, API, pembayaran, dan tanggung jawab pengguna."],privacy:["Kebijakan Privasi","Cara IjatLLM memproses data akun, metadata penggunaan, dan preferensi privasi."],security:["Keamanan","Kontrol teknis dan operasional untuk melindungi API key, data, dan transaksi."],"open-source":["Open Source Notices","Daftar komponen open-source yang mendukung IjatLLM dan kewajiban lisensinya."]}[type];return <main className="public-page"><PublicHeader/><section className="legal-layout"><aside><a className={type==="terms"?"active":""} href="/terms">Syarat Layanan</a><a className={type==="privacy"?"active":""} href="/privacy">Kebijakan Privasi</a><a className={type==="security"?"active":""} href="/security">Keamanan</a><a className={type==="open-source"?"active":""} href="/open-source-notices">Open Source</a></aside><article><span>Terakhir diperbarui: 13 Juli 2026</span><h1>{content[0]}</h1><p className="lead">{content[1]}</p>{type==="open-source"?<><h2>Komponen utama</h2><div className="license-table">{[["LiteLLM","Latest stable","MIT / Enterprise features vary","github.com/BerriAI/litellm"],["Next.js","16","MIT","github.com/vercel/next.js"],["React","19","MIT","github.com/facebook/react"],["Tailwind CSS","4","MIT","github.com/tailwindlabs/tailwindcss"],["Drizzle ORM","0.45","Apache-2.0","github.com/drizzle-team/drizzle-orm"]].map(r=><div key={r[0]}><b>{r[0]}</b><span>{r[1]}</span><span>{r[2]}</span><code>{r[3]}</code></div>)}</div><p>IjatLLM mempertahankan notice dan lisensi yang diwajibkan. Fitur LiteLLM Enterprise perlu lisensi yang sesuai dan tidak dianggap tercakup oleh lisensi MIT.</p></>:<>{["Ruang lingkup","Data dan keamanan","Hak serta kewajiban","Perubahan kebijakan","Hubungi kami"].map((x,i)=><section key={x}><h2>{i+1}. {x}</h2><p>Ketentuan ini menjelaskan standar operasional IjatLLM secara transparan. Pengguna wajib menjaga keamanan kredensial, mematuhi kebijakan provider, dan menggunakan layanan sesuai hukum yang berlaku. Setiap perubahan material akan diinformasikan melalui pusat notifikasi.</p></section>)}</>}</article></section><PublicFooter/></main>}

