import type { CSSProperties } from 'react';
import fraxLogoLoader from '../assets/frax-logo-loader.png';

interface LoadingScreenProps {
  message?: string;
  inline?: boolean;
  /** Full-viewport cover — hides incomplete page content underneath. */
  cover?: boolean;
  className?: string;
  style?: CSSProperties;
}

export function LoadingScreen({
  message = 'Loading…',
  inline = false,
  cover = false,
  className = '',
  style,
}: LoadingScreenProps) {
  const rootClass = [
    'loading-screen',
    inline ? 'loading-screen--inline' : '',
    cover ? 'loading-screen--cover' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={rootClass} style={style} role="status" aria-live="polite" aria-busy="true">
      <div className={`loader-mark ${inline && !cover ? 'loader-mark--inline' : ''}`} aria-hidden>
        <img src={fraxLogoLoader} alt="" className="loader-mark__logo" draggable={false} />
      </div>
      {message ? <span className="loader-text">{message}</span> : null}
    </div>
  );
}
