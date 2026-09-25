import { STUDIO_BACKGROUNDS } from '../../../shared/constants/studioBackgrounds';

interface StudioStylePanelProps {
  backgroundId: string;
  onBackgroundChange: (id: string) => void;
}

export function StudioStylePanel({ backgroundId, onBackgroundChange }: StudioStylePanelProps) {
  return (
    <div className="studio-style-panel">
      <span className="studio-style-panel__label">Background</span>
      <div className="studio-style-panel__grid" role="radiogroup" aria-label="Export background">
        {STUDIO_BACKGROUNDS.map((bg) => (
          <button
            key={bg.id}
            type="button"
            role="radio"
            aria-checked={backgroundId === bg.id}
            className={`studio-style-panel__thumb ${backgroundId === bg.id ? 'studio-style-panel__thumb--active' : ''}`}
            onClick={() => onBackgroundChange(bg.id)}
            title={bg.label}
          >
            <img src={bg.src} alt="" loading="lazy" />
            <span className="studio-style-panel__thumb-label">{bg.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
