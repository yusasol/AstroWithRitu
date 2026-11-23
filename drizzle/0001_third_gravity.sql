CREATE TABLE `blog_posts` (
	`id` text PRIMARY KEY NOT NULL,
	`slug` text NOT NULL,
	`title` text NOT NULL,
	`excerpt` text DEFAULT '' NOT NULL,
	`body` text NOT NULL,
	`video_url` text DEFAULT '' NOT NULL,
	`published` integer DEFAULT false NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `blog_posts_slug_unique` ON `blog_posts` (`slug`);--> statement-breakpoint
CREATE INDEX `blog_posts_published_created_idx` ON `blog_posts` (`published`,`created_at`);--> statement-breakpoint
CREATE TABLE `customers` (
	`id` text PRIMARY KEY NOT NULL,
	`contact_hash` text NOT NULL,
	`encrypted_payload` text NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `customers_contact_hash_unique` ON `customers` (`contact_hash`);--> statement-breakpoint
CREATE TABLE `feedback` (
	`id` text PRIMARY KEY NOT NULL,
	`encrypted_payload` text NOT NULL,
	`status` text DEFAULT 'PENDING' NOT NULL,
	`rating` integer NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`reviewed_at` text
);
--> statement-breakpoint
CREATE TABLE `payments` (
	`id` text PRIMARY KEY NOT NULL,
	`customer_id` text NOT NULL,
	`booking_id` text,
	`amount_rupees` integer NOT NULL,
	`method` text DEFAULT 'UPI' NOT NULL,
	`status` text DEFAULT 'PENDING' NOT NULL,
	`encrypted_reference` text DEFAULT '' NOT NULL,
	`note` text DEFAULT '' NOT NULL,
	`received_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`verified_at` text,
	FOREIGN KEY (`customer_id`) REFERENCES `customers`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`booking_id`) REFERENCES `booking_requests`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `payments_customer_received_idx` ON `payments` (`customer_id`,`received_at`);--> statement-breakpoint
CREATE INDEX `payments_status_idx` ON `payments` (`status`);--> statement-breakpoint
ALTER TABLE `booking_requests` ADD `customer_id` text REFERENCES customers(id);--> statement-breakpoint
ALTER TABLE `site_settings` ADD `instagram_url` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `site_settings` ADD `youtube_url` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `site_settings` ADD `featured_video_url` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `site_settings` ADD `upi_id` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `site_settings` ADD `consultation_location` text DEFAULT '' NOT NULL;