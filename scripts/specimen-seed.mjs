import { seedFromString, mulberry32 } from '../src/lib/seedRandom.ts';

export const GEOMETRY_FAMILIES = ['sphere', 'polyhedron', 'torus', 'cylinder', 'generic'];

const LANGUAGE_FAMILY = {
  TypeScript: 'sphere',
  JavaScript: 'sphere',
  Rust: 'polyhedron',
  Python: 'torus',
  Go: 'cylinder',
};

const SPECIMEN_NOW = Date.now();

function ageYears(pushedAt, now = SPECIMEN_NOW) {
  if (!pushedAt) return 5;
  const ms = now - new Date(pushedAt).getTime();
  return Math.max(0, ms / (365 * 24 * 3600 * 1000));
}

/**
 * Deterministic geometry parameters for a repo.
 * @param {{ name: string, language?: string|null, stargazers_count?: number, pushed_at?: string }} repo
 * @returns {{ family: string, density: number, rotationRate: number, jitter: number[], scale: number }}
 */
export function specimenParams(repo) {
  const family = LANGUAGE_FAMILY[repo.language] ?? 'generic';
  const rng = mulberry32(seedFromString(repo.name));

  const stars = Math.max(0, repo.stargazers_count ?? 0);
  const starsTerm = Math.min(1, Math.log10(1 + stars) / 3);
  const density = 0.3 + 0.6 * starsTerm + 0.1 * rng();

  const age = ageYears(repo.pushed_at);
  const youth = Math.exp(-age / 2);
  const rotationRate = 0.05 + 0.55 * youth;

  const jitter = [rng() - 0.5, rng() - 0.5, rng() - 0.5];
  const scale = 0.85 + 0.30 * rng();

  return { family, density, rotationRate, jitter, scale };
}
