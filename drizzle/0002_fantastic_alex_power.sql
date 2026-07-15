CREATE TABLE `workspace_members` (
	`id` text PRIMARY KEY NOT NULL,
	`workspace_id` text NOT NULL,
	`name` text NOT NULL,
	`email` text NOT NULL,
	`role` text DEFAULT 'developer' NOT NULL,
	`status` text DEFAULT 'invited' NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE `workspaces` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`owner_email` text NOT NULL,
	`budget` integer DEFAULT 500000 NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
ALTER TABLE `api_keys` ADD `owner_email` text DEFAULT 'legacy@ijat.ai' NOT NULL;--> statement-breakpoint
ALTER TABLE `audit_logs` ADD `owner_email` text DEFAULT 'legacy@ijat.ai' NOT NULL;--> statement-breakpoint
ALTER TABLE `invoices` ADD `owner_email` text DEFAULT 'legacy@ijat.ai' NOT NULL;--> statement-breakpoint
ALTER TABLE `notifications` ADD `owner_email` text DEFAULT 'legacy@ijat.ai' NOT NULL;--> statement-breakpoint
ALTER TABLE `payment_orders` ADD `owner_email` text DEFAULT 'legacy@ijat.ai' NOT NULL;--> statement-breakpoint
ALTER TABLE `support_tickets` ADD `owner_email` text DEFAULT 'legacy@ijat.ai' NOT NULL;--> statement-breakpoint
ALTER TABLE `wallet_ledger` ADD `owner_email` text DEFAULT 'legacy@ijat.ai' NOT NULL;