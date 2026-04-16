import fs from 'fs/promises';
import path from 'path';

/**
 * Audit service to check for missing translation keys across supported languages.
 * Primarily ensures parity between PT (base) and secondary languages (EN, ES).
 */

interface AuditReport {
  language: string;
  missingKeys: string[];
  coverage: number;
}

export async function auditTranslations(): Promise<AuditReport[]> {
  const localesPath = path.resolve(process.cwd(), 'client', 'src', 'locales');
  const baseLang = 'pt';
  const targetLangs = ['en', 'es'];

  try {
    const baseContent = await fs.readFile(path.join(localesPath, `${baseLang}.json`), 'utf-8');
    const baseJson = JSON.parse(baseContent);
    const baseKeys = getAllKeys(baseJson);

    const reports: AuditReport[] = [];

    for (const lang of targetLangs) {
      const content = await fs.readFile(path.join(localesPath, `${lang}.json`), 'utf-8');
      const json = JSON.parse(content);
      const keys = getAllKeys(json);

      const missingKeys = baseKeys.filter(key => !keys.includes(key));
      const totalBaseKeys = baseKeys.length;
      const coverage = totalBaseKeys > 0 ? ((totalBaseKeys - missingKeys.length) / totalBaseKeys) * 100 : 100;

      reports.push({
        language: lang,
        missingKeys,
        coverage: Math.round(coverage * 100) / 100
      });
    }

    return reports;
  } catch (error) {
    console.error('[I18n Audit] Failed to perform translation audit:', error);
    throw error;
  }
}

/**
 * Recursively retrieves all keys from a nested JSON object in dot notation.
 */
function getAllKeys(obj: any, prefix = ''): string[] {
  return Object.keys(obj).reduce((res: string[], el: string) => {
    const name = prefix ? `${prefix}.${el}` : el;
    if (typeof obj[el] === 'object' && obj[el] !== null && !Array.isArray(obj[el])) {
      res.push(...getAllKeys(obj[el], name));
    } else {
      res.push(name);
    }
    return res;
  }, []);
}
