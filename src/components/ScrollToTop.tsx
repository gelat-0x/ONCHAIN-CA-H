import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/** Always land at the top when navigating between pages. */
export function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    const html = document.documentElement;
    const prev = html.style.scrollBehavior;
    html.style.scrollBehavior = 'auto';
    window.scrollTo(0, 0);
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
    html.style.scrollBehavior = prev;
  }, [pathname]);

  return null;
}
