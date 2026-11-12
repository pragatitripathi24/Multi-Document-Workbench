import fs from 'node:fs/promises';
import { createRequire } from 'node:module';
import { parse as parseCsv } from 'csv-parse/sync';
import type { DocumentType, ParsedDocument } from '../types.js';

const require = createRequire(import.meta.url);

/**
 * Use the library entry (not the package root). The package root of `pdf-parse`
 * executes a debug/test harness that looks for `./test/data/...` and crashes
 * on Render / production when that file is absent.
 */
async function parsePdfBuffer(buffer: Buffer): Promise<string> {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const pdfParse = require('pdf-parse/lib/pdf-parse.js') as (
    data: Buffer,
  ) => Promise<{ text: string }>;
  const result = await pdfParse(buffer);
  return result.text ?? '';
}

export async function parseDocumentFile(
  filePath: string,
  fileType: DocumentType,
): Promise<ParsedDocument> {
  const buffer = await fs.readFile(filePath);

  if (fileType === 'pdf') {
    const text = await parsePdfBuffer(buffer);
    return { text: text.trim(), parser: 'pdf-parse' };
  }

  if (fileType === 'csv') {
    const raw = buffer.toString('utf8');
    const records = parseCsv(raw, {
      columns: false,
      skip_empty_lines: true,
      relax_column_count: true,
    }) as string[][];
    const text = records.map((row) => row.join(',')).join('\n');
    return { text: text.trim(), parser: 'csv-parse' };
  }

  const text = buffer.toString('utf8');
  return { text: text.trim(), parser: 'utf8' };
}
