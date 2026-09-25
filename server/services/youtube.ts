import type { ShowEpisode } from '../../shared/types/index.ts';
import { ONCHAIN_CASH_SHOW } from '../../shared/data/showConfig.ts';

const RSS_URL = `https://www.youtube.com/feeds/videos.xml?channel_id=${ONCHAIN_CASH_SHOW.youtubeChannelId}`;

function decodeXml(value: string): string {
  return value
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&#(\d+);/g, (_match, code: string) => String.fromCodePoint(Number(code)))
    .trim();
}

function tag(entry: string, name: string): string {
  const match = entry.match(new RegExp(`<${name}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${name}>`, 'i'));
  return match ? decodeXml(match[1]) : '';
}

function attr(entry: string, tagName: string, attrName: string): string {
  const tagMatch = entry.match(new RegExp(`<${tagName}\\s[^>]*>`, 'i'));
  if (!tagMatch) return '';
  const attrMatch = tagMatch[0].match(new RegExp(`${attrName}=["']([^"']+)["']`, 'i'));
  return attrMatch ? decodeXml(attrMatch[1]) : '';
}

export function parseYouTubeFeed(xml: string): ShowEpisode[] {
  const entries = xml.match(/<entry>[\s\S]*?<\/entry>/gi) ?? [];
  return entries
    .map((entry): ShowEpisode | null => {
      const videoId = tag(entry, 'yt:videoId');
      const title = tag(entry, 'title');
      const publishedAt = tag(entry, 'published');
      if (!/^[A-Za-z0-9_-]{11}$/.test(videoId) || !title || !publishedAt) return null;

      const description = tag(entry, 'media:description').replace(/\s+/g, ' ').trim();
      const thumbnailUrl =
        attr(entry, 'media:thumbnail', 'url') || `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;

      return {
        videoId,
        title,
        publishedAt,
        description,
        thumbnailUrl,
        watchUrl: `https://www.youtube.com/watch?v=${videoId}`,
        embedUrl: `https://www.youtube-nocookie.com/embed/${videoId}`,
      };
    })
    .filter((episode): episode is ShowEpisode => episode != null)
    .slice(0, 15);
}

export async function fetchOnchainCashEpisodes(): Promise<ShowEpisode[]> {
  const response = await fetch(RSS_URL, {
    headers: {
      accept: 'application/atom+xml, application/xml;q=0.9, text/xml;q=0.8',
      'user-agent': 'ONCHAIN-CA-H/1.0 (+https://www.youtube.com/@ONCHAINCASH)',
    },
    signal: AbortSignal.timeout(15_000),
  });
  if (!response.ok) throw new Error(`YouTube RSS returned HTTP ${response.status}`);
  return parseYouTubeFeed(await response.text());
}
