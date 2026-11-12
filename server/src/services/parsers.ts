import fs from 'node:fs/promises';
import { parse as parseCsv } from 'csv-parse/sync';
import { extractText, getDocumentProxy } from 'unpdf';
import type { DocumentType, ParsedDocument } from '../types.js';

async function parsePdfBuffer(buffer: Buffer): Promise<string> {
  const pdf = await getDocumentProxy(new Uint8Array(buffer));
  const result = await extractText(pdf, { mergePages: true });
  const text = result.text as string | string[];
  return (Array.isArray(text) ? text.join('\n') : text).trim();
}

export async function parseDocumentFile(
  filePath: string,
  fileType: DocumentType,
): Promise<ParsedDocument> {
  const buffer = await fs.readFile(filePath);

  if (fileType === 'pdf') {
    const text = await parsePdfBuffer(buffer);
    return { text: text.trim(), parser: 'unpdf' };
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
