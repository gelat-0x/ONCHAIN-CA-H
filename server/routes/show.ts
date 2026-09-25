import { Router } from 'express';
import type { ShowData } from '../../shared/types/index.ts';
import {
  ONCHAIN_CASH_HOSTS,
  ONCHAIN_CASH_SEGMENTS,
  ONCHAIN_CASH_SHOW,
} from '../../shared/data/showConfig.ts';
import { SHOW_TOPIC_INBOX_EMAIL } from '../../shared/constants/socialLinks.ts';
import { fetchOnchainCashEpisodes } from '../services/youtube.ts';

export const showRouter = Router();

const CACHE_MS = 15 * 60 * 1000;
let cache: { data: ShowData; ts: number } | null = null;

function baseData(): Omit<ShowData, 'episodes' | 'lastUpdated' | 'cached'> {
  const { youtubeChannelId, youtubeChannelUrl, schedule } = ONCHAIN_CASH_SHOW;
  return {
    channelId: youtubeChannelId,
    channelUrl: youtubeChannelUrl,
    liveEmbedUrl: `https://www.youtube-nocookie.com/embed/live_stream?channel=${youtubeChannelId}`,
    schedule: { ...schedule },
    hosts: ONCHAIN_CASH_HOSTS,
    segments: ONCHAIN_CASH_SEGMENTS,
    source: 'youtube-rss',
  };
}

showRouter.get('/show', async (req, res) => {
  const force = req.query.refresh === '1';
  if (!force && cache && Date.now() - cache.ts < CACHE_MS) {
    return res.json({ ...cache.data, cached: true });
  }

  try {
    const episodes = await fetchOnchainCashEpisodes();
    const data: ShowData = {
      ...baseData(),
      episodes,
      lastUpdated: new Date().toISOString(),
      cached: false,
      ...(episodes.length === 0 ? { error: 'empty_feed' as const } : {}),
    };
    cache = { data, ts: Date.now() };
    return res.json(data);
  } catch (error) {
    console.error('[show] YouTube RSS failed:', error);
    if (cache) return res.json({ ...cache.data, cached: true });
    const data: ShowData = {
      ...baseData(),
      episodes: [],
      lastUpdated: new Date().toISOString(),
      cached: false,
      error: 'fetch_failed',
    };
    return res.status(502).json(data);
  }
});

/**
 * Topic suggestions for the next show.
 * Set SHOW_TOPIC_EMAIL in .env — submissions are emailed there (FormSubmit).
 * Optional: SHOW_TOPIC_WEBHOOK_URL for Discord/Slack in addition or instead.
 * The destination is never exposed to the browser.
 *
 * First submission to a new address triggers a FormSubmit activation email —
 * click Confirm once, then every later submit lands in the inbox.
 */
function formSubmitSiteOrigin(req: { get(name: string): string | undefined; protocol: string }): string {
  const fromEnv =
    process.env.SHOW_TOPIC_SITE_URL?.trim() ||
    process.env.PUBLIC_SITE_URL?.trim() ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL.trim()}` : '');
  if (fromEnv) return fromEnv.replace(/\/$/, '');

  const origin = req.get('origin')?.trim();
  if (origin) return origin.replace(/\/$/, '');

  const referer = req.get('referer')?.trim();
  if (referer) {
    try {
      return new URL(referer).origin;
    } catch {
      /* ignore */
    }
  }

  const host = req.get('x-forwarded-host')?.trim() || req.get('host')?.trim();
  if (host) {
    const proto = (req.get('x-forwarded-proto')?.trim() || req.protocol || 'https').split(',')[0]?.trim();
    return `${proto}://${host}`.replace(/\/$/, '');
  }

  return 'https://onchaincash.app';
}

function isDeliveryWebhook(url: string): boolean {
  return /^https:\/\/(discord(?:app)?\.com\/api\/webhooks|hooks\.slack\.com)\//i.test(url);
}

function formSubmitSucceeded(
  response: Response,
  parsed: { success?: string | boolean; message?: string } | null,
  raw: string,
): boolean {
  const message = String(parsed?.message ?? raw);
  if (/activ/i.test(message)) return true;

  const successFlag = parsed?.success;
  const okFlag =
    successFlag === true ||
    successFlag === 'true' ||
    (typeof successFlag === 'string' && successFlag.toLowerCase() === 'true');

  if (parsed && successFlag !== undefined) return okFlag;
  return response.ok;
}

showRouter.post('/show/topic', async (req, res) => {
  const topic = String(req.body?.topic ?? '').trim().slice(0, 200);
  const reason = String(req.body?.reason ?? '').trim().slice(0, 800);
  if (!topic) return res.status(400).json({ ok: false, error: 'topic_required' });

  const email = process.env.SHOW_TOPIC_EMAIL?.trim() || SHOW_TOPIC_INBOX_EMAIL;
  const webhookRaw = process.env.SHOW_TOPIC_WEBHOOK_URL?.trim();
  const webhook = webhookRaw && isDeliveryWebhook(webhookRaw) ? webhookRaw : undefined;
  if (webhookRaw && !webhook) {
    console.warn('[show-topic] ignoring invalid SHOW_TOPIC_WEBHOOK_URL (use a Discord/Slack webhook URL)');
  }

  const payload = {
    topic,
    reason: reason || null,
    submittedAt: new Date().toISOString(),
    source: 'onchain-cash-show',
  };

  if (!email && !webhook) {
    console.warn('[show-topic] no delivery target configured');
    return res.status(503).json({ ok: false, error: 'email_not_configured' });
  }

  let emailed = false;

  try {
    if (email) {
      // FormSubmit rejects server-side posts without a browser-like Origin/Referer.
      const siteOrigin = formSubmitSiteOrigin(req);
      const response = await fetch(`https://formsubmit.co/ajax/${encodeURIComponent(email)}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          Origin: siteOrigin,
          Referer: `${siteOrigin}/show`,
          'User-Agent': 'Mozilla/5.0 (compatible; ONCHAIN-CASH/1.0)',
        },
        body: JSON.stringify({
          _subject: `ONCHAIN CA$H — topic suggestion: ${topic.slice(0, 80)}`,
          _template: 'table',
          _captcha: 'false',
          _honey: '',
          name: 'ONCHAIN CA$H Show',
          email: 'show-topics@onchain.cash',
          message: [`Topic: ${topic}`, `Why: ${reason || '—'}`, `At: ${payload.submittedAt}`].join('\n'),
          topic,
          reason: reason || '—',
          submittedAt: payload.submittedAt,
        }),
        signal: AbortSignal.timeout(15_000),
      });

      const raw = await response.text().catch(() => '');
      let parsed: { success?: string | boolean; message?: string } | null = null;
      try {
        parsed = raw ? (JSON.parse(raw) as { success?: string | boolean; message?: string }) : null;
      } catch {
        parsed = null;
      }

      if (formSubmitSucceeded(response, parsed, raw)) {
        emailed = true;
        if (/activ/i.test(String(parsed?.message ?? raw))) {
          console.warn(
            '[show-topic] FormSubmit sent an activation email — open the inbox and click Activate once',
          );
        } else {
          console.info('[show-topic] emailed via FormSubmit');
        }
      } else {
        throw new Error(
          `FormSubmit failed HTTP ${response.status}${raw ? `: ${raw.slice(0, 240)}` : ''}`,
        );
      }
    }

    if (webhook) {
      try {
        const isDiscord = /discord(?:app)?\.com\/api\/webhooks/i.test(webhook);
        const body = isDiscord
          ? {
              content: [
                '**ONCHAIN CA$H — topic suggestion**',
                `**Topic:** ${topic}`,
                `**Why:** ${reason || '—'}`,
              ].join('\n'),
            }
          : payload;

        const response = await fetch(webhook, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          body: JSON.stringify(body),
          signal: AbortSignal.timeout(10_000),
        });
        if (!response.ok) throw new Error(`Webhook HTTP ${response.status}`);
      } catch (error) {
        console.error('[show-topic] webhook delivery failed:', error);
        if (!emailed) throw error;
      }
    }

    if (!emailed && !webhook) {
      return res.status(502).json({ ok: false, error: 'delivery_failed' });
    }

    return res.json({ ok: true });
  } catch (error) {
    console.error('[show-topic] delivery failed:', error);
    return res.status(502).json({ ok: false, error: 'delivery_failed' });
  }
});
