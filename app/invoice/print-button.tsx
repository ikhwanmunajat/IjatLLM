"use client";

export default function PrintButton() {
  return <button className="invoice-print" onClick={() => window.print()}>Cetak / Simpan PDF</button>;
}
