import type { ReactNode } from 'react';

interface StudioCanvasChromeProps {
  topicMain: string;
  topicSub?: string;
  badges?: ReactNode;
  sourceLine?: string;
}

export function StudioCanvasChrome({
  topicMain,
  topicSub,
  badges,
  sourceLine,
}: StudioCanvasChromeProps) {
  const dateLabel = new Date().toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <>
      <header className="studio-canvas__head">
        <div className="studio-canvas__context">
          <span className="studio-canvas__topic-main">{topicMain}</span>
          {topicSub && <span className="studio-canvas__topic-sub">{topicSub}</span>}
        </div>
        {badges && <div className="studio-canvas__badges">{badges}</div>}
      </header>

      <footer className="studio-canvas__foot">
        <span className="studio-canvas__foot-source">
          {sourceLine ?? 'defillama'} · {dateLabel}
        </span>
        <span className="studio-canvas__foot-credit">
          created with ONCHAIN CA$H Content studio
        </span>
      </footer>
    </>
  );
}
