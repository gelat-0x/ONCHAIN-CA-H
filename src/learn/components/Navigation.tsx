import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Compass, X } from 'lucide-react';

const navItems: Array<{
  label: string;
  path: string;
  soon?: boolean;
  children?: { label: string; path: string }[];
}> = [
  { label: 'Home', path: '/learn' },
  {
    label: 'The Beginner',
    path: '/learn/the-beginner',
    children: [
      { label: 'What is Money?', path: '/learn/what-is-money' },
      { label: 'What is Blockchain?', path: '/learn/what-is-blockchain' },
      { label: 'What is a Stablecoin?', path: '/learn/what-is-stablecoins' },
      { label: 'What is Frax?', path: '/learn/what-is-frax' },
      { label: 'Explore Better Money', path: '/learn/explore-better-money' },
    ],
  },
  { label: 'The Business', path: '/learn/the-business' },
  { label: 'The Advanced', path: '/learn/the-advanced', soon: true },
  { label: 'History Deep Dive', path: '/learn/history-deep-dive', soon: true },
];

const SoonPill = () => (
  <span className="ml-2 inline-flex items-center px-2 py-[2px] rounded-full bg-secondary border border-border text-[11px] font-medium text-muted-foreground tracking-wide align-middle">
    Soon
  </span>
);

const Navigation = () => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    setIsOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsOpen(false);
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [isOpen]);

  const isActive = (path: string) => location.pathname === path;

  return (
    <>
      <button
        type="button"
        className="learn-path-nav"
        aria-label="Learn path navigator"
        aria-expanded={isOpen}
        onClick={() => setIsOpen(true)}
      >
        <Compass className="learn-path-nav__icon" strokeWidth={2} aria-hidden />
      </button>

      {isOpen ? (
        <div
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
          onClick={() => setIsOpen(false)}
          aria-hidden
        />
      ) : null}

      <div
        className={`learn-path-drawer fixed top-0 right-0 z-50 h-full w-full max-w-md border-l border-border bg-card text-card-foreground transform transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
        role="dialog"
        aria-label="Learn paths"
        aria-hidden={!isOpen}
      >
        <div className="flex items-center justify-between px-6 h-16 border-b border-border">
          <span className="text-[12px] text-muted-foreground uppercase tracking-[0.12em]">
            Learn paths
          </span>
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            aria-label="Close navigator"
            className="p-2 text-foreground"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="px-6 py-8 space-y-2">
          {navItems.map((item) => (
            <div key={item.path}>
              {item.soon ? (
                <span
                  className="block py-2.5 text-[18px] text-muted-foreground cursor-not-allowed select-none"
                  aria-disabled="true"
                >
                  {item.label}
                  <SoonPill />
                </span>
              ) : (
                <Link
                  to={item.path}
                  onClick={() => setIsOpen(false)}
                  className={`block py-2.5 text-[18px] transition-colors ${
                    isActive(item.path)
                      ? 'font-bold text-foreground'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {item.label}
                </Link>
              )}
              {item.children ? (
                <div className="pl-5 space-y-1">
                  {item.children.map((child) => (
                    <Link
                      key={child.path}
                      to={child.path}
                      onClick={() => setIsOpen(false)}
                      className={`block py-1.5 text-[16px] transition-colors ${
                        isActive(child.path)
                          ? 'font-bold text-foreground'
                          : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      {child.label}
                    </Link>
                  ))}
                </div>
              ) : null}
            </div>
          ))}
        </nav>
      </div>
    </>
  );
};

export default Navigation;
