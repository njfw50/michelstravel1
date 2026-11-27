// Legacy result shape retained for the document merge contract; parser remains disabled.
export interface MRZResult {
  givenNames: string;
  surname: string;
  dateOfBirth: string;
  gender: "m" | "f" | "";
  documentNumber: string;
  expiryDate: string;
  nationality: string;
  issuingCountry: string;
  documentType: string;
  confidence: number;
  warnings: string[];
}
// REMOVED: MRZ Parser is deprecated.
export const parseMRZ = () => null;
