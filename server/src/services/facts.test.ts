import { describe, expect, it } from 'vitest';
import { extractFactsFromText } from './facts.js';

describe('extractFactsFromText', () => {
  it('extracts name, address, registration number, and date from registration text', () => {
    const text = `
Company Name: ACME Corporation Ltd
Registered Address: 12 King Street, London EC2A 4BX
Registration Number: 09876543
Incorporation Date: 2018-03-14
`;
    const facts = extractFactsFromText(text);
    const byType = Object.fromEntries(
      facts.map((f) => [f.fieldType, f.value]),
    );

    expect(byType.name).toContain('ACME Corporation Ltd');
    expect(byType.address).toContain('12 King Street');
    expect(byType.registration_number).toBe('09876543');
    expect(byType.date).toBe('2018-03-14');
    expect(facts.every((f) => f.sourceSnippet.length > 0)).toBe(true);
  });

  it('normalizes revenue from KYC-style phrasing', () => {
    const text = 'Revenue stated: £4.1M (FY2024)';
    const facts = extractFactsFromText(text);
    const revenue = facts.find((f) => f.fieldType === 'revenue');
    expect(revenue?.value).toBe('4100000 GBP');
  });

  it('extracts revenue rows from CSV-like content', () => {
    const text = `entity,revenue_gbp,fiscal_year
ACME Corp Ltd,4250000,2024`;
    const facts = extractFactsFromText(text);
    expect(facts.some((f) => f.fieldType === 'revenue' && f.value.includes('4250000'))).toBe(
      true,
    );
  });
});
