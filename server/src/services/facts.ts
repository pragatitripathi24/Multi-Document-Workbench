import type { ExtractedFactInput, FactFieldType } from '../types.js';

interface PatternRule {
  fieldType: FactFieldType;
  regex: RegExp;
  confidence: number;
  normalize?: (match: RegExpMatchArray) => string;
}

const RULES: PatternRule[] = [
  {
    fieldType: 'name',
    regex:
      /(?:company\s*name|legal\s*name|entity(?:\s*name)?|business\s*name|kyc\s*review\s*for)\s*[:\-]?\s*([A-Za-z0-9][A-Za-z0-9 &.,'\-]{2,80})/gi,
    confidence: 0.92,
  },
  {
    fieldType: 'registration_number',
    regex:
      /(?:registration\s*(?:no\.?|number|#)|reg(?:istration)?\s*no\.?|company\s*number)\s*[:\-]?\s*([A-Z0-9\-\/]{5,20})/gi,
    confidence: 0.96,
  },
  {
    fieldType: 'address',
    regex:
      /(?:registered\s*address|address(?:\s*on\s*file)?|principal\s*place)\s*[:\-]?\s*([^\n\r]{8,120})/gi,
    confidence: 0.9,
  },
  {
    fieldType: 'revenue',
    regex:
      /(?:revenue|turnover|annual\s*income|revenue_gbp)(?:\s+stated|\s+figure|\s+amount)?\s*[:\-]?\s*[£$€]?\s*([0-9][0-9,]*(?:\.\d+)?\s*[MmBbKk]?)/gi,
    confidence: 0.88,
    normalize: (m) => normalizeRevenue(m[1] ?? m[0]),
  },
  {
    fieldType: 'date',
    regex:
      /(?:incorporation\s*date|registered\s*(?:on|date)|dated?|as\s*of)\s*[:\-]?\s*(\d{4}-\d{2}-\d{2}|\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}|\d{1,2}\s+[A-Za-z]{3,9}\s+\d{4})/gi,
    confidence: 0.9,
  },
];

function normalizeRevenue(raw: string): string {
  const cleaned = raw.replace(/,/g, '').trim();
  const match = cleaned.match(/^([0-9]+(?:\.\d+)?)\s*([MmBbKk])?$/);
  if (!match) return `${cleaned} GBP`;
  let value = Number(match[1]);
  const suffix = (match[2] ?? '').toUpperCase();
  if (suffix === 'K') value *= 1_000;
  if (suffix === 'M') value *= 1_000_000;
  if (suffix === 'B') value *= 1_000_000_000;
  return `${Math.round(value)} GBP`;
}

function snippetAround(text: string, index: number, length: number): string {
  const start = Math.max(0, index - 20);
  const end = Math.min(text.length, index + length + 40);
  return text.slice(start, end).replace(/\s+/g, ' ').trim();
}

function lineRef(text: string, index: number): string {
  const line = text.slice(0, index).split(/\r?\n/).length;
  return `line ${line}`;
}

/** Deterministic fact extraction from document text. */
export function extractFactsFromText(text: string): ExtractedFactInput[] {
  const facts: ExtractedFactInput[] = [];
  const seen = new Set<string>();

  for (const rule of RULES) {
    const regex = new RegExp(rule.regex.source, rule.regex.flags);
    let match: RegExpExecArray | null;
    while ((match = regex.exec(text)) !== null) {
      const rawValue = (match[1] ?? match[0]).trim();
      const value = rule.normalize ? rule.normalize(match) : rawValue;
      if (!value || value.length < 2) continue;
      const key = `${rule.fieldType}:${value.toLowerCase()}`;
      if (seen.has(key)) continue;
      seen.add(key);
      facts.push({
        fieldType: rule.fieldType,
        value,
        confidence: rule.confidence,
        sourceSnippet: snippetAround(text, match.index, match[0].length),
        pageOrRow: lineRef(text, match.index),
      });
    }
  }

  // CSV-style revenue rows: name,amount,year
  const csvRevenue =
    /([A-Za-z][A-Za-z0-9 &.,'\-]{2,60}),\s*([0-9]{4,}),\s*(20\d{2})/g;
  let csvMatch: RegExpExecArray | null;
  while ((csvMatch = csvRevenue.exec(text)) !== null) {
    const value = `${csvMatch[2]} GBP`;
    const key = `revenue:${value}`;
    if (!seen.has(key)) {
      seen.add(key);
      facts.push({
        fieldType: 'revenue',
        value,
        confidence: 0.93,
        sourceSnippet: csvMatch[0],
        pageOrRow: lineRef(text, csvMatch.index),
      });
    }
    const nameKey = `name:${csvMatch[1].toLowerCase()}`;
    if (!seen.has(nameKey)) {
      seen.add(nameKey);
      facts.push({
        fieldType: 'name',
        value: csvMatch[1].trim(),
        confidence: 0.8,
        sourceSnippet: csvMatch[0],
        pageOrRow: lineRef(text, csvMatch.index),
      });
    }
  }

  return facts;
}
