import { describe, expect, it } from 'vitest';
import {
  INGEST_MODULE_COUNT_MAX_DIGITS,
  INGESTION_INSTRUCTIONS_MAX_LENGTH,
  INGESTION_INSTRUCTIONS_MAX_LINES,
  countIngestionInstructionLines,
  isIngestionInstructionsValid,
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

describe('ingestion instructions limits', () => {
  it('counts lines like the platform sanitizer', () => {
    expect(countIngestionInstructionLines('')).toBe(0);
    expect(countIngestionInstructionLines('one line')).toBe(1);
    expect(countIngestionInstructionLines('a\nb\nc')).toBe(3);
  });

  it('allows empty and rejects over the line or character limits', () => {
    expect(isIngestionInstructionsValid('')).toBe(true);
    expect(isIngestionInstructionsValid('Focus on ANC.')).toBe(true);

    const tooManyLines = Array.from(
      { length: INGESTION_INSTRUCTIONS_MAX_LINES + 1 },
      (_, i) => `line ${i}`,
    ).join('\n');
    expect(isIngestionInstructionsValid(tooManyLines)).toBe(false);

    expect(
      isIngestionInstructionsValid(
        'a'.repeat(INGESTION_INSTRUCTIONS_MAX_LENGTH),
      ),
    ).toBe(true);
    expect(
      isIngestionInstructionsValid(
        'a'.repeat(INGESTION_INSTRUCTIONS_MAX_LENGTH + 1),
      ),
    ).toBe(false);
  });
});
