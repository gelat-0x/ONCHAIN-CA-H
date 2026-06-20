import { useCountUp } from '../hooks/useCountUp';
import { useIntersection } from '../hooks/useIntersection';

interface CountUpNumberProps {
  end: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  className?: string;
}

export function CountUpNumber({
  end,
  prefix = '',
  suffix = '',
  decimals = 0,
  className = '',
}: CountUpNumberProps) {
  const { ref: intersectionRef, visible } = useIntersection();
  const countRef = useCountUp({ end, prefix, suffix, decimals, start: visible });

  return (
    <span ref={intersectionRef}>
      <span ref={countRef} className={className}>
        {prefix}0{suffix}
      </span>
    </span>
  );
}
