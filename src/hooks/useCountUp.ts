import { useEffect, useRef } from 'react';
import { CountUp } from 'countup.js';

interface UseCountUpOptions {
  end: number;
  duration?: number;
  decimals?: number;
  prefix?: string;
  suffix?: string;
  start?: boolean;
  /** Custom renderer for each frame — lets callers reuse compact USD formatting. */
  formattingFn?: (value: number) => string;
}

export function useCountUp({
  end,
  duration = 2,
  decimals = 0,
  prefix = '',
  suffix = '',
  start = true,
  formattingFn,
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
      ...(formattingFn ? { formattingFn } : {}),
    });

    if (!countUp.error) {
      countUp.start();
    }
  }, [end, duration, decimals, prefix, suffix, start]);

  return ref;
}
