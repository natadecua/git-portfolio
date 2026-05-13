import { Octokit } from '@octokit/rest';
import fs from 'node:fs/promises';
import path from 'node:path';
import { filterRepos } from './filter-repos.mjs';
import { sanitizeReadme } from './sanitize-readme.mjs';
import { specimenParams } from './specimen-seed.mjs';

const USER = 'natadecua';
const ROOT = process.cwd();
const DATA_DIR = path.join(ROOT, 'src/data');
const READMES_DIR = path.join(DATA_DIR, 'readmes');

async function loadConfig() {
  const raw = await fs.readFile(path.join(ROOT, 'portfolio.config.json'), 'utf8');
  return JSON.parse(raw);
}

async function ensureClean() {
  await fs.mkdir(READMES_DIR, { recursive: true });
  const existing = await fs.readdir(READMES_DIR).catch(() => []);
  await Promise.all(existing.map(f => fs.rm(path.join(READMES_DIR, f), { force: true })));
}

async function fetchRepoReadme(octokit, repoName) {
  try {
    const res = await octokit.rest.repos.getReadme({ owner: USER, repo: repoName, mediaType: { format: 'raw' } });
    return typeof res.data === 'string' ? res.data : '';
  } catch (err) {
    if (err.status === 404) return '';
    throw err;
  }
}

async function fetchActivity(octokit) {
  const events = await octokit.paginate(octokit.rest.activity.listPublicEventsForUser, { username: USER, per_page: 100 });
  const weeks = new Array(52).fill(0);
  const now = Date.now();
  for (const ev of events) {
    if (ev.type !== 'PushEvent') continue;
    const ageMs = now - new Date(ev.created_at).getTime();
    const w = Math.floor(ageMs / (7 * 24 * 3600 * 1000));
    if (w >= 0 && w < 52) weeks[51 - w] += (ev.payload?.commits?.length ?? 1);
  }
  return weeks;
}

function languageTotals(repos) {
  const totals = {};
  for (const r of repos) {
    const lang = r.language ?? 'Other';
    totals[lang] = (totals[lang] ?? 0) + 1;
  }
  const sum = Object.values(totals).reduce((a, b) => a + b, 0) || 1;
  return Object.fromEntries(Object.entries(totals).map(([k, v]) => [k, +(v / sum).toFixed(3)]));
}

async function main() {
  const token = process.env.GH_READ_TOKEN;
  if (!token) throw new Error('GH_READ_TOKEN env var is required');

  const config = await loadConfig();
  const octokit = new Octokit({ auth: token });

  const all = await octokit.paginate(octokit.rest.repos.listForAuthenticatedUser, {
    per_page: 100, visibility: 'all', affiliation: 'owner',
  });
  const filtered = filterRepos(all, config);

  await ensureClean();

  const out = [];
  for (const repo of filtered) {
    const raw = await fetchRepoReadme(octokit, repo.name);
    const rawBase = `https://raw.githubusercontent.com/${USER}/${repo.name}/HEAD`;
    const readme = sanitizeReadme(raw, rawBase);
    const readmePath = `src/data/readmes/${repo.name}.md`;
    await fs.writeFile(path.join(ROOT, readmePath), readme, 'utf8');

    out.push({
      name: repo.name,
      description: repo.description ?? '',
      language: repo.language ?? null,
      stars: repo.stargazers_count ?? 0,
      topics: repo.topics ?? [],
      pushed_at: repo.pushed_at,
      html_url: repo.html_url,
      is_private: !!repo.private,
      readme_path: readmePath,
      specimen_svg: `/specimens/${repo.name}.svg`,
      specimen: specimenParams(repo),
    });
  }

  const portfolio = {
    synced_at: new Date().toISOString(),
    languages_overall: languageTotals(filtered),
    activity_52w: await fetchActivity(octokit),
    repos: out,
  };

  await fs.writeFile(path.join(DATA_DIR, 'portfolio.json'), JSON.stringify(portfolio, null, 2), 'utf8');
  console.log(`Wrote ${out.length} repos to src/data/portfolio.json`);
}

main().catch(err => { console.error(err); process.exit(1); });
