import fs from 'node:fs/promises';
import path from 'node:path';
import { seedFromString, mulberry32 } from './seed-random.mjs';

const ROOT = process.cwd();
const OUT_DIR = path.join(ROOT, 'public/specimens');

function svgWrap(inner) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="120" height="120" role="img" aria-hidden="true">
  <rect width="120" height="120" fill="transparent"/>
  ${inner}
</svg>`;
}

function renderSphere(p, rng) {
  const cx = 60 + p.jitter[0] * 6, cy = 60 + p.jitter[1] * 6;
  const r = 30 * p.scale;
  const rings = Math.max(3, Math.round(6 * p.density));
  let s = '';
  for (let i = 0; i < rings; i++) {
    const k = (i + 1) / (rings + 1);
    s += `<ellipse cx="${cx}" cy="${cy}" rx="${(r * k).toFixed(2)}" ry="${(r * (0.4 + 0.6 * k)).toFixed(2)}" fill="none" stroke="currentColor" stroke-width="0.7" opacity="${(0.25 + 0.6 * k).toFixed(2)}"/>`;
  }
  return s;
}

function renderPolyhedron(p, rng) {
  const cx = 60, cy = 60;
  const r = 32 * p.scale;
  const sides = 4 + Math.round(rng() * 4);
  const pts = [];
  for (let i = 0; i < sides; i++) {
    const a = (i / sides) * Math.PI * 2;
    pts.push(`${(cx + Math.cos(a) * r).toFixed(2)},${(cy + Math.sin(a) * r).toFixed(2)}`);
  }
  return `<polygon points="${pts.join(' ')}" fill="none" stroke="currentColor" stroke-width="1.2"/>
          <polygon points="${pts.join(' ')}" fill="currentColor" opacity="${(0.05 + 0.15 * p.density).toFixed(2)}"/>`;
}

function renderTorus(p, rng) {
  const cx = 60, cy = 60;
  const R = 32 * p.scale, r = 12 * p.scale;
  return `<ellipse cx="${cx}" cy="${cy}" rx="${R}" ry="${R * 0.42}" fill="none" stroke="currentColor" stroke-width="1.2"/>
          <ellipse cx="${cx}" cy="${cy}" rx="${(R - r).toFixed(2)}" ry="${((R - r) * 0.42).toFixed(2)}" fill="none" stroke="currentColor" stroke-width="0.7" opacity="0.6"/>`;
}

function renderCylinder(p) {
  const cx = 60, cy = 60;
  const w = 40 * p.scale, h = 60 * p.scale;
  return `<rect x="${cx - w / 2}" y="${cy - h / 2}" width="${w}" height="${h}" fill="none" stroke="currentColor" stroke-width="1.2"/>
          <ellipse cx="${cx}" cy="${cy - h / 2}" rx="${w / 2}" ry="${w / 6}" fill="none" stroke="currentColor" stroke-width="1.2"/>
          <ellipse cx="${cx}" cy="${cy + h / 2}" rx="${w / 2}" ry="${w / 6}" fill="none" stroke="currentColor" stroke-width="1.2"/>`;
}

function renderGeneric(p, rng) {
  const dots = Math.round(12 + 24 * p.density);
  let s = '';
  for (let i = 0; i < dots; i++) {
    const x = 20 + rng() * 80;
    const y = 20 + rng() * 80;
    s += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${(0.6 + rng() * 1.8).toFixed(2)}" fill="currentColor" opacity="${(0.3 + rng() * 0.6).toFixed(2)}"/>`;
  }
  return s;
}

function renderSpecimen(repo) {
  const p = repo.specimen;
  const rng = mulberry32(seedFromString(repo.name));
  switch (p.family) {
    case 'sphere':     return svgWrap(renderSphere(p, rng));
    case 'polyhedron': return svgWrap(renderPolyhedron(p, rng));
    case 'torus':      return svgWrap(renderTorus(p, rng));
    case 'cylinder':   return svgWrap(renderCylinder(p));
    default:           return svgWrap(renderGeneric(p, rng));
  }
}

async function main() {
  const portfolio = JSON.parse(await fs.readFile(path.join(ROOT, 'src/data/portfolio.json'), 'utf8'));
  await fs.mkdir(OUT_DIR, { recursive: true });
  for (const repo of portfolio.repos) {
    await fs.writeFile(path.join(OUT_DIR, `${repo.name}.svg`), renderSpecimen(repo), 'utf8');
  }
  console.log(`Wrote ${portfolio.repos.length} specimens to public/specimens/`);
}

main().catch(err => { console.error(err); process.exit(1); });
