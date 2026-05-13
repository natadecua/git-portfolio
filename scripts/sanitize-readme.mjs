const MAX_BYTES = 8192;
const SCRIPT_RE = /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script\s*>/gi;
const IFRAME_RE = /<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe\s*>/gi;
const ONATTR_RE = /\son[a-z]+\s*=\s*("([^"]*)"|'([^']*)'|[^\s>]+)/gi;
const DETAILS_RE = /<details\b/i;

function truncateBytes(str, max) {
  const buf = new TextEncoder().encode(str);
  if (buf.length <= max) return str;
  return new TextDecoder().decode(buf.slice(0, max));
}

export function sanitizeReadme(input) {
  if (input == null) return '';
  let out = String(input);
  out = out.replace(SCRIPT_RE, '');
  out = out.replace(IFRAME_RE, '');
  out = out.replace(ONATTR_RE, '');
  const idx = out.search(DETAILS_RE);
  if (idx >= 0) out = out.slice(0, idx);
  out = truncateBytes(out, MAX_BYTES);
  return out;
}
