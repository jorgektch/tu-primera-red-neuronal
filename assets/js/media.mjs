/** Video URL parser: converts known providers and direct video files only. */
const VIDEO_ID = /^[a-zA-Z0-9_-]{11}$/;
const VIMEO_ID = /^\d{1,12}$/;
const FILE = /\.(mp4|webm|og[gv])$/i;
const YOUTUBE_HOSTS = new Set([
  'youtube.com', 'www.youtube.com', 'm.youtube.com',
  'music.youtube.com', 'youtube-nocookie.com',
  'www.youtube-nocookie.com', 'youtu.be', 'www.youtu.be'
]);
const VIMEO_HOSTS = new Set(['vimeo.com','www.vimeo.com','player.vimeo.com']);

export function parseVideoUrl(value, base = 'https://example.org/') {
  if (typeof value !== 'string' || !value.trim()) return null;
  let url;
  try { url = new URL(value, base); } catch { return null; }
  if (url.protocol !== 'https:') return null;
  const host = url.hostname.toLowerCase();
  let id;
  if (YOUTUBE_HOSTS.has(host)) {
    const parts = url.pathname.split('/').filter(Boolean);
    if (host === 'youtu.be' || host === 'www.youtu.be') id = parts[0];
    else if (parts[0] === 'watch') id = url.searchParams.get('v');
    else if (['embed','shorts','live'].includes(parts[0])) id = parts[1];
    if (VIDEO_ID.test(id || '')) return {kind:'youtube', url:url.href, id};
    return null;
  }
  if (VIMEO_HOSTS.has(host)) {
    const parts = url.pathname.split('/').filter(Boolean);
    id = parts[0] === 'video' ? parts[1] : parts[0];
    if (VIMEO_ID.test(id || '')) return {kind:'vimeo', url:url.href, id};
    return null;
  }
  if (!FILE.test(url.pathname)) return null;
  // Relative video links resolve against the deck page. Reject non-video URLs.
  const ext = url.pathname.split('.').at(-1).toLowerCase();
  const mime = ext === 'mp4' ? 'video/mp4' : ext === 'webm' ? 'video/webm' : 'video/ogg';
  return {kind:'file', url:url.href, mime};
}

export function videoEmbedUrl(media, autoplay = false) {
  if (media.kind === 'youtube') {
    const url = new URL(`https://www.youtube-nocookie.com/embed/${media.id}`);
    url.searchParams.set('rel','0');
    if (autoplay) url.searchParams.set('autoplay','1');
    return url.href;
  }
  if (media.kind === 'vimeo') {
    const url = new URL(`https://player.vimeo.com/video/${media.id}`);
    url.searchParams.set('dnt','1');
    if (autoplay) url.searchParams.set('autoplay','1');
    return url.href;
  }
  return media.url;
}

export function videoLabel(text) {
  return String(text || '').replace(/^\s*(?:▶\s*)?(?:vídeo|video)\s*[:–-]\s*/i,'').trim() || 'Ver video';
}
