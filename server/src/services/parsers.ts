import fs from 'node:fs/promises';
import { parse as parseCsv } from 'csv-parse/sync';
import type { DocumentType, ParsedDocument } from '../types.js';

// pdf-parse has no stable ESM types in this setup
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function parsePdfBuffer(buffer: Buffer): Promise<string> {
  const pdfParse = (await import('pdf-parse')).default as (
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
