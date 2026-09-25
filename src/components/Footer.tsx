import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import fraxForceCrest from '../assets/frax-force-crest.webp';
import xLogo from '../assets/social/x.svg';
import discordLogo from '../assets/social/discord.svg';
import { FRAX_FORCE_DISCORD_URL, FRAX_FORCE_X_URL } from '../../shared/constants/socialLinks.ts';

const SITE_LINKS = [
  { to: '/', label: 'Start' },
  { to: '/show', label: 'Show' },
  { to: '/pegkeeper', label: 'PegKeeper' },
  { to: '/studio', label: 'Studio' },
  { to: '/learn', label: 'Learn' },
] as const;

interface FooterProps {
  /** Home snap: hide until the footer section is actually in view — then show full footer instantly. */
  deferUntilVisible?: boolean;
}

export function Footer({ deferUntilVisible = false }: FooterProps) {
  const rootRef = useRef<HTMLElement>(null);
  const [visible, setVisible] = useState(!deferUntilVisible);

  useEffect(() => {
    if (!deferUntilVisible) {
      setVisible(true);
      return;
    }

    const el = rootRef.current;
    if (!el) return;

    const sync = (ratio: number) => {
      setVisible(ratio >= 0.45);
    };

    const observer = new IntersectionObserver(
      ([entry]) => {
        sync(entry?.intersectionRatio ?? 0);
      },
      { threshold: [0, 0.25, 0.45, 0.65, 1] },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [deferUntilVisible]);

  return (
    <footer
      ref={rootRef}
      className={`footer${visible ? '' : ' footer--deferred'}`}
      aria-hidden={!visible}
    >
      <div className="footer-inner">
        <div className="footer-brand">
          <img src={fraxForceCrest} alt="Frax Force" className="footer-crest" />
          <div className="footer-brand__copy">
            <p className="footer-legal">Built as a public good by Frax Force community members.</p>
            <p className="footer-legal">
              This website is for informational purposes only, not financial advice.
            </p>
            <span className="footer-beta">Still in beta</span>
          </div>
        </div>

        <div className="footer-aside">
          <nav className="footer-legend" aria-label="Site">
            {SITE_LINKS.map((link) => (
              <Link key={link.to} to={link.to}>
                {link.label}
              </Link>
            ))}
          </nav>
          <div className="footer-social">
            <a
              href={FRAX_FORCE_X_URL}
              className="footer-social__link"
              target="_blank"
              rel="noopener noreferrer"
            >
              <img src={xLogo} alt="" className="footer-social__glyph" aria-hidden />
              <span className="footer-social__label">Follow on X</span>
            </a>
            <a
              href={FRAX_FORCE_DISCORD_URL}
              className="footer-social__link"
              target="_blank"
              rel="noopener noreferrer"
            >
              <img src={discordLogo} alt="" className="footer-social__glyph" aria-hidden />
              <span className="footer-social__label">Follow on Discord</span>
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
