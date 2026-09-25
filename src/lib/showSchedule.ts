import { ONCHAIN_CASH_SHOW } from '../../shared/data/showConfig.ts';

export interface ShowSchedule {
  weekdayUtc: number;
  hourUtc: number;
  minuteUtc: number;
  liveWindowMinutes: number;
}

export interface CountdownState {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  isLive: boolean;
  nextEpisodeAt: string;
}

export function getShowCountdown(
  now: Date,
  schedule: ShowSchedule = ONCHAIN_CASH_SHOW.schedule,
): CountdownState {
  const start = new Date(now);
  start.setUTCSeconds(0, 0);
  start.setUTCHours(schedule.hourUtc, schedule.minuteUtc, 0, 0);

  const currentDay = now.getUTCDay();
  const daysUntil = (schedule.weekdayUtc - currentDay + 7) % 7;
  start.setUTCDate(now.getUTCDate() + daysUntil);

  if (daysUntil === 0 && now.getTime() >= start.getTime()) {
    const liveEndsAt = start.getTime() + schedule.liveWindowMinutes * 60_000;
    if (now.getTime() < liveEndsAt) {
      return {
        days: 0,
        hours: 0,
        minutes: 0,
        seconds: 0,
        isLive: true,
        nextEpisodeAt: start.toISOString(),
      };
    }
    start.setUTCDate(start.getUTCDate() + 7);
  }

  const diff = Math.max(0, start.getTime() - now.getTime());
  return {
    days: Math.floor(diff / 86_400_000),
    hours: Math.floor((diff % 86_400_000) / 3_600_000),
    minutes: Math.floor((diff % 3_600_000) / 60_000),
    seconds: Math.floor((diff % 60_000) / 1_000),
    isLive: false,
    nextEpisodeAt: start.toISOString(),
  };
}
