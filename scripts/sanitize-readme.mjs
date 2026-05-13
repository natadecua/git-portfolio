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
