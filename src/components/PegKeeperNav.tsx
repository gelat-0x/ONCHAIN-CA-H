function scrollToSection(id: string) {
  const el = document.getElementById(id);
  if (!el) return;
  el.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

export function PegKeeperNav() {
  return (
    <nav className="pegkeeper-nav" aria-label="PegKeeper sections">
      <button type="button" className="pegkeeper-nav__btn" onClick={() => scrollToSection('pegkeeper-pools')}>
        Explore pools
      </button>
      <button type="button" className="pegkeeper-nav__btn" onClick={() => scrollToSection('pegkeeper-orbit')}>
        Explore orbit
      </button>
      <button type="button" className="pegkeeper-nav__btn pegkeeper-nav__btn--accent" onClick={() => scrollToSection('pegkeeper-about')}>
        Learn about PegKeepers
      </button>
    </nav>
  );
}
