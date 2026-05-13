import { describe, it, expect } from 'vitest';
import { filterRepos } from '../../scripts/filter-repos.mjs';

const repo = (over = {}) => ({
  name: 'demo', private: false, stargazers_count: 0, fork: false, archived: false, ...over,
});

describe('filterRepos', () => {
  it('keeps public repos when include_public is true', () => {
    const out = filterRepos([repo({ name: 'a' }), repo({ name: 'b' })], { include_public: true });
    expect(out.map(r => r.name)).toEqual(['a', 'b']);
  });

  it('drops public repos when include_public is false', () => {
    const out = filterRepos([repo({ name: 'a' })], { include_public: false });
    expect(out).toEqual([]);
  });

  it('includes only explicitly listed private repos', () => {
    const repos = [repo({ name: 'pub' }), repo({ name: 'sec', private: true }), repo({ name: 'hidden', private: true })];
    const out = filterRepos(repos, { include_public: true, include_private_explicit: ['sec'] });
    expect(out.map(r => r.name).sort()).toEqual(['pub', 'sec']);
  });

  it('excludes names listed in exclude', () => {
    const out = filterRepos([repo({ name: 'a' }), repo({ name: 'b' })], { include_public: true, exclude: ['a'] });
    expect(out.map(r => r.name)).toEqual(['b']);
  });

  it('drops forks and archived', () => {
    const out = filterRepos(
      [repo({ name: 'a', fork: true }), repo({ name: 'b', archived: true }), repo({ name: 'c' })],
      { include_public: true },
    );
    expect(out.map(r => r.name)).toEqual(['c']);
  });

  it('applies min_stars', () => {
    const out = filterRepos(
      [repo({ name: 'low', stargazers_count: 1 }), repo({ name: 'high', stargazers_count: 50 })],
      { include_public: true, min_stars: 10 },
    );
    expect(out.map(r => r.name)).toEqual(['high']);
  });

  it('honors pinned_order then sorts remainder by pushed_at desc', () => {
    const r = (name, pushed) => repo({ name, pushed_at: pushed });
    const out = filterRepos(
      [r('old', '2020-01-01T00:00:00Z'), r('new', '2026-05-01T00:00:00Z'), r('pin', '2019-01-01T00:00:00Z')],
      { include_public: true, pinned_order: ['pin'] },
    );
    expect(out.map(r => r.name)).toEqual(['pin', 'new', 'old']);
  });

  it('truncates to max_repos', () => {
    const repos = Array.from({ length: 20 }, (_, i) => repo({ name: `r${i}`, pushed_at: `2026-05-${String(i+1).padStart(2,'0')}T00:00:00Z` }));
    const out = filterRepos(repos, { include_public: true, max_repos: 5 });
    expect(out).toHaveLength(5);
  });
});
