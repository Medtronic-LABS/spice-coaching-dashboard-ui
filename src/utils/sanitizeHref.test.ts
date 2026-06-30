import { describe, expect, it } from 'vitest';
import {
  escapeHtmlAttribute,
  normalizeHref,
  sanitizeHrefForHtml,
} from '@/utils/sanitizeHref';

describe('sanitizeHref', () => {
  it('allows http, https, mailto, tel, and relative URLs', () => {
    expect(normalizeHref('https://example.com/path')).toBe(
      'https://example.com/path',
    );
    expect(normalizeHref('/admin/modules')).toBe('/admin/modules');
    expect(normalizeHref('#section')).toBe('#section');
    expect(normalizeHref('mailto:team@example.com')).toBe(
      'mailto:team@example.com',
    );
  });

  it('rejects javascript and data URLs', () => {
    expect(normalizeHref('javascript:alert(1)')).toBeNull();
    expect(
      normalizeHref('data:text/html,<script>alert(1)</script>'),
    ).toBeNull();
    expect(normalizeHref('not a valid url')).toBeNull();
  });

  it('escapes attribute values for HTML output', () => {
    expect(sanitizeHrefForHtml('https://example.com?q="1"')).toBe(
      'https://example.com?q=&quot;1&quot;',
    );
    expect(escapeHtmlAttribute('<bad>')).toBe('&lt;bad&gt;');
  });
});
