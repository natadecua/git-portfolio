import { describe, it, expect } from 'vitest';
import { specimenParams, GEOMETRY_FAMILIES } from '../../scripts/specimen-seed.mjs';

const repo = (over = {}) => ({
  name: 'demo', language: 'TypeScript', stargazers_count: 10, pushed_at: '2025-01-01T00:00:00Z', ...over,
});

describe('specimenParams', () => {
  it('is deterministic for the same repo inputs', () => {
    const a = specimenParams(repo({ name: 'foo' }));
    const b = specimenParams(repo({ name: 'foo' }));
    expect(a).toEqual(b);
  });

  it('produces different params for different repos', () => {
    const a = specimenParams(repo({ name: 'foo' }));
    const b = specimenParams(repo({ name: 'bar' }));
    expect(a).not.toEqual(b);
  });

  it('maps known languages to declared families', () => {
    expect(specimenParams(repo({ language: 'TypeScript' })).family).toBe('sphere');
    expect(specimenParams(repo({ language: 'Rust' })).family).toBe('polyhedron');
    expect(specimenParams(repo({ language: 'Python' })).family).toBe('torus');
    expect(specimenParams(repo({ language: 'Go' })).family).toBe('cylinder');
  });

  it('falls back to "generic" for unknown languages', () => {
    expect(specimenParams(repo({ language: 'Brainfuck' })).family).toBe('generic');
    expect(specimenParams(repo({ language: null })).family).toBe('generic');
  });

  it('stars increase density', () => {
    const low = specimenParams(repo({ name: 'x', stargazers_count: 0 })).density;
    const high = specimenParams(repo({ name: 'x', stargazers_count: 1000 })).density;
    expect(high).toBeGreaterThan(low);
  });

  it('older repos rotate slower (lower rotationRate)', () => {
    const old = specimenParams(repo({ name: 'x', pushed_at: '2018-01-01T00:00:00Z' })).rotationRate;
    const young = specimenParams(repo({ name: 'x', pushed_at: '2026-01-01T00:00:00Z' })).rotationRate;
    expect(young).toBeGreaterThan(old);
  });

  it('exports the canonical family list', () => {
    expect(GEOMETRY_FAMILIES).toEqual(['sphere','polyhedron','torus','cylinder','generic']);
  });
});
