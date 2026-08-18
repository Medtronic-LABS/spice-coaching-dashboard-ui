import { describe, expect, it } from 'vitest';
import {
  INGEST_MODULE_COUNT_MAX_DIGITS,
  parseOptionalIngestModuleCountInput,
} from './ingestFormDefaults';

describe('parseOptionalIngestModuleCountInput', () => {
  it('keeps at most one digit for the 1–7 range', () => {
    expect(INGEST_MODULE_COUNT_MAX_DIGITS).toBe(1);
    expect(parseOptionalIngestModuleCountInput('')).toBe('');
    expect(parseOptionalIngestModuleCountInput('   ')).toBe('');
    expect(parseOptionalIngestModuleCountInput('5')).toBe(5);
    expect(parseOptionalIngestModuleCountInput('17')).toBe(1);
    expect(parseOptionalIngestModuleCountInput('99')).toBe(9);
    expect(parseOptionalIngestModuleCountInput('0')).toBe(0);
    expect(parseOptionalIngestModuleCountInput('abc')).toBe('');
  });
});
