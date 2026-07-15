import { sql } from "drizzle-orm";
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const apiKeys = sqliteTable("api_keys", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  prefix: text("prefix").notNull(),
  fingerprint: text("fingerprint").notNull().unique(),
  models: text("models").notNull().default("smart-fast"),
  budget: integer("budget").notNull().default(100000),
  rpm: integer("rpm").notNull().default(60),
  tpm: integer("tpm").notNull().default(100000),
  status: text("status").notNull().default("active"),
  origin: text("origin").notNull().default("sandbox"),
  ownerEmail: text("owner_email").notNull().default("legacy@ijat.ai"),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const walletLedger = sqliteTable("wallet_ledger", {
  id: text("id").primaryKey(),
  type: text("type").notNull(),
  amount: integer("amount").notNull(),
  reference: text("reference").notNull().unique(),
  note: text("note").notNull().default(""),
  ownerEmail: text("owner_email").notNull().default("legacy@ijat.ai"),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const paymentOrders = sqliteTable("payment_orders", {
  id: text("id").primaryKey(),
  amount: integer("amount").notNull(),
  method: text("method").notNull(),
  status: text("status").notNull().default("pending"),
  ownerEmail: text("owner_email").notNull().default("legacy@ijat.ai"),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const supportTickets = sqliteTable("support_tickets", {
  id: text("id").primaryKey(),
  subject: text("subject").notNull(),
  category: text("category").notNull(),
  priority: text("priority").notNull().default("normal"),
  status: text("status").notNull().default("open"),
  message: text("message").notNull(),
  ownerEmail: text("owner_email").notNull().default("legacy@ijat.ai"),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const invoices = sqliteTable("invoices", {
  id: text("id").primaryKey(),
  paymentOrderId: text("payment_order_id").notNull().unique(),
  amount: integer("amount").notNull(),
  tax: integer("tax").notNull().default(0),
  status: text("status").notNull().default("paid"),
  ownerEmail: text("owner_email").notNull().default("legacy@ijat.ai"),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const notifications = sqliteTable("notifications", {
  id: text("id").primaryKey(),
  type: text("type").notNull(),
  title: text("title").notNull(),
  message: text("message").notNull(),
  isRead: integer("is_read", { mode: "boolean" }).notNull().default(false),
  ownerEmail: text("owner_email").notNull().default("legacy@ijat.ai"),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const auditLogs = sqliteTable("audit_logs", {
  id: text("id").primaryKey(),
  action: text("action").notNull(),
  resourceType: text("resource_type").notNull(),
  resourceId: text("resource_id").notNull(),
  actor: text("actor").notNull().default("workspace-user"),
  ipMasked: text("ip_masked").notNull().default("•••.•••.•••.•••"),
  userAgent: text("user_agent").notNull().default("IjatLLM Web"),
  ownerEmail: text("owner_email").notNull().default("legacy@ijat.ai"),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const workspaces = sqliteTable("workspaces", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  ownerEmail: text("owner_email").notNull(),
  budget: integer("budget").notNull().default(500000),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const workspaceMembers = sqliteTable("workspace_members", {
  id: text("id").primaryKey(),
  workspaceId: text("workspace_id").notNull(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  role: text("role").notNull().default("developer"),
  status: text("status").notNull().default("invited"),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});
