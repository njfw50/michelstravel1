const REDACTED_DOCUMENT_FIELDS = [
  "documentNumber",
  "documentExpiryDate",
  "documentIssuingCountry",
  "passportNumber",
  "passportExpiryDate",
  "passportIssuingCountry",
  "identityDocuments",
  "identity_documents",
] as const;

type PassengerLike = Record<string, any>;

export function sanitizePassengerForRetention(passenger: PassengerLike) {
  if (!passenger || typeof passenger !== "object") {
    return passenger;
  }

  const sanitized = { ...passenger };

  for (const field of REDACTED_DOCUMENT_FIELDS) {
    delete sanitized[field];
  }

  return sanitized;
}

export function sanitizePassengersForRetention(passengers: PassengerLike[] | null | undefined) {
  if (!Array.isArray(passengers)) {
    return [];
  }

  return passengers.map(sanitizePassengerForRetention);
}

export function buildRedactedDocumentPayload(passengers: PassengerLike[] | null | undefined) {
  return {
    passengers: sanitizePassengersForRetention(passengers),
    sensitiveFieldsRemoved: [...REDACTED_DOCUMENT_FIELDS],
    redactedAt: new Date().toISOString(),
  };
}
