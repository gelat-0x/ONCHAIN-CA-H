import type { ReactNode } from 'react';
import { LoadingScreen } from './LoadingScreen';

interface PageGateProps {
  ready: boolean;
  message?: string;
  children?: ReactNode;
}

/** Block incomplete page chrome behind the spinning Frax mark until ready. */
export function PageGate({ ready, message = 'Loading…', children = null }: PageGateProps) {
  if (!ready) {
    return <LoadingScreen cover message={message} />;
  }
  return <>{children}</>;
}
