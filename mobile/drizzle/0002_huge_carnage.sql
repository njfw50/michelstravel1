CREATE TABLE `bookings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`clientName` varchar(255) NOT NULL,
	`clientEmail` varchar(320) NOT NULL,
	`clientPhone` varchar(50),
	`flightNumber` varchar(50) NOT NULL,
	`airline` varchar(100) NOT NULL,
	`origin` varchar(100) NOT NULL,
	`destination` varchar(100) NOT NULL,
	`departureDate` timestamp NOT NULL,
	`returnDate` timestamp,
	`basePrice` varchar(20) NOT NULL,
	`commission` varchar(20) NOT NULL,
	`totalPrice` varchar(20) NOT NULL,
	`currency` varchar(3) NOT NULL DEFAULT 'BRL',
	`status` enum('pending','confirmed','cancelled','completed') NOT NULL DEFAULT 'pending',
	`paymentStatus` enum('pending','paid','refunded') NOT NULL DEFAULT 'pending',
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`confirmedAt` timestamp,
	`cancelledAt` timestamp,
	CONSTRAINT `bookings_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `conversations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`bookingId` int,
	`clientName` varchar(255) NOT NULL,
	`clientEmail` varchar(320),
	`clientPhone` varchar(50),
	`status` enum('open','closed','archived') NOT NULL DEFAULT 'open',
	`unreadCount` int NOT NULL DEFAULT 0,
	`lastMessageAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `conversations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `escalations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`type` enum('booking_issue','payment_issue','customer_complaint','technical_issue','other') NOT NULL,
	`priority` enum('low','medium','high','urgent') NOT NULL DEFAULT 'medium',
	`status` enum('pending','in_progress','resolved','cancelled') NOT NULL DEFAULT 'pending',
	`bookingId` int,
	`conversationId` int,
	`title` varchar(255) NOT NULL,
	`description` text NOT NULL,
	`assignedToUserId` int,
	`resolvedByUserId` int,
	`resolution` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`resolvedAt` timestamp,
	CONSTRAINT `escalations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `messages` (
	`id` int AUTO_INCREMENT NOT NULL,
	`conversationId` int NOT NULL,
	`senderId` int,
	`senderType` enum('agent','client') NOT NULL,
	`senderName` varchar(255) NOT NULL,
	`content` text NOT NULL,
	`messageType` enum('text','image','file') NOT NULL DEFAULT 'text',
	`attachmentUrl` text,
	`isRead` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `messages_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `payments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`bookingId` int NOT NULL,
	`userId` int NOT NULL,
	`amount` varchar(20) NOT NULL,
	`currency` varchar(3) NOT NULL DEFAULT 'BRL',
	`paymentMethod` enum('credit_card','debit_card','pix','bank_transfer','cash') NOT NULL,
	`status` enum('pending','completed','failed','refunded') NOT NULL DEFAULT 'pending',
	`stripePaymentIntentId` varchar(255),
	`stripeChargeId` varchar(255),
	`transactionId` varchar(255),
	`receiptUrl` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`completedAt` timestamp,
	CONSTRAINT `payments_id` PRIMARY KEY(`id`)
);
