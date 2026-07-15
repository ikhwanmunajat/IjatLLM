import { and, desc, eq, sql } from "drizzle-orm";
import { getDb } from "../../../db";
import { getChatGPTUser } from "../../chatgpt-auth";
import { apiKeys, auditLogs, invoices, notifications, paymentOrders, supportTickets, walletLedger, workspaceMembers, workspaces } from "../../../db/schema";

function message(error: unknown) {
  return error instanceof Error ? error.message : "Terjadi kesalahan pada layanan.";
}

export async function GET() {
  const user = await getChatGPTUser();
  if (!user) return Response.json({ error: "Silakan masuk untuk membuka workspace." }, { status: 401 });
  try {
    const db = await getDb();
    const owner = user.email;
    const [keys, tickets, payments, invoiceRows, notificationRows, auditRows, balanceRows, workspaceRows, memberRows, gateway] = await Promise.all([
      db.select().from(apiKeys).where(eq(apiKeys.ownerEmail, owner)).orderBy(desc(apiKeys.createdAt)).limit(20),
      db.select().from(supportTickets).where(eq(supportTickets.ownerEmail, owner)).orderBy(desc(supportTickets.createdAt)).limit(20),
      db.select().from(paymentOrders).where(eq(paymentOrders.ownerEmail, owner)).orderBy(desc(paymentOrders.createdAt)).limit(20),
      db.select().from(invoices).where(eq(invoices.ownerEmail, owner)).orderBy(desc(invoices.createdAt)).limit(20),
      db.select().from(notifications).where(eq(notifications.ownerEmail, owner)).orderBy(desc(notifications.createdAt)).limit(30),
      db.select().from(auditLogs).where(eq(auditLogs.ownerEmail, owner)).orderBy(desc(auditLogs.createdAt)).limit(50),
      db.select({ balance: sql<number>`coalesce(sum(${walletLedger.amount}), 0)` }).from(walletLedger).where(eq(walletLedger.ownerEmail, owner)),
      db.select().from(workspaces).where(eq(workspaces.ownerEmail, owner)).orderBy(desc(workspaces.createdAt)).limit(20),
      db.select({ id: workspaceMembers.id, workspaceId: workspaceMembers.workspaceId, name: workspaceMembers.name, email: workspaceMembers.email, role: workspaceMembers.role, status: workspaceMembers.status, createdAt: workspaceMembers.createdAt })
        .from(workspaceMembers).innerJoin(workspaces, eq(workspaceMembers.workspaceId, workspaces.id)).where(eq(workspaces.ownerEmail, owner)).limit(100),
      inspectGateway(),
    ]);
    return Response.json({ keys, tickets, payments, invoices: invoiceRows, notifications: notificationRows, auditLogs: auditRows, workspaces: workspaceRows, members: memberRows, gateway, balance: Number(balanceRows[0]?.balance ?? 0) });
  } catch (error) {
    return Response.json({ error: message(error), fallback: true }, { status: 503 });
  }
}

export async function POST(request: Request) {
  const user = await getChatGPTUser();
  if (!user) return Response.json({ error: "Silakan masuk untuk mengubah workspace." }, { status: 401 });
  try {
    const body = (await request.json()) as Record<string, unknown>;
    const action = String(body.action ?? "");
    const db = await getDb();

    if (action === "create-key") {
      const name = String(body.name ?? "").trim();
      if (name.length < 3) return Response.json({ error: "Nama key minimal 3 karakter." }, { status: 400 });
      const proxyKey = await createLiteLLMKey({
        name,
        models: String(body.models ?? "smart-fast").split(",").map((value) => value.trim()),
        budget: Number(body.budget ?? 100000),
        rpm: Number(body.rpm ?? 60),
        tpm: Number(body.tpm ?? 100000),
      });
      const token = crypto.randomUUID().replaceAll("-", "") + crypto.randomUUID().replaceAll("-", "").slice(0, 12);
      const fullKey = proxyKey ?? `sk-sandbox-${token}`;
      const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(fullKey));
      const fingerprint = Array.from(new Uint8Array(digest)).map((value) => value.toString(16).padStart(2, "0")).join("");
      const record = {
        id: crypto.randomUUID(), name, prefix: fullKey.slice(0, 16), fingerprint,
        models: String(body.models ?? "smart-fast"), budget: Number(body.budget ?? 100000),
        rpm: Number(body.rpm ?? 60), tpm: Number(body.tpm ?? 100000), origin: proxyKey ? "litellm" : "sandbox", ownerEmail: user.email,
      };
      await db.batch([
        db.insert(apiKeys).values(record),
        db.insert(notifications).values({ id: crypto.randomUUID(), type: "security", title: "API key baru dibuat", message: `${name} siap digunakan dengan kontrol budget dan rate limit.`, ownerEmail: user.email }),
        db.insert(auditLogs).values({ id: crypto.randomUUID(), action: "API_KEY_CREATED", resourceType: "api_key", resourceId: record.id, actor: user.email, ownerEmail: user.email }),
      ]);
      return Response.json({ key: fullKey, record }, { status: 201 });
    }

    if (action === "topup") {
      const amount = Number(body.amount ?? 0);
      const allowed = [25000, 50000, 100000, 250000, 500000, 1000000];
      if (!allowed.includes(amount)) return Response.json({ error: "Nominal top-up tidak valid." }, { status: 400 });
      const orderId = `PAY-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
      const invoiceId = `INV-${new Date().getUTCFullYear()}-${crypto.randomUUID().slice(0, 6).toUpperCase()}`;
      const payment = await createPaymentOrder({ orderId, amount, method: String(body.method ?? "QRIS"), email: user.email });
      const common = [
        db.insert(paymentOrders).values({ id: orderId, amount, method: String(body.method ?? "QRIS"), status: payment.status, ownerEmail: user.email }),
        db.insert(invoices).values({ id: invoiceId, paymentOrderId: orderId, amount, status: payment.status, ownerEmail: user.email }),
        db.insert(auditLogs).values({ id: crypto.randomUUID(), action: payment.status === "paid" ? "PAYMENT_CONFIRMED" : "PAYMENT_CREATED", resourceType: "payment_order", resourceId: orderId, actor: user.email, ownerEmail: user.email }),
      ];
      if (payment.status === "paid") {
        await db.batch([...common,
          db.insert(walletLedger).values({ id: crypto.randomUUID(), type: "TOPUP", amount, reference: orderId, note: "Sandbox payment terverifikasi", ownerEmail: user.email }),
          db.insert(notifications).values({ id: crypto.randomUUID(), type: "billing", title: "Top-up berhasil", message: `Saldo ${formatRupiah(amount)} telah ditambahkan ke wallet.`, ownerEmail: user.email }),
        ]);
      } else {
        await db.batch([...common,
          db.insert(notifications).values({ id: crypto.randomUUID(), type: "billing", title: "Menunggu pembayaran", message: `Selesaikan pembayaran ${formatRupiah(amount)} untuk ${orderId}.`, ownerEmail: user.email }),
        ]);
      }
      return Response.json({ orderId, invoiceId, amount, ...payment }, { status: 201 });
    }

    if (action === "ticket") {
      const subject = String(body.subject ?? "").trim();
      const ticketMessage = String(body.message ?? "").trim();
      if (subject.length < 5 || ticketMessage.length < 10) return Response.json({ error: "Subjek dan pesan perlu dilengkapi." }, { status: 400 });
      const ticket = { id: `TKT-${crypto.randomUUID().slice(0, 6).toUpperCase()}`, subject, message: ticketMessage, category: String(body.category ?? "Technical issue"), priority: "normal", ownerEmail: user.email };
      await db.batch([
        db.insert(supportTickets).values(ticket),
        db.insert(notifications).values({ id: crypto.randomUUID(), type: "support", title: "Tiket dukungan dibuat", message: `${ticket.id} sedang menunggu respons tim support.`, ownerEmail: user.email }),
        db.insert(auditLogs).values({ id: crypto.randomUUID(), action: "SUPPORT_TICKET_CREATED", resourceType: "support_ticket", resourceId: ticket.id, actor: user.email, ownerEmail: user.email }),
      ]);
      return Response.json({ ticket }, { status: 201 });
    }
    if (action === "mark-notifications-read") {
      await db.update(notifications).set({ isRead: true }).where(eq(notifications.ownerEmail, user.email));
      await db.insert(auditLogs).values({ id: crypto.randomUUID(), action: "NOTIFICATIONS_MARKED_READ", resourceType: "notification", resourceId: "all", actor: user.email, ownerEmail: user.email });
      return Response.json({ status: "ok" });
    }
    if (action === "create-workspace") {
      const name = String(body.name ?? "").trim();
      const budget = Number(body.budget ?? 500000);
      if (name.length < 3 || !Number.isFinite(budget) || budget < 25000) return Response.json({ error: "Nama dan budget workspace tidak valid." }, { status: 400 });
      const workspace = { id: crypto.randomUUID(), name, ownerEmail: user.email, budget };
      const ownerMember = { id: crypto.randomUUID(), workspaceId: workspace.id, name: user.displayName, email: user.email, role: "owner", status: "active" };
      await db.batch([
        db.insert(workspaces).values(workspace),
        db.insert(workspaceMembers).values(ownerMember),
        db.insert(auditLogs).values({ id: crypto.randomUUID(), action: "WORKSPACE_CREATED", resourceType: "workspace", resourceId: workspace.id, actor: user.email, ownerEmail: user.email }),
      ]);
      return Response.json({ workspace, member: ownerMember }, { status: 201 });
    }
    if (action === "invite-member") {
      const workspaceId = String(body.workspaceId ?? "");
      const email = String(body.email ?? "").trim().toLowerCase();
      const name = String(body.name ?? email.split("@")[0]).trim();
      const role = String(body.role ?? "developer");
      const owned = await db.select({ id: workspaces.id }).from(workspaces).where(and(eq(workspaces.id, workspaceId), eq(workspaces.ownerEmail, user.email))).limit(1);
      if (!owned.length) return Response.json({ error: "Workspace tidak ditemukan." }, { status: 404 });
      if (!email.includes("@") || !["admin", "developer", "viewer"].includes(role)) return Response.json({ error: "Email atau role tidak valid." }, { status: 400 });
      const member = { id: crypto.randomUUID(), workspaceId, name, email, role, status: "invited" };
      await db.batch([
        db.insert(workspaceMembers).values(member),
        db.insert(notifications).values({ id: crypto.randomUUID(), type: "security", title: "Undangan anggota dibuat", message: `${email} diundang sebagai ${role}.`, ownerEmail: user.email }),
        db.insert(auditLogs).values({ id: crypto.randomUUID(), action: "MEMBER_INVITED", resourceType: "workspace_member", resourceId: member.id, actor: user.email, ownerEmail: user.email }),
      ]);
      return Response.json({ member }, { status: 201 });
    }
    return Response.json({ error: "Action tidak dikenali." }, { status: 400 });
  } catch (error) {
    return Response.json({ error: message(error) }, { status: 500 });
  }
}

type Runtime = {
  LITELLM_BASE_URL?: string;
  LITELLM_MASTER_KEY?: string;
  PAYMENT_PROVIDER?: string;
  MIDTRANS_SERVER_KEY?: string;
  MIDTRANS_IS_PRODUCTION?: string;
  XENDIT_SECRET_KEY?: string;
  IDR_PER_USD?: string;
};

async function runtimeEnv() {
  const { env } = await import("cloudflare:workers");
  return env as unknown as Runtime;
}

async function inspectGateway() {
  const runtime = await runtimeEnv();
  if (!runtime.LITELLM_BASE_URL || !runtime.LITELLM_MASTER_KEY) return { configured: false, connected: false, mode: "sandbox", models: [] as string[] };
  try {
    const base = runtime.LITELLM_BASE_URL.replace(/\/$/, "");
    const response = await fetch(`${base}/v1/models`, { headers: { authorization: `Bearer ${runtime.LITELLM_MASTER_KEY}` }, signal: AbortSignal.timeout(5000) });
    if (!response.ok) return { configured: true, connected: false, mode: "production", models: [] as string[] };
    const payload = await response.json() as { data?: Array<{ id?: string }> };
    return { configured: true, connected: true, mode: "production", models: (payload.data ?? []).map((item) => item.id).filter((id): id is string => Boolean(id)).slice(0, 100) };
  } catch {
    return { configured: true, connected: false, mode: "production", models: [] as string[] };
  }
}

async function createPaymentOrder(input: { orderId: string; amount: number; method: string; email: string }) {
  const runtime = await runtimeEnv();
  const provider = runtime.PAYMENT_PROVIDER?.toLowerCase();
  if (!provider) return { status: "paid", mode: "sandbox", redirectUrl: null as string | null };
  if (provider === "midtrans") {
    if (!runtime.MIDTRANS_SERVER_KEY) throw new Error("Kredensial Midtrans belum lengkap.");
    const api = runtime.MIDTRANS_IS_PRODUCTION === "true" ? "https://app.midtrans.com" : "https://app.sandbox.midtrans.com";
    const response = await fetch(`${api}/snap/v1/transactions`, {
      method: "POST", headers: { "content-type": "application/json", authorization: `Basic ${btoa(`${runtime.MIDTRANS_SERVER_KEY}:`)}` },
      body: JSON.stringify({ transaction_details: { order_id: input.orderId, gross_amount: input.amount }, customer_details: { email: input.email }, enabled_payments: midtransMethods(input.method) }),
    });
    if (!response.ok) throw new Error(`Midtrans mengembalikan status ${response.status}.`);
    const result = await response.json() as { redirect_url?: string };
    return { status: "pending", mode: "midtrans", redirectUrl: result.redirect_url ?? null };
  }
  if (provider === "xendit") {
    if (!runtime.XENDIT_SECRET_KEY) throw new Error("Kredensial Xendit belum lengkap.");
    const response = await fetch("https://api.xendit.co/v2/invoices", {
      method: "POST", headers: { "content-type": "application/json", authorization: `Basic ${btoa(`${runtime.XENDIT_SECRET_KEY}:`)}` },
      body: JSON.stringify({ external_id: input.orderId, amount: input.amount, payer_email: input.email, description: `Top-up IjatLLM ${input.orderId}` }),
    });
    if (!response.ok) throw new Error(`Xendit mengembalikan status ${response.status}.`);
    const result = await response.json() as { invoice_url?: string };
    return { status: "pending", mode: "xendit", redirectUrl: result.invoice_url ?? null };
  }
  throw new Error("PAYMENT_PROVIDER harus midtrans atau xendit.");
}

function midtransMethods(method: string) {
  if (method === "QRIS") return ["gopay", "shopeepay", "other_qris"];
  if (method === "Virtual Account") return ["bca_va", "bni_va", "bri_va", "permata_va"];
  if (method === "GoPay") return ["gopay"];
  return ["other_qris"];
}

function formatRupiah(value: number) {
  return `Rp${new Intl.NumberFormat("id-ID").format(value)}`;
}

async function createLiteLLMKey(input: { name: string; models: string[]; budget: number; rpm: number; tpm: number }) {
  const runtime = await runtimeEnv();
  if (!runtime.LITELLM_BASE_URL && !runtime.LITELLM_MASTER_KEY) return null;
  if (!runtime.LITELLM_BASE_URL || !runtime.LITELLM_MASTER_KEY) throw new Error("Konfigurasi LiteLLM belum lengkap.");
  const idrPerUsd = Number(runtime.IDR_PER_USD ?? 16200);
  if (!Number.isFinite(idrPerUsd) || idrPerUsd <= 0) throw new Error("IDR_PER_USD tidak valid.");
  const response = await fetch(`${runtime.LITELLM_BASE_URL.replace(/\/$/, "")}/key/generate`, {
    method: "POST",
    headers: { "content-type": "application/json", authorization: `Bearer ${runtime.LITELLM_MASTER_KEY}` },
    body: JSON.stringify({
      key_alias: input.name,
      models: input.models,
      max_budget: Number((input.budget / idrPerUsd).toFixed(6)),
      budget_duration: "30d",
      rpm_limit: input.rpm,
      tpm_limit: input.tpm,
      metadata: { platform: "ijatllm", budget_currency: "IDR", budget_idr: input.budget },
    }),
  });
  if (!response.ok) throw new Error(`LiteLLM management API returned ${response.status}`);
  const result = await response.json() as { key?: string };
  if (!result.key?.startsWith("sk-")) throw new Error("LiteLLM tidak mengembalikan virtual key yang valid.");
  return result.key;
}
