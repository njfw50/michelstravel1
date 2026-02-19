CREATE TABLE `mobile_activity_log` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`action` varchar(100) NOT NULL,
	`entityType` varchar(50),
	`entityId` int,
	`details` text,
	`ipAddress` varchar(45),
	`userAgent` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `mobile_activity_log_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `mobile_sessions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`accessToken` varchar(500) NOT NULL,
	`refreshToken` varchar(500) NOT NULL,
	`expiresAt` timestamp NOT NULL,
	`refreshExpiresAt` timestamp NOT NULL,
	`deviceInfo` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`lastActivityAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `mobile_sessions_id` PRIMARY KEY(`id`),
	CONSTRAINT `mobile_sessions_accessToken_unique` UNIQUE(`accessToken`),
	CONSTRAINT `mobile_sessions_refreshToken_unique` UNIQUE(`refreshToken`)
);
--> statement-breakpoint
CREATE TABLE `mobile_users` (
	`id` int AUTO_INCREMENT NOT NULL,
	`email` varchar(320) NOT NULL,
	`passwordHash` varchar(255) NOT NULL,
	`name` varchar(255) NOT NULL,
	`role` enum('admin','agent') NOT NULL DEFAULT 'agent',
	`active` int NOT NULL DEFAULT 1,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`lastLoginAt` timestamp,
	CONSTRAINT `mobile_users_id` PRIMARY KEY(`id`),
	CONSTRAINT `mobile_users_email_unique` UNIQUE(`email`)
);
--> statement-breakpoint
CREATE TABLE `push_tokens` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`token` varchar(500) NOT NULL,
	`platform` enum('android','ios','web') NOT NULL,
	`active` int NOT NULL DEFAULT 1,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `push_tokens_id` PRIMARY KEY(`id`),
	CONSTRAINT `push_tokens_token_unique` UNIQUE(`token`)
);
