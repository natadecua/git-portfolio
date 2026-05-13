import { describe, it, expect } from 'vitest';
import { relativeTime, percent, syncedAgo } from '../../src/lib/format';

const FIXED = new Date('2026-05-13T12:00:00Z').getTime();

describe('relativeTime', () => {
  it('returns "today" for <24h', () => {
    expect(relativeTime('2026-05-13T03:00:00Z', FIXED)).toBe('today');
  });
  it('returns "Nd" for days', () => {
    expect(relativeTime('2026-05-10T12:00:00Z', FIXED)).toBe('3d');
  });
  it('returns "Nw" for weeks', () => {
    expect(relativeTime('2026-04-20T12:00:00Z', FIXED)).toBe('3w');
  });
  it('returns "Nmo" for months', () => {
    expect(relativeTime('2026-01-13T12:00:00Z', FIXED)).toBe('4mo');
  });
  it('returns "Ny" for years', () => {
    expect(relativeTime('2024-05-13T12:00:00Z', FIXED)).toBe('2y');
  });
});

describe('percent', () => {
  it('formats a 0..1 ratio as an integer percent', () => {
    expect(percent(0.547)).toBe('55%');
    expect(percent(0)).toBe('0%');
    expect(percent(1)).toBe('100%');
  });
});

describe('syncedAgo', () => {
  it('prefixes with "synced"', () => {
    expect(syncedAgo('2026-05-12T12:00:00Z', FIXED)).toBe('synced 1d ago');
  });
});
