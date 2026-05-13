const MAX_BYTES = 8192;
const SCRIPT_RE = /<script\b[\s\S]*?(?:<\/script\s*>|$)/gi;
const IFRAME_RE = /<iframe\b[\s\S]*?(?:<\/iframe\s*>|$)/gi;
const ONATTR_RE = /\son[a-z]+\s*=\s*("([^"]*)"|'([^']*)'|[^\s>]+)/gi;
const DETAILS_RE = /<details\b/i;

function truncateBytes(str, max) {
  const encoder = new TextEncoder();
  const buf = encoder.encode(str);
  if (buf.length <= max) return str;
  let out = new TextDecoder('utf-8', { fatal: false }).decode(buf.slice(0, max));
  while (encoder.encode(out).length > max) {
    out = out.slice(0, -1);
  }
  return out;
}

function isRelative(url) {
  return url && !url.startsWith('http://') && !url.startsWith('https://') &&
    !url.startsWith('//') && !url.startsWith('data:') && !url.startsWith('#');
}

function rewriteImageUrls(text, rawBase) {
  // Markdown: ![alt](relative/path)
  text = text.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, (_, alt, url) => {
    const trimmed = url.trim();
    return isRelative(trimmed) ? `![${alt}](${rawBase}/${trimmed})` : `![${alt}](${url})`;
  });
  // HTML: <img src="relative/path" or src='relative/path'
  text = text.replace(/<img([^>]*)\ssrc=(["'])([^"']+)\2/gi, (_, attrs, q, url) => {
    return isRelative(url) ? `<img${attrs} src=${q}${rawBase}/${url}${q}` : `<img${attrs} src=${q}${url}${q}`;
  });
  return text;
}

export function sanitizeReadme(input, repoRawBase) {
  if (input == null) return '';
  let out = String(input);
  if (repoRawBase) out = rewriteImageUrls(out, repoRawBase);
  out = out.replace(SCRIPT_RE, '');
  out = out.replace(IFRAME_RE, '');
  out = out.replace(ONATTR_RE, '');
  const idx = out.search(DETAILS_RE);
  if (idx >= 0) out = out.slice(0, idx);
  out = truncateBytes(out, MAX_BYTES);
  return out;
}
