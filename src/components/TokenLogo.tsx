import { useMemo } from 'react';
import { resolveTokenLogoUrl } from '../lib/tokenLogos';

type TokenLogoSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';

const SIZE_CLASS: Record<TokenLogoSize, string> = {
  xs: 'token-logo--xs',
  sm: 'token-logo--sm',
  md: 'token-logo--md',
  lg: 'token-logo--lg',
  xl: 'token-logo--xl',
  '2xl': 'token-logo--2xl',
};

interface TokenLogoProps {
  symbol: string;
  poolId?: string;
  fallbackInitials?: string;
  fallbackColor?: string;
  size?: TokenLogoSize;
  className?: string;
  alt?: string;
  /** Load immediately — required inside offscreen export canvases. */
  eager?: boolean;
}

export function TokenLogo({
  symbol,
  poolId,
  fallbackInitials,
  fallbackColor = '#888888',
  size = 'md',
  className = '',
  alt,
  eager = false,
}: TokenLogoProps) {
  const src = useMemo(() => resolveTokenLogoUrl(symbol, poolId), [symbol, poolId]);
  const initials =
    fallbackInitials ??
    (symbol.replace(/[^a-zA-Z0-9]/g, '').slice(0, 2).toUpperCase() || '?');

  const classes = [
    'token-logo',
    SIZE_CLASS[size],
    src ? 'token-logo--has-img' : 'token-logo--fallback',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div
      className={classes}
      style={
        src
          ? undefined
          : {
              background: `${fallbackColor}18`,
              color: fallbackColor,
              borderColor: `${fallbackColor}44`,
            }
      }
      aria-hidden={alt ? undefined : true}
    >
      {src ? (
        <img
          src={src}
          alt={alt ?? `${symbol} logo`}
          className="token-logo__img"
          loading={eager ? 'eager' : 'lazy'}
          decoding={eager ? 'sync' : 'async'}
        />
      ) : (
        <span className="token-logo__initials">{initials}</span>
      )}
    </div>
  );
}
