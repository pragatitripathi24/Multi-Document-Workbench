import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createApp } from './app.js';
import { prisma } from './db.js';
import { ensureUploadDir } from './services/documents.js';

const app = createApp();
const samplesDir = path.resolve(process.cwd(), '../samples');

describe('DocuMind API', () => {
  beforeAll(async () => {
    await ensureUploadDir();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('GET /api/health returns ok', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });

  it('rejects unsupported upload types', async () => {
    const tmp = path.join(os.tmpdir(), `documind-bad-${Date.now()}.docx`);
    fs.writeFileSync(tmp, 'not a supported document');
    try {
      const res = await request(app)
        .post('/api/documents/upload')
        .attach('files', tmp);
      expect(res.status).toBeGreaterThanOrEqual(400);
      expect(String(res.body.message ?? res.text)).toMatch(/pdf|csv|txt|allowed/i);
    } finally {
      fs.unlinkSync(tmp);
    }
  });

  it('uploads synthetic docs, extracts facts, and runs cross-document analysis', async () => {
    const reg = path.join(samplesDir, 'acme_corp_registration.txt');
    const kyc = path.join(samplesDir, 'acme_kyc_notes.txt');
    const fin = path.join(samplesDir, 'acme_financials_fy2024.csv');
    expect(fs.existsSync(reg)).toBe(true);

    const upload = await request(app)
      .post('/api/documents/upload')
      .attach('files', reg)
      .attach('files', kyc)
      .attach('files', fin);

    expect(upload.status).toBe(201);
    expect(upload.body).toHaveLength(3);
    expect(upload.body.every((d: { status: string }) => d.status === 'ready')).toBe(
      true,
    );

    const ids = upload.body.map((d: { id: string }) => d.id) as string[];

    const analysis = await request(app)
      .post('/api/analyses')
      .send({
        prompt:
          'Compare entity identity fields and flag conflicts in name, address, revenue, dates, or registration numbers.',
        mode: 'cross_document',
        documentIds: ids,
      });

    expect(analysis.status).toBe(201);
    expect(analysis.body.conflictCount).toBeGreaterThan(0);
    expect(analysis.body.findings.length).toBeGreaterThan(0);
    expect(analysis.body.facts.length).toBeGreaterThan(0);
    expect(analysis.body.documentNames).toEqual(
      expect.arrayContaining([
        'acme_corp_registration.txt',
        'acme_kyc_notes.txt',
        'acme_financials_fy2024.csv',
      ]),
    );
    // Provenance: every finding references source documents
    for (const finding of analysis.body.findings) {
      expect(finding.sourceDocumentIds.length).toBeGreaterThan(0);
      expect(finding.sourceDocumentNames.length).toBeGreaterThan(0);
    }

    const stats = await request(app).get('/api/stats');
    expect(stats.status).toBe(200);
    expect(stats.body.documentCount).toBeGreaterThanOrEqual(3);
    expect(stats.body.analysisCount).toBeGreaterThanOrEqual(1);
  });

  it('validates analysis payload with Zod', async () => {
    const res = await request(app).post('/api/analyses').send({
      prompt: '',
      mode: 'cross_document',
      documentIds: ['only-one'],
    });
    expect(res.status).toBe(400);
  });
});
