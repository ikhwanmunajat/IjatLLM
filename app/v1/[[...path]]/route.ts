const ENDPOINT_RULES = [
  { pattern: /^models$/, methods: ["GET"] },
  { pattern: /^(chat\/completions|completions|embeddings|moderations|rerank|messages)$/, methods: ["POST"] },
  { pattern: /^responses(?:\/[A-Za-z0-9_-]+)?$/, methods: ["GET", "POST", "DELETE"] },
  { pattern: /^images\/(generations|edits|variations)$/, methods: ["POST"] },
  { pattern: /^audio\/(transcriptions|translations|speech)$/, methods: ["POST"] },
  { pattern: /^batches(?:\/[A-Za-z0-9_-]+(?:\/(cancel|content))?)?$/, methods: ["GET", "POST", "DELETE"] },
  { pattern: /^files(?:\/[A-Za-z0-9_-]+(?:\/content)?)?$/, methods: ["GET", "POST", "DELETE"] },
  { pattern: /^fine_tuning\/jobs(?:\/[A-Za-z0-9_-]+(?:\/(cancel|events|checkpoints))?)?$/, methods: ["GET", "POST"] },
  { pattern: /^vector_stores(?:\/[A-Za-z0-9_-]+(?:\/files(?:\/[A-Za-z0-9_-]+)?)?)?$/, methods: ["GET", "POST", "DELETE"] },
  { pattern: /^search(?:\/[A-Za-z0-9_.-]+)?$/, methods: ["POST"] },
];

type RouteContext = { params: Promise<{ path?: string[] }> };

export async function GET(request: Request, context: RouteContext) {
  return proxyToLiteLLM(request, context);
}

export async function POST(request: Request, context: RouteContext) {
  return proxyToLiteLLM(request, context);
}

export async function DELETE(request: Request, context: RouteContext) {
  return proxyToLiteLLM(request, context);
}

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: corsHeaders() });
}

async function proxyToLiteLLM(request: Request, context: RouteContext) {
  const { path = [] } = await context.params;
  const targetPath = path.join("/");
  const allowed = ENDPOINT_RULES.some((rule) => rule.pattern.test(targetPath) && rule.methods.includes(request.method));
  if (!allowed) {
    return Response.json({ error: { message: "Endpoint tidak tersedia.", type: "invalid_request_error" } }, { status: 404, headers: corsHeaders() });
  }
  const authorization = request.headers.get("authorization");
  if (!authorization?.startsWith("Bearer sk-")) {
    return Response.json({ error: { message: "API key tidak valid atau belum dikirim.", type: "authentication_error" } }, { status: 401, headers: corsHeaders() });
  }
  try {
    const { env } = await import("cloudflare:workers");
    const runtime = env as unknown as { LITELLM_BASE_URL?: string };
    if (!runtime.LITELLM_BASE_URL) {
      return Response.json({ error: { message: "LiteLLM gateway belum dikonfigurasi pada environment produksi.", type: "gateway_not_configured" } }, { status: 503, headers: corsHeaders() });
    }
    const incomingUrl = new URL(request.url);
    const targetUrl = `${runtime.LITELLM_BASE_URL.replace(/\/$/, "")}/v1/${targetPath}${incomingUrl.search}`;
    const headers = new Headers();
    headers.set("authorization", authorization);
    headers.set("content-type", request.headers.get("content-type") ?? "application/json");
    headers.set("accept", request.headers.get("accept") ?? "application/json");
    headers.set("x-ijat-request-id", request.headers.get("x-request-id") ?? crypto.randomUUID());
    const contentLength = Number(request.headers.get("content-length") ?? 0);
    if (contentLength > 25 * 1024 * 1024) {
      return Response.json({ error: { message: "Request body melebihi batas 25 MB.", type: "request_too_large" } }, { status: 413, headers: corsHeaders() });
    }
    const response = await fetch(targetUrl, { method: request.method, headers, body: ["GET", "HEAD"].includes(request.method) ? undefined : request.body, redirect: "manual" });
    const responseHeaders = new Headers(corsHeaders());
    for (const name of ["content-type", "cache-control", "x-request-id", "openai-processing-ms"]) {
      const value = response.headers.get(name);
      if (value) responseHeaders.set(name, value);
    }
    return new Response(response.body, { status: response.status, headers: responseHeaders });
  } catch {
    return Response.json({ error: { message: "Gateway sedang tidak dapat dijangkau.", type: "gateway_error" } }, { status: 502, headers: corsHeaders() });
  }
}

function corsHeaders() {
  return {
    "access-control-allow-origin": "*",
    "access-control-allow-methods": "GET, POST, DELETE, OPTIONS",
    "access-control-allow-headers": "authorization, content-type, x-request-id",
    "access-control-expose-headers": "x-request-id, openai-processing-ms",
  };
}
