import { getChatGPTUser } from "../../chatgpt-auth";

const PUBLIC_MODELS = new Set(["smart-fast", "smart-pro", "reasoning-pro", "vision-fast"]);

export async function POST(request: Request) {
  const user = await getChatGPTUser();
  if (!user) return Response.json({ error: "Silakan masuk untuk menggunakan playground." }, { status: 401 });

  let body: Record<string, unknown>;
  try {
    body = await request.json() as Record<string, unknown>;
  } catch {
    return Response.json({ error: "Payload JSON tidak valid." }, { status: 400 });
  }

  const model = String(body.model ?? "smart-fast");
  const prompt = String(body.prompt ?? "").trim();
  const system = String(body.system ?? "Anda adalah asisten yang jelas, akurat, dan ringkas.").slice(0, 4000);
  const temperature = Math.min(2, Math.max(0, Number(body.temperature ?? 0.7)));
  const maxTokens = Math.min(4096, Math.max(64, Math.round(Number(body.maxTokens ?? 1024))));
  if (!PUBLIC_MODELS.has(model)) return Response.json({ error: "Model playground tidak tersedia." }, { status: 400 });
  if (!prompt || prompt.length > 12000) return Response.json({ error: "Prompt harus berisi 1 sampai 12.000 karakter." }, { status: 400 });

  const { env } = await import("cloudflare:workers");
  const runtime = env as unknown as { LITELLM_BASE_URL?: string; LITELLM_PLAYGROUND_KEY?: string };
  if (!runtime.LITELLM_BASE_URL && !runtime.LITELLM_PLAYGROUND_KEY) {
    return Response.json({
      mode: "sandbox",
      model,
      content: "AI API Gateway adalah satu pintu untuk mengakses banyak model AI. Aplikasi memakai satu endpoint dan format request, sementara gateway menangani routing, pencatatan token, budget, rate limit, serta fallback provider.",
      usage: { prompt_tokens: Math.ceil(prompt.length / 4), completion_tokens: 47, total_tokens: Math.ceil(prompt.length / 4) + 47 },
      latencyMs: 0,
    });
  }
  if (!runtime.LITELLM_BASE_URL || !runtime.LITELLM_PLAYGROUND_KEY) {
    return Response.json({ error: "Konfigurasi playground LiteLLM belum lengkap." }, { status: 503 });
  }

  const started = Date.now();
  try {
    const response = await fetch(`${runtime.LITELLM_BASE_URL.replace(/\/$/, "")}/v1/chat/completions`, {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${runtime.LITELLM_PLAYGROUND_KEY}` },
      body: JSON.stringify({
        model,
        messages: [{ role: "system", content: system }, { role: "user", content: prompt }],
        temperature,
        max_tokens: maxTokens,
        user: user.email,
        metadata: { platform: "ijatllm", surface: "playground", account: user.email },
      }),
      signal: AbortSignal.timeout(120000),
    });
    const result = await response.json() as { choices?: Array<{ message?: { content?: string } }>; usage?: Record<string, number>; error?: { message?: string } };
    if (!response.ok) return Response.json({ error: result.error?.message ?? `Gateway mengembalikan status ${response.status}.` }, { status: response.status });
    return Response.json({ mode: "production", model, content: result.choices?.[0]?.message?.content ?? "", usage: result.usage ?? {}, latencyMs: Date.now() - started });
  } catch (error) {
    const text = error instanceof Error && error.name === "TimeoutError" ? "Request playground melewati batas waktu." : "Gateway playground sedang tidak dapat dijangkau.";
    return Response.json({ error: text }, { status: 502 });
  }
}
