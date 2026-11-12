import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { v4 as uuidv4 } from 'uuid';
import { config } from '../config.js';
import { prisma } from '../db.js';
import type { DocumentDTO } from '../types.js';
import { inferFileType, isAllowedUpload } from '../utils/files.js';
import { toDocumentDTO, toFactDTO } from '../utils/mappers.js';
import { extractFactsFromText } from './facts.js';
import { parseDocumentFile } from './parsers.js';

export async function ensureUploadDir(): Promise<void> {
  await fs.mkdir(config.uploadDir, { recursive: true });
}

export async function listDocuments(): Promise<DocumentDTO[]> {
  const docs = await prisma.document.findMany({
    orderBy: { uploadedAt: 'desc' },
  });
  return docs.map(toDocumentDTO);
}

export async function getDocument(id: string): Promise<DocumentDTO | null> {
  const doc = await prisma.document.findUnique({ where: { id } });
  return doc ? toDocumentDTO(doc) : null;
}

export async function processUploadedFile(file: Express.Multer.File): Promise<DocumentDTO> {
  if (!isAllowedUpload(file.originalname, file.mimetype)) {
    await fs.unlink(file.path).catch(() => undefined);
    throw Object.assign(new Error('Only PDF, CSV, and TXT files are allowed.'), {
      status: 400,
      code: 'INVALID_FILE_TYPE',
    });
  }

  const fileType = inferFileType(file.originalname, file.mimetype);
  if (!fileType) {
    await fs.unlink(file.path).catch(() => undefined);
    throw Object.assign(new Error('Unable to determine file type.'), {
      status: 400,
      code: 'UNKNOWN_FILE_TYPE',
    });
  }

  if (file.size > config.maxFileSizeBytes) {
    await fs.unlink(file.path).catch(() => undefined);
    throw Object.assign(new Error('File exceeds the 10 MB size limit.'), {
      status: 400,
      code: 'FILE_TOO_LARGE',
    });
  }

  const storedName = path.basename(file.path);
  const checksum = crypto
    .createHash('sha256')
    .update(await fs.readFile(file.path))
    .digest('hex');

  const doc = await prisma.document.create({
    data: {
      originalName: file.originalname,
      storedName,
      mimeType: file.mimetype || 'application/octet-stream',
      fileType,
      sizeBytes: file.size,
      status: 'processing',
      provenance: {
        create: {
          storagePath: file.path,
          checksum,
        },
      },
    },
  });

  try {
    const parsed = await parseDocumentFile(file.path, fileType);
    const preview = parsed.text.slice(0, 500);
    const facts = extractFactsFromText(parsed.text);

    const updated = await prisma.document.update({
      where: { id: doc.id },
      data: {
        status: 'ready',
        extractedText: parsed.text,
        extractedTextPreview: preview || null,
        provenance: {
          update: {
            parser: parsed.parser,
            parsedAt: new Date(),
          },
        },
        facts: {
          create: facts.map((f) => ({
            fieldType: f.fieldType,
            value: f.value,
            confidence: f.confidence,
            sourceSnippet: f.sourceSnippet,
            pageOrRow: f.pageOrRow ?? null,
          })),
        },
      },
    });

    return toDocumentDTO(updated);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Processing failed';
    const updated = await prisma.document.update({
      where: { id: doc.id },
      data: {
        status: 'error',
        errorMessage: message,
      },
    });
    return toDocumentDTO(updated);
  }
}

export function buildStoredFilename(originalName: string): string {
  const ext = path.extname(originalName).toLowerCase() || '.bin';
  return `${uuidv4()}${ext}`;
}

export async function getFactsForDocuments(documentIds: string[]) {
  const docs = await prisma.document.findMany({
    where: { id: { in: documentIds } },
    include: { facts: true },
  });
  return docs.flatMap((doc) =>
    doc.facts.map((fact) => toFactDTO(fact, doc.originalName)),
  );
}
