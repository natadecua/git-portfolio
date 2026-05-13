const DAY = 24 * 3600 * 1000;

export function relativeTime(iso: string, now: number = Date.now()): string {
  const t = new Date(iso).getTime();
  const days = Math.floor((now - t) / DAY);
  if (days < 1)   return 'today';
  if (days < 14)  return `${days}d`;
  if (days < 60)  return `${Math.floor(days / 7)}w`;
  if (days < 365) return `${Math.floor(days / 30)}mo`;
  return `${Math.floor(days / 365)}y`;
}

export function percent(ratio: number): string {
  return `${Math.round(ratio * 100)}%`;
}

export function syncedAgo(iso: string, now: number = Date.now()): string {
  return `synced ${relativeTime(iso, now)} ago`;
}
