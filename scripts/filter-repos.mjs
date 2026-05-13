/**
 * @param {Array<Object>} repos       raw repos from Octokit
 * @param {Object} config             portfolio.config.json
 * @returns {Array<Object>}           filtered + ordered repos
 */
export function filterRepos(repos, config) {
  const {
    include_public = true,
    include_private_explicit = [],
    exclude = [],
    pinned_order = [],
    max_repos = 12,
    min_stars = 0,
  } = config ?? {};

  const allow = new Set(include_private_explicit);
  const deny = new Set(exclude);

  const eligible = repos.filter(r => {
    if (r.fork || r.archived) return false;
    if (deny.has(r.name)) return false;
    if ((r.stargazers_count ?? 0) < min_stars) return false;
    if (r.private) return allow.has(r.name);
    return include_public;
  });

  const pinSet = new Set(pinned_order);
  const pinned = pinned_order
    .map(name => eligible.find(r => r.name === name))
    .filter(Boolean);
  const rest = eligible
    .filter(r => !pinSet.has(r.name))
    .sort((a, b) => new Date(b.pushed_at ?? 0) - new Date(a.pushed_at ?? 0));

  return [...pinned, ...rest].slice(0, max_repos);
}
