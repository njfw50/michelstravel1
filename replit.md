# Michels Travel - Flight Booking Platform

## Overview

Michels Travel is a full-stack flight booking platform designed for Brazilian/Portuguese-speaking customers, with multi-language support. It enables users to search, book, and manage flights, integrating with the Duffel API for real-time data and Stripe for payments. The platform operates on a commission-based model, featuring an admin dashboard for business oversight and an AI chatbot for customer support. A key component is the live sales session feature, allowing administrators to assist customers in real-time, sharing custom flight offers, and managing the booking workflow.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend
- **Technology**: React 18 with TypeScript, Vite, Wouter for routing, TanStack React Query for state management.
- **UI/UX**: shadcn/ui (new-york style) with Radix UI, Tailwind CSS, Framer Motion for animations.
- **Theming**: Light Venmo-inspired design with a blue/white color scheme, Outfit (display) and DM Sans (body) fonts.
- **Internationalization**: Custom i18n system for pt/en/es.
- **Admin Mobile App**: PWA (`/atendimento`) for real-time customer support, using JWT for authentication.

### Backend
- **Technology**: Express.js on Node.js with TypeScript, Drizzle ORM for PostgreSQL.
- **API**: RESTful JSON API with Zod schemas for validation.
- **Authentication**: Replit Auth via OpenID Connect (OIDC) with Passport.js, session-based storage in PostgreSQL.
- **Data Models**: Key models include `users`, `bookings`, `flight_searches`, `site_settings`, `blog_posts`, `live_sessions`, `conversations`, and `messages`.
- **Commission System**: A default 8.5% commission rate is applied server-side to all flight prices, configurable via the Admin Dashboard.

### Core Features
- **Flight Search & Booking**: Real-time flight search, offer requests, and booking through Duffel API.
- **Payment Processing**: Stripe integration for secure payments using Payment Intents and Elements.
- **Ancillary Services**: Support for baggage selection and loyalty programs.
- **Booking Management**: User-facing "My Trips" and admin dashboard for managing bookings, cancellations, and refunds.
- **AI Chatbot**: "Mia" provides multi-language customer support, capable of escalating issues to human agents and notifying admins via email.
- **Live Sales Sessions**: A comprehensive platform for admins to engage with customers in real-time, share customized flight offers, and manage a guided booking workflow with secret price editing and selective sharing.
- **Email Service**: Nodemailer for sending booking confirmations.
- **SEO**: Dynamic sitemap, robots.txt, `react-helmet-async` for per-page SEO, and structured data.

## External Dependencies

-   **Duffel API**: For real-time flight search, offer requests, order cancellation, and ancillary services.
-   **Stripe**: For processing all payments, including flight bookings and managing webhooks.
-   **PostgreSQL Database**: Primary data store for all application data, sessions, and synchronized Stripe product/price data.
-   **Replit Auth**: OpenID Connect provider for user authentication.
-   **Nodemailer**: For sending email notifications and booking confirmations.
-   **Replit AI Integrations**: Used for the AI chatbot "Mia" (OpenAI-compatible, gpt-5-nano model).