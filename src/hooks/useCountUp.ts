import { useEffect, useRef } from 'react';
import { CountUp } from 'countup.js';

interface UseCountUpOptions {
  end: number;
  duration?: number;
  decimals?: number;
  prefix?: string;
  suffix?: string;
  start?: boolean;
}

export function useCountUp({
  end,
  duration = 2,
  decimals = 0,
  prefix = '',
  suffix = '',
  start = true,
}: UseCountUpOptions) {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!start || !ref.current) return;

    const countUp = new CountUp(ref.current, end, {
      duration,
      decimalPlaces: decimals,
      prefix,
      suffix,
      useGrouping: true,
    });

    if (!countUp.error) {
      countUp.start();
    }
  }, [end, duration, decimals, prefix, suffix, start]);

  return ref;
}
