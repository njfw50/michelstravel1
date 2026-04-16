import fs from 'fs/promises';
import path from 'path';

export interface AuditResult {
  totalKeys: number;
  coverage: {
    pt: number;
    en: number;
    es: number;
  };
  missingKeys: {
    en: string[];
    es: string[];
  };
}

/**
 * Audit i18n JSON files to find missing keys across languages.
 * Follows Law 06 (Robustness) by ensuring all users get strings.
 */
export async function auditTranslations(): Promise<AuditResult> {
  const localesPath = path.join(process.cwd(), 'client', 'src', 'locales');
  
  try {
    const ptRaw = await fs.readFile(path.join(localesPath, 'pt.json'), 'utf-8');
    const enRaw = await fs.readFile(path.join(localesPath, 'en.json'), 'utf-8');
    const esRaw = await fs.readFile(path.join(localesPath, 'es.json'), 'utf-8');

    const pt = JSON.parse(ptRaw);
    const en = JSON.parse(enRaw);
    const es = JSON.parse(esRaw);

    const getAllKeys = (obj: any, prefix = ''): string[] => {
      return Object.keys(obj).reduce((res: string[], el) => {
        if (Array.isArray(obj[el])) {
          return res;
        } else if (typeof obj[el] === 'object' && obj[el] !== null) {
          return [...res, ...getAllKeys(obj[el], prefix + el + '.')];
        }
        return [...res, prefix + el];
      }, []);
    };

    const ptKeys = getAllKeys(pt);
    const enKeys = new Set(getAllKeys(en));
    const esKeys = new Set(getAllKeys(es));

    const missingEn = ptKeys.filter(k => !enKeys.has(k));
    const missingEs = ptKeys.filter(k => !esKeys.has(k));

    const total = ptKeys.length;

    return {
      totalKeys: total,
      coverage: {
        pt: 100,
        en: Math.round(((total - missingEn.length) / total) * 100),
        es: Math.round(((total - missingEs.length) / total) * 100),
      },
      missingKeys: {
        en: missingEn,
        es: missingEs,
      }
    };
  } catch (error) {
    console.error('[I18N AUDIT] Error reading translation files:', error);
    throw new Error('Failed to audit translations');
  }
}
