import { useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu } from 'lucide-react';
import { Logo } from './Logo';
import { HeaderSettings } from './HeaderSettings';

const NAV = [
  { to: '/', label: 'Start' },
  { to: '/show', label: 'Show' },
  { to: '/pegkeeper', label: 'PegKeeper' },
  { to: '/studio', label: 'Studio' },
  { to: '/learn', label: 'Learn' },
] as const;

type DirectoryItem =
  | {
      kind: 'link';
      label: string;
      to: string;
      children?: { label: string; to: string }[];
    }
  | {
      kind: 'soon';
      label: string;
    };

const DIRECTORY: DirectoryItem[] = [
  { kind: 'link', label: 'Start', to: '/' },
  { kind: 'link', label: 'Show', to: '/show' },
  { kind: 'link', label: 'PegKeeper', to: '/pegkeeper' },
  { kind: 'link', label: 'Studio', to: '/studio' },
  {
    kind: 'link',
    label: 'Learn',
    to: '/learn',
    children: [
      { label: 'The Beginner', to: '/learn/the-beginner' },
      { label: 'What is Money?', to: '/learn/what-is-money' },
      { label: 'What is Blockchain?', to: '/learn/what-is-blockchain' },
      { label: 'What is a Stablecoin?', to: '/learn/what-is-stablecoins' },
      { label: 'What is Frax?', to: '/learn/what-is-frax' },
      { label: 'Explore Better Money', to: '/learn/explore-better-money' },
      { label: 'The Business', to: '/learn/the-business' },
    ],
  },
  { kind: 'soon', label: 'Dashboard' },
  { kind: 'soon', label: 'News' },
];

export function Header() {
  const { pathname } = useLocation();
  const [open, setOpen] = useState(false);
  const [learnOpen, setLearnOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setOpen(false);
    setLearnOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!open) return;

    const onPointerDown = (event: MouseEvent) => {
      if (!panelRef.current?.contains(event.target as Node)) {
        setOpen(false);
        setLearnOpen(false);
      }
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false);
        setLearnOpen(false);
      }
    };

    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  return (
    <header className="site-header">
      <Link to="/" className="header-logo"><Logo /></Link>

      <nav className="header-nav" aria-label="Primary">
        {NAV.map((n) => {
          const active =
            n.to === '/learn'
              ? pathname.startsWith('/learn')
              : pathname === n.to;

          return (
            <Link
              key={n.to}
              to={n.to}
              className={active ? 'active' : ''}
            >
              {n.label}
            </Link>
          );
        })}
      </nav>

      <div className="header-right" ref={panelRef}>
        <div className="header-directory">
          <button
            type="button"
            className={`header-directory__btn header-directory__btn--icon${open ? ' is-open' : ''}`}
            aria-expanded={open}
            aria-controls="header-directory-panel"
            aria-label="Menu"
            onClick={() => setOpen((value) => !value)}
          >
            <Menu size={16} strokeWidth={2.2} aria-hidden />
          </button>

          {open ? (
            <div
              id="header-directory-panel"
              className="header-directory__panel"
              role="menu"
              aria-label="Site map"
            >
              <div className="header-directory__head">
                <span>On this surface</span>
              </div>

              <ul className="header-directory__list">
                {DIRECTORY.map((item) => {
                  if (item.kind === 'soon') {
                    return (
                      <li key={item.label} className="header-directory__item header-directory__item--soon">
                        <span className="header-directory__label">{item.label}</span>
                        <span className="header-directory__pill">Soon</span>
                      </li>
                    );
                  }

                  const hasChildren = Boolean(item.children?.length);
                  const isLearn = item.to === '/learn';
                  const expanded = isLearn && learnOpen;
                  const active = isLearn
                    ? pathname.startsWith('/learn')
                    : pathname === item.to;

                  return (
                    <li
                      key={item.to}
                      className={`header-directory__item${active ? ' is-active' : ''}${expanded ? ' is-expanded' : ''}`}
                      onMouseEnter={() => {
                        if (hasChildren) setLearnOpen(true);
                      }}
                      onMouseLeave={() => {
                        if (hasChildren) setLearnOpen(false);
                      }}
                    >
                      <div className="header-directory__row">
                        <Link
                          to={item.to}
                          className="header-directory__link"
                          role="menuitem"
                          onClick={() => setOpen(false)}
                        >
                          {item.label}
                        </Link>

                        {hasChildren ? (
                          <button
                            type="button"
                            className={`header-directory__dot${expanded ? ' is-on' : ''}`}
                            aria-label={expanded ? 'Hide Learn paths' : 'Show Learn paths'}
                            aria-expanded={expanded}
                            onClick={() => setLearnOpen((value) => !value)}
                          />
                        ) : null}
                      </div>

                      {hasChildren && expanded ? (
                        <ul className="header-directory__sub">
                          {item.children!.map((child) => (
                            <li key={child.to}>
                              <Link
                                to={child.to}
                                className={
                                  pathname === child.to
                                    ? 'header-directory__sub-link is-active'
                                    : 'header-directory__sub-link'
                                }
                                onClick={() => setOpen(false)}
                              >
                                {child.label}
                              </Link>
                            </li>
                          ))}
                        </ul>
                      ) : null}
                    </li>
                  );
                })}
              </ul>
            </div>
          ) : null}
        </div>

        <HeaderSettings />
      </div>
    </header>
  );
}
