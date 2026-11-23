CREATE TABLE `availability_slots` (
	`id` text PRIMARY KEY NOT NULL,
	`weekday` integer NOT NULL,
	`local_time` text NOT NULL,
	`active` integer DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `availability_weekday_time_unique` ON `availability_slots` (`weekday`,`local_time`);--> statement-breakpoint
CREATE TABLE `booking_requests` (
	`id` text PRIMARY KEY NOT NULL,
	`service_id` text NOT NULL,
	`session_date` text NOT NULL,
	`session_time` text NOT NULL,
	`encrypted_payload` text NOT NULL,
	`status` text DEFAULT 'REQUESTED' NOT NULL,
	`payment_status` text DEFAULT 'NOT_REQUIRED' NOT NULL,
	`payment_provider` text,
	`payment_reference` text,
	`meeting_provider` text,
	`meeting_url` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE INDEX `booking_requests_date_status_idx` ON `booking_requests` (`session_date`,`status`);--> statement-breakpoint
CREATE UNIQUE INDEX `booking_requests_active_slot_unique` ON `booking_requests` (`session_date`,`session_time`) WHERE "booking_requests"."status" IN ('REQUESTED', 'CONFIRMED');--> statement-breakpoint
CREATE TABLE `faqs` (
	`id` text PRIMARY KEY NOT NULL,
	`question` text NOT NULL,
	`answer` text NOT NULL,
	`published` integer DEFAULT true NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE `policies` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`body` text NOT NULL,
	`published` integer DEFAULT true NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE `services` (
	`id` text PRIMARY KEY NOT NULL,
	`slug` text NOT NULL,
	`name` text NOT NULL,
	`description` text NOT NULL,
	`duration_minutes` integer NOT NULL,
	`price_rupees` real NOT NULL,
	`mode` text DEFAULT 'Online' NOT NULL,
	`active` integer DEFAULT true NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`external_payment_url` text
);
--> statement-breakpoint
CREATE UNIQUE INDEX `services_slug_unique` ON `services` (`slug`);--> statement-breakpoint
CREATE TABLE `site_settings` (
	`id` text PRIMARY KEY NOT NULL,
	`brand_name` text NOT NULL,
	`practitioner_name` text NOT NULL,
	`city` text NOT NULL,
	`contact_email` text NOT NULL,
	`contact_phone` text NOT NULL,
	`tagline` text NOT NULL,
	`hero_heading` text NOT NULL,
	`hero_copy` text NOT NULL,
	`about_heading` text NOT NULL,
	`about_copy` text NOT NULL,
	`demo_banner` text DEFAULT '' NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE `testimonials` (
	`id` text PRIMARY KEY NOT NULL,
	`quote` text NOT NULL,
	`attribution` text NOT NULL,
	`published` integer DEFAULT false NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL
);
