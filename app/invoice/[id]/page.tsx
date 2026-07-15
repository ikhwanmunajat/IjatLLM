import { and, eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { getDb } from "../../../db";
import { invoices, paymentOrders } from "../../../db/schema";
import { requireChatGPTUser } from "../../chatgpt-auth";
import PrintButton from "../print-button";

export const dynamic = "force-dynamic";

function rupiah(value: number) { return `Rp${new Intl.NumberFormat("id-ID").format(value)}`; }

export default async function InvoicePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireChatGPTUser(`/invoice/${id}`);
  let payment: { id: string; amount: number; method: string; status: string; createdAt: string } | undefined;
  let invoice: { id: string; paymentOrderId: string; amount: number; tax: number; status: string; createdAt: string } | undefined;
  try {
    const db = await getDb();
    [payment] = await db.select().from(paymentOrders).where(and(eq(paymentOrders.id, id), eq(paymentOrders.ownerEmail, user.email))).limit(1);
    [invoice] = await db.select().from(invoices).where(and(eq(invoices.paymentOrderId, id), eq(invoices.ownerEmail, user.email))).limit(1);
  } catch { notFound(); }
  if (!payment || !invoice) notFound();
  const amount = payment.amount;
  const date = new Intl.DateTimeFormat("id-ID", { dateStyle: "long", timeZone: "Asia/Jakarta" }).format(new Date(payment.createdAt));
  return <main className="invoice-page"><div className="invoice-actions"><a href="/dashboard/transactions">← Kembali</a><PrintButton/></div><article className="invoice-sheet"><header><a className="brand" href="/"><span className="brand-mark"><i/><i/><i/></span><span>Ijat<span>LLM</span></span></a><div><span>INVOICE</span><h1>{invoice.id}</h1><small>Status: {invoice.status.toUpperCase()}</small></div></header><section className="invoice-meta"><div><span>DITERBITKAN UNTUK</span><b>{user.displayName}</b><p>{user.email}<br/>Indonesia</p></div><div><span>TANGGAL</span><b>{date}</b><span>REFERENSI PEMBAYARAN</span><code>{id}</code></div></section><table><thead><tr><th>DESKRIPSI</th><th>METODE</th><th>QTY</th><th>JUMLAH</th></tr></thead><tbody><tr><td><b>Top-up saldo IjatLLM</b><small>Saldo prabayar untuk penggunaan model AI</small></td><td>{payment.method}</td><td>1</td><td>{rupiah(amount)}</td></tr></tbody></table><div className="invoice-total"><span>Subtotal <b>{rupiah(amount)}</b></span><span>Pajak <b>{rupiah(invoice.tax)}</b></span><span>Total pembayaran <b>{rupiah(amount + invoice.tax)}</b></span></div><footer><p>Terima kasih telah menggunakan IjatLLM.</p><span>Invoice dibuat otomatis dari status transaksi. Dokumen PAID menjadi bukti transaksi elektronik.</span><div><b>support@ijat.ai</b><b>https://ijat.ai</b></div></footer></article></main>
}
