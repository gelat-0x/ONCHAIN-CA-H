import { useEffect, useState } from 'react';
import { ONCHAIN_CASH_SHOW } from '../../shared/data/showConfig.ts';
import { getShowCountdown, type ShowSchedule } from '../lib/showSchedule';

interface LiveCountdownProps {
  schedule?: ShowSchedule;
  label?: string;
}

export function LiveCountdown({
  schedule = ONCHAIN_CASH_SHOW.schedule,
  label = 'Next livestream starts in:',
}: LiveCountdownProps) {
  const [countdown, setCountdown] = useState(() => getShowCountdown(new Date(), schedule));

  useEffect(() => {
    const update = () => setCountdown(getShowCountdown(new Date(), schedule));
    update();
    const interval = window.setInterval(update, 1_000);
    return () => window.clearInterval(interval);
  }, [schedule]);

  if (countdown.isLive) {
    return (
      <div className="countdown-live" role="status">
        <span className="live-dot" aria-hidden="true" /> LIVE WINDOW · Saturday at 6 PM UTC
      </div>
    );
  }

  const units = [
    ['days', countdown.days],
    ['hours', countdown.hours],
    ['min', countdown.minutes],
    ['sec', countdown.seconds],
  ] as const;

  return (
    <div className="countdown" role="timer" aria-live="polite">
      <div className="countdown-label">{label}</div>
      <div className="countdown-timer">
        {units.map(([unit, value]) => (
          <div className="time-unit" key={unit}>
            <span className="time-value">{String(value).padStart(unit === 'days' ? 1 : 2, '0')}</span>
            <span className="time-label">{unit}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
