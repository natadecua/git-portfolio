import { describe, it, expect } from 'vitest';
import { sanitizeReadme } from '../../scripts/sanitize-readme.mjs';

describe('sanitizeReadme', () => {
  it('strips <script> blocks', () => {
    const out = sanitizeReadme('# Hi\n\n<script>alert(1)</script>\n\ntext');
    expect(out).not.toContain('<script');
    expect(out).not.toContain('alert(1)');
    expect(out).toContain('# Hi');
    expect(out).toContain('text');
  });

  it('strips <iframe> blocks', () => {
    const out = sanitizeReadme('a\n<iframe src="x"></iframe>\nb');
    expect(out).not.toContain('iframe');
  });

  it('strips inline on* attributes', () => {
    const out = sanitizeReadme('<a href="x" onclick="bad()">link</a>');
    expect(out).not.toContain('onclick');
    expect(out).toContain('href="x"');
  });

  it('truncates at the first <details> tag', () => {
    const body = 'before\n<details>\nhidden content\n</details>\nafter';
    const out = sanitizeReadme(body);
    expect(out).toContain('before');
    expect(out).not.toContain('hidden content');
    expect(out).not.toContain('after');
  });

  it('truncates to 8KB when no <details> is present', () => {
    const long = 'x'.repeat(10_000);
    const out = sanitizeReadme(`# Title\n${long}`);
    expect(out.length).toBeLessThanOrEqual(8192);
    expect(out.startsWith('# Title')).toBe(true);
  });

  it('keeps multibyte truncation within 8KB when encoded', () => {
    const out = sanitizeReadme('a'.repeat(8191) + '€');
    expect(new TextEncoder().encode(out).length).toBeLessThanOrEqual(8192);
  });

  it('returns empty string for null/undefined', () => {
    expect(sanitizeReadme(null)).toBe('');
    expect(sanitizeReadme(undefined)).toBe('');
  });
});
