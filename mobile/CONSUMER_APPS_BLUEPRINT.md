# Consumer Apps Blueprint

## Scope

This document defines the execution blueprint for the Michels Travel customer apps:

- `Michels Travel` for the standard customer journey.
- `Michels Senior` for the simplified senior journey.

It intentionally does **not** replace the existing admin mobile app in [`mobile/README_MOBILE.md`](C:/Users/njfw2/michelstravel1/mobile/README_MOBILE.md). The current `mobile/` Expo project is positioned as an internal/admin tool. The customer apps should be built as a separate mobile product line.

## Product Decision

Use one shared consumer-mobile codebase with two build variants:

- `standard`
- `senior`

Use one shared backend and one shared customer account system. Do not create separate customer databases for standard vs senior.

## Repository Direction

Keep the current folders as follows:

- `client/` remains the public acquisition website.
- `server/` remains the main Express backend for public booking, search, chat, and checkout.
- `mobile/` remains the admin/internal mobile workspace.

Create a new customer app workspace:

```text
mobile-customer/
  app/
    (auth)/
      login.tsx
      activate-device.tsx
    (standard)/
      _layout.tsx
      index.tsx
      search.tsx
      trips.tsx
      profile.tsx
      mia.tsx
    (senior)/
      _layout.tsx
      index.tsx
      planner.tsx
      trips.tsx
      documents.tsx
      help.tsx
    scan/
      [sessionId].tsx
      review.tsx
      success.tsx
    booking/
      [bookingId].tsx
      passengers.tsx
      payment.tsx
    _layout.tsx
  src/
    features/
      auth/
      home/
      search/
      trips/
      documents/
      scanner/
      mia/
      senior/
    components/
      ui/
      cards/
      scanner/
      senior/
    lib/
      api/
      auth/
      deep-links/
      notifications/
      biometrics/
      theme/
    store/
      auth-store.ts
      booking-store.ts
      scanner-store.ts
      preferences-store.ts
    types/
  assets/
  app.config.ts
  eas.json
  package.json
```

## Build Variants

Use one codebase with branded variants:

- `Michels Travel`
  - default experience mode: `standard`
  - default home: search-first
  - fuller navigation and denser itinerary detail
- `Michels Senior`
  - default experience mode: `senior`
  - default home: continue trip, scan document, talk to Mia, ask for human help
  - calmer copy, larger touch targets, progressive disclosure

Variant configuration should live in:

- `src/lib/theme/brand.ts`
- `src/lib/config/app-variant.ts`
- native bundle identifiers / application IDs

Recommended identifiers:

- iOS standard: `agency.michelstravel.app`
- iOS senior: `agency.michelstravel.senior`
- Android standard: `agency.michelstravel.app`
- Android senior: `agency.michelstravel.senior`

Samsung Galaxy Store should ship the Android builds, with Samsung-specific layout improvements for large screens, foldables, and DeX-friendly states where relevant.

## Backend Separation

The existing admin mobile API already uses `/api/mobile/*` inside the current mobile admin system. To avoid collisions, customer apps should use a dedicated namespace:

```text
/api/mobile/customer/*
```

Keep admin routes and customer routes isolated.

## Authentication Model

### Web

Keep the current web auth session model in:

- [`server/replit_integrations/auth/replitAuth.ts`](C:/Users/njfw2/michelstravel1/server/replit_integrations/auth/replitAuth.ts)
- [`client/src/hooks/use-auth.ts`](C:/Users/njfw2/michelstravel1/client/src/hooks/use-auth.ts)

### Mobile

Add a token-based mobile layer for customer apps:

- short-lived access token
- rotating refresh token
- trusted device binding
- optional biometric unlock after first login

Do not store the customer password in plaintext on-device.

### First Login

Support these paths:

- email + password
- future magic-link flow
- future assisted senior activation by link / code

### Post-Login

After the first successful login:

- store refresh token securely
- unlock app via Face ID / Touch ID / Android biometrics or device PIN
- auto-resume last customer state

## Customer Profile Model

Persist the customer travel mode and preferences on the main backend.

Key profile fields:

- `experience_mode`
- `preferred_language`
- `preferred_airport`
- `saved_passengers`
- `connection_tolerance`
- `bags_preference`
- `needs_human_help`
- `biometric_enabled`
- `scanner_handoff_enabled`
- `last_active_booking_id`
- `last_active_offer_id`

This enables the senior app to open directly in the right state without rebuilding the flow every time.

## Scanner Reform

The web scanner already exists in:

- [`client/src/components/ScanDocumentDialog.tsx`](C:/Users/njfw2/michelstravel1/client/src/components/ScanDocumentDialog.tsx)
- [`client/src/pages/Booking.tsx`](C:/Users/njfw2/michelstravel1/client/src/pages/Booking.tsx)

Keep the current web OCR path as fallback. The new preferred path is cross-device document scanning.

### Target Flow

1. Customer is on desktop web booking.
2. Customer clicks `Scan with my phone`.
3. Backend creates a `document_scan_session`.
4. Web booking shows:
   - QR code
   - pairing code
   - deep-link button
5. Customer opens the app on the phone.
6. App pairs to the scan session.
7. App launches native scanner flow.
8. Customer reviews extracted data.
9. App confirms the scan.
10. Desktop booking receives the result live and autofills the passenger document fields.

### Native Capture

- iPhone: `VisionKit`
- Android: `ML Kit Document Scanner`
- Web fallback: current `Tesseract + MRZ parsing`

### Required Scanner States

- `pending_pair`
- `paired`
- `capturing`
- `uploaded`
- `confirmed`
- `expired`
- `cancelled`

## Customer Mobile Route Map

### Auth

- `POST /api/mobile/customer/auth/login`
- `POST /api/mobile/customer/auth/refresh`
- `POST /api/mobile/customer/auth/logout`
- `GET /api/mobile/customer/me`
- `POST /api/mobile/customer/devices/register`
- `POST /api/mobile/customer/devices/:deviceId/revoke`

### Profile

- `GET /api/mobile/customer/profile`
- `PATCH /api/mobile/customer/profile`

### Home and Preferences

- `GET /api/mobile/customer/home`
- `GET /api/mobile/customer/preferences`
- `PATCH /api/mobile/customer/preferences`

### Trips

- `GET /api/mobile/customer/trips`
- `GET /api/mobile/customer/trips/:bookingId`

### Search and Booking

- `GET /api/mobile/customer/search-presets`
- `POST /api/mobile/customer/search`
- `GET /api/mobile/customer/offers/:offerId`
- `POST /api/mobile/customer/bookings/:bookingId/passengers`
- `POST /api/mobile/customer/bookings/:bookingId/payment-intent`

### Scanner

- `POST /api/mobile/customer/scan-sessions`
- `GET /api/mobile/customer/scan-sessions/:sessionId`
- `POST /api/mobile/customer/scan-sessions/:sessionId/pair`
- `POST /api/mobile/customer/scan-sessions/:sessionId/images`
- `POST /api/mobile/customer/scan-sessions/:sessionId/confirm`
- `GET /api/mobile/customer/scan-sessions/:sessionId/events`

### Mia / Support

- `POST /api/mobile/customer/mia/start`
- `POST /api/mobile/customer/mia/message`
- `POST /api/mobile/customer/live-help/request`

## Deep Links

Support both custom scheme and universal/app links.

Examples:

- `michelstravel://scan/<sessionId>`
- `michelstravelsenior://scan/<sessionId>`
- `https://www.michelstravel.agency/scan/<pairingCode>`
- `https://www.michelstravel.agency/senior/scan/<pairingCode>`

Use:

- Universal Links on iOS
- Android App Links on Android

## App Home Screens

### Standard

- Search flights
- View featured deals
- Open Mia
- My trips
- Profile

### Senior

- Continue my trip
- Search calmly
- Scan my document
- Talk to Mia
- Talk to a human
- My trips

The senior home should prioritize continuity, clarity, and fewer decisions.

## Push Notifications

Register one push token per trusted device.

Important mobile push events:

- booking payment ready
- booking confirmed
- schedule change
- scan requested from desktop
- Mia follow-up
- human assistance reply

## Rollout Order

### Phase 1

- main-backend customer mobile auth
- customer preferences
- trusted devices

### Phase 2

- document scan sessions
- desktop-to-phone pairing
- native scan capture in app

### Phase 3

- `Michels Senior` app first
- continue-trip home
- trips
- scanner
- Mia

### Phase 4

- `Michels Travel` app
- full customer search flow
- profile and saved passengers

### Phase 5

- App Store release
- Google Play release
- Galaxy Store release

## Store Strategy

- App Store: both variants
- Google Play: both variants
- Galaxy Store: Android builds, same codebase, Samsung-optimized polish where relevant

## Notes on the Existing Mobile Folder

The current `mobile/` project is an internal/admin mobile surface. Do not try to evolve it directly into the customer travel app. Keep it as:

- admin dashboard
- live operations
- analytics
- internal messaging

Build the customer apps as a separate mobile workspace to avoid mixing:

- admin auth
- agent roles
- customer booking journeys
- senior UX

