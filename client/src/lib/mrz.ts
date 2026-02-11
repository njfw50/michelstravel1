export interface MRZResult {
  documentType: "passport" | "id_card" | "travel_doc";
  surname: string;
  givenNames: string;
  documentNumber: string;
  nationality: string;
  dateOfBirth: string;
  gender: "m" | "f" | "";
  expiryDate: string;
  issuingCountry: string;
  confidence: number;
  warnings: string[];
}

const CHECK_DIGIT_WEIGHTS = [7, 3, 1];

function computeCheckDigit(input: string): number {
  let sum = 0;
  for (let i = 0; i < input.length; i++) {
    let val = 0;
    const c = input[i];
    if (c >= "0" && c <= "9") {
      val = parseInt(c);
    } else if (c >= "A" && c <= "Z") {
      val = c.charCodeAt(0) - 55;
    } else {
      val = 0;
    }
    sum += val * CHECK_DIGIT_WEIGHTS[i % 3];
  }
  return sum % 10;
}

function validateCheckDigit(field: string, checkDigit: string): boolean {
  if (!/^\d$/.test(checkDigit)) return false;
  return computeCheckDigit(field) === parseInt(checkDigit);
}

function parseMRZDate(raw: string): string {
  if (raw.length !== 6) return "";
  const yy = parseInt(raw.substring(0, 2));
  const mm = raw.substring(2, 4);
  const dd = raw.substring(4, 6);
  const currentYear = new Date().getFullYear() % 100;
  const century = yy > currentYear ? "19" : "20";
  return `${century}${raw.substring(0, 2)}-${mm}-${dd}`;
}

function parseMRZDateForBirth(raw: string): string {
  if (raw.length !== 6) return "";
  const yy = parseInt(raw.substring(0, 2));
  const mm = raw.substring(2, 4);
  const dd = raw.substring(4, 6);
  const currentYear = new Date().getFullYear() % 100;
  const century = yy > (currentYear + 10) ? "19" : "20";
  return `${century}${raw.substring(0, 2)}-${mm}-${dd}`;
}

function cleanName(raw: string): string {
  return raw
    .replace(/<+/g, " ")
    .trim()
    .split(/\s+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
}

function normalizeMRZLine(line: string): string {
  return line
    .replace(/\s/g, "")
    .toUpperCase()
    .replace(/[^A-Z0-9<]/g, (ch) => {
      if (ch === "«" || ch === "‹") return "<";
      return "<";
    });
}

function parseMRZGender(ch: string): "m" | "f" | "" {
  if (ch === "M") return "m";
  if (ch === "F") return "f";
  return "";
}

function parseTD3(lines: string[]): MRZResult | null {
  const line1 = normalizeMRZLine(lines[0]);
  const line2 = normalizeMRZLine(lines[1]);

  if (line1.length < 44 || line2.length < 44) return null;

  const warnings: string[] = [];
  const docType = line1.substring(0, 1);
  if (docType !== "P") warnings.push("unexpected_doc_type");

  const issuingCountry = line1.substring(2, 5).replace(/</g, "");
  const nameField = line1.substring(5, 44);
  const nameParts = nameField.split("<<");
  const surname = cleanName(nameParts[0] || "");
  const givenNames = cleanName(nameParts.slice(1).join(" ") || "");

  const docNumber = line2.substring(0, 9).replace(/</g, "");
  const docCheckDigit = line2.substring(9, 10);
  if (!validateCheckDigit(line2.substring(0, 9), docCheckDigit)) {
    warnings.push("doc_number_check_failed");
  }

  const nationality = line2.substring(10, 13).replace(/</g, "");
  const birthRaw = line2.substring(13, 19);
  const birthCheckDigit = line2.substring(19, 20);
  if (!validateCheckDigit(birthRaw, birthCheckDigit)) {
    warnings.push("birth_date_check_failed");
  }

  const gender = parseMRZGender(line2.substring(20, 21));
  const expiryRaw = line2.substring(21, 27);
  const expiryCheckDigit = line2.substring(27, 28);
  if (!validateCheckDigit(expiryRaw, expiryCheckDigit)) {
    warnings.push("expiry_date_check_failed");
  }

  const dateOfBirth = parseMRZDateForBirth(birthRaw);
  const expiryDate = parseMRZDate(expiryRaw);

  let confidence = 100;
  confidence -= warnings.length * 10;
  if (!surname) confidence -= 20;
  if (!givenNames) confidence -= 20;

  return {
    documentType: "passport",
    surname,
    givenNames,
    documentNumber: docNumber,
    nationality,
    dateOfBirth,
    gender,
    expiryDate,
    issuingCountry,
    confidence: Math.max(0, confidence),
    warnings,
  };
}

function parseTD1(lines: string[]): MRZResult | null {
  const line1 = normalizeMRZLine(lines[0]);
  const line2 = normalizeMRZLine(lines[1]);
  const line3 = normalizeMRZLine(lines[2]);

  if (line1.length < 30 || line2.length < 30 || line3.length < 30) return null;

  const warnings: string[] = [];

  const docTypeRaw = line1.substring(0, 2);
  const issuingCountry = line1.substring(2, 5).replace(/</g, "");
  const docNumber = line1.substring(5, 14).replace(/</g, "");
  const docCheckDigit = line1.substring(14, 15);
  if (!validateCheckDigit(line1.substring(5, 14), docCheckDigit)) {
    warnings.push("doc_number_check_failed");
  }

  const birthRaw = line2.substring(0, 6);
  const birthCheckDigit = line2.substring(6, 7);
  if (!validateCheckDigit(birthRaw, birthCheckDigit)) {
    warnings.push("birth_date_check_failed");
  }

  const gender = parseMRZGender(line2.substring(7, 8));
  const expiryRaw = line2.substring(8, 14);
  const expiryCheckDigit = line2.substring(14, 15);
  if (!validateCheckDigit(expiryRaw, expiryCheckDigit)) {
    warnings.push("expiry_date_check_failed");
  }

  const nationality = line2.substring(15, 18).replace(/</g, "");

  const nameField = line3.substring(0, 30);
  const nameParts = nameField.split("<<");
  const surname = cleanName(nameParts[0] || "");
  const givenNames = cleanName(nameParts.slice(1).join(" ") || "");

  const dateOfBirth = parseMRZDateForBirth(birthRaw);
  const expiryDate = parseMRZDate(expiryRaw);

  let confidence = 100;
  confidence -= warnings.length * 10;
  if (!surname) confidence -= 20;
  if (!givenNames) confidence -= 20;

  const documentType = docTypeRaw.startsWith("I") ? "id_card" : "travel_doc";

  return {
    documentType,
    surname,
    givenNames,
    documentNumber: docNumber,
    nationality,
    dateOfBirth,
    gender,
    expiryDate,
    issuingCountry,
    confidence: Math.max(0, confidence),
    warnings,
  };
}

function parseTD2(lines: string[]): MRZResult | null {
  const line1 = normalizeMRZLine(lines[0]);
  const line2 = normalizeMRZLine(lines[1]);

  if (line1.length < 36 || line2.length < 36) return null;

  const warnings: string[] = [];

  const issuingCountry = line1.substring(2, 5).replace(/</g, "");
  const nameField = line1.substring(5, 36);
  const nameParts = nameField.split("<<");
  const surname = cleanName(nameParts[0] || "");
  const givenNames = cleanName(nameParts.slice(1).join(" ") || "");

  const docNumber = line2.substring(0, 9).replace(/</g, "");
  const docCheckDigit = line2.substring(9, 10);
  if (!validateCheckDigit(line2.substring(0, 9), docCheckDigit)) {
    warnings.push("doc_number_check_failed");
  }

  const nationality = line2.substring(10, 13).replace(/</g, "");
  const birthRaw = line2.substring(13, 19);
  const birthCheckDigit = line2.substring(19, 20);
  if (!validateCheckDigit(birthRaw, birthCheckDigit)) {
    warnings.push("birth_date_check_failed");
  }

  const gender = parseMRZGender(line2.substring(20, 21));
  const expiryRaw = line2.substring(21, 27);
  const expiryCheckDigit = line2.substring(27, 28);
  if (!validateCheckDigit(expiryRaw, expiryCheckDigit)) {
    warnings.push("expiry_date_check_failed");
  }

  const dateOfBirth = parseMRZDateForBirth(birthRaw);
  const expiryDate = parseMRZDate(expiryRaw);

  let confidence = 100;
  confidence -= warnings.length * 10;
  if (!surname) confidence -= 20;
  if (!givenNames) confidence -= 20;

  return {
    documentType: "travel_doc",
    surname,
    givenNames,
    documentNumber: docNumber,
    nationality,
    dateOfBirth,
    gender,
    expiryDate,
    issuingCountry,
    confidence: Math.max(0, confidence),
    warnings,
  };
}

export function extractMRZLines(ocrText: string): string[] {
  const allLines = ocrText.split("\n").map((l) => l.trim()).filter((l) => l.length > 0);

  const mrzCandidates = allLines.filter((line) => {
    const cleaned = line.replace(/\s/g, "");
    const mrzChars = cleaned.replace(/[^A-Z0-9<«‹]/gi, "").length;
    return cleaned.length >= 28 && mrzChars / cleaned.length > 0.75;
  });

  const normalized = mrzCandidates.map((l) => normalizeMRZLine(l));

  if (normalized.length >= 3) {
    const td1Candidates = normalized.filter((l) => l.length >= 28 && l.length <= 34);
    if (td1Candidates.length >= 3) {
      return td1Candidates.slice(-3);
    }
  }

  if (normalized.length >= 2) {
    const td3Candidates = normalized.filter((l) => l.length >= 42 && l.length <= 48);
    if (td3Candidates.length >= 2) {
      return td3Candidates.slice(-2);
    }

    const td2Candidates = normalized.filter((l) => l.length >= 34 && l.length <= 40);
    if (td2Candidates.length >= 2) {
      return td2Candidates.slice(-2);
    }
  }

  return normalized.slice(-3);
}

export function parseMRZ(ocrText: string): MRZResult | null {
  const lines = extractMRZLines(ocrText);

  if (lines.length >= 2) {
    const l1 = lines[lines.length - 2];
    const l2 = lines[lines.length - 1];

    if (l1.length >= 44 && l2.length >= 44) {
      const result = parseTD3([l1, l2]);
      if (result && result.surname) return result;
    }

    if (l1.length >= 36 && l2.length >= 36 && l1.length < 44) {
      const result = parseTD2([l1, l2]);
      if (result && result.surname) return result;
    }
  }

  if (lines.length >= 3) {
    const l1 = lines[lines.length - 3];
    const l2 = lines[lines.length - 2];
    const l3 = lines[lines.length - 1];

    if (l1.length >= 30 && l2.length >= 30 && l3.length >= 30) {
      const result = parseTD1([l1, l2, l3]);
      if (result && result.surname) return result;
    }
  }

  if (lines.length >= 2) {
    const result = parseTD3(lines.slice(0, 2));
    if (result && result.surname) return result;
  }

  return null;
}
