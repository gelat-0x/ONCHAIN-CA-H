interface HomeSectionRailProps {
  sections: { id: string; label: string }[];
  active: number;
  onJump: (idx: number) => void;
}

export function HomeSectionRail({ sections, active, onJump }: HomeSectionRailProps) {
  return (
    <nav className="home-rail" aria-label="Section navigation">
      {sections.map((s, i) => (
        <button
          key={s.id}
          type="button"
          className={`home-rail__dot ${i === active ? 'home-rail__dot--active' : ''}`}
          onClick={() => onJump(i)}
          aria-label={s.label}
          aria-current={i === active}
        >
          <span className="home-rail__label">{s.label}</span>
        </button>
      ))}
    </nav>
  );
}
