interface LogoProps {
  size?: 'sm' | 'lg';
}

export function Logo({ size = 'sm' }: LogoProps) {
  const cls = size === 'lg' ? 'logo-brutal logo-brutal--lg' : 'logo-brutal logo-brutal--sm';

  return (
    <span className={cls} aria-label="ONCHAIN CA$H">
      ONCHAIN <span className="logo-brutal__cash">CA$H</span>
    </span>
  );
}
