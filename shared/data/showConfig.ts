import type { ShowHost, ShowSegment } from '../types/index.ts';

export const ONCHAIN_CASH_SHOW = {
  youtubeHandle: '@ONCHAINCASH',
  youtubeChannelId: 'UCn0X6G0l4y3hlXdW1A7dWBA',
  youtubeChannelUrl: 'https://www.youtube.com/@ONCHAINCASH',
  xUrl: 'https://x.com/FraxForce',
  fraxForceHandle: '@FraxForce',
  schedule: {
    weekdayUtc: 6, // Saturday
    hourUtc: 18,
    minuteUtc: 0,
    liveWindowMinutes: 180,
  },
} as const;

/** Episode hosts — first two on every episode; Royal only on the May 30 episode. */
export const ONCHAIN_CASH_HOSTS: ShowHost[] = [
  { name: 'Juan Román Acacio', handle: '@Smallro_man', url: 'https://x.com/Smallro_man' },
  { name: 'Captn', handle: '@captnhayz', url: 'https://x.com/captnhayz' },
  { name: 'Royal', handle: '@royal1dd', url: 'https://x.com/royal1dd' },
];

/** ISO date prefix for the episode that includes all three hosts (May 30 / Episode 7). */
export const SHOW_FULL_HOSTS_EPISODE_DATE = '2026-05-30';

export function hostsForEpisode(
  publishedAt: string,
  hosts: ShowHost[] = ONCHAIN_CASH_HOSTS,
): ShowHost[] {
  if (publishedAt.startsWith(SHOW_FULL_HOSTS_EPISODE_DATE)) return hosts;
  return hosts.slice(0, 2);
}

/** Show coverage sections — wording kept as provided (spelling lightly cleaned). */
export const ONCHAIN_CASH_SEGMENTS: ShowSegment[] = [
  {
    name: 'Onchain Pulse',
    description: 'One special metric every week',
  },
  {
    name: 'Market Briefing',
    description: 'Overall industry process breakdown of the week',
  },
  {
    name: 'FUD Filter',
    description:
      "There are always rumors and fud, we talk it down what we see as noise so you don't get distracted on what happens weekly",
  },
  {
    name: 'Frax Ecosystem Update',
    description: 'highlighting all new things that happened',
  },
  {
    name: 'DeFi Yield radar',
    description: 'shilling you the best yield environments to earn on your money',
  },
  {
    name: "X / CharmanderX81's Corner: Live Market TA",
    description:
      'One of our FraxForce members gives you a live technical analysis on Major Asset charts like ETH and FRAX',
    url: 'https://x.com/CharmanderX81',
    linkLabel: 'X / CharmanderX81',
  },
  {
    name: 'Frax Force ALPHA CALL',
    description: 'Giving you the latest alpha we spotted!',
  },
];
