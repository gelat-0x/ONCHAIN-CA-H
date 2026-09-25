import { forwardRef, type ReactNode } from 'react';
import { STUDIO_EXPORT_HEIGHT, STUDIO_EXPORT_WIDTH } from '../../lib/studioExport';
import { studioToneClass } from '../../lib/studioTone';
import { studioBackgroundBase } from '../../../shared/constants/studioBackgrounds';
import { StudioCanvasBackground } from './StudioCanvasBackground';

interface StudioCanvasShellProps {
  backgroundId: string;
  topicMain: string;
  topicSub?: string;
  badges?: ReactNode;
  className?: string;
  children: ReactNode;
}

export const StudioCanvasShell = forwardRef<HTMLDivElement, StudioCanvasShellProps>(
  function StudioCanvasShell(
    { backgroundId, topicMain, topicSub, badges, className, children },
    ref,
  ) {
    const dateLabel = new Date().toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });

    return (
      <div
        ref={ref}
        className={`studio-canvas ${studioToneClass(backgroundId)} ${className ?? ''}`.trim()}
        style={{
          width: STUDIO_EXPORT_WIDTH,
          height: STUDIO_EXPORT_HEIGHT,
          backgroundColor: studioBackgroundBase(backgroundId),
        }}
      >
        <StudioCanvasBackground backgroundId={backgroundId} />

        <header className="studio-canvas__head">
          <div className="studio-canvas__context">
            <span className="studio-canvas__topic-main">{topicMain}</span>
            {topicSub && <span className="studio-canvas__topic-sub">{topicSub}</span>}
          </div>
          {badges && <div className="studio-canvas__badges">{badges}</div>}
        </header>

        <div className="studio-canvas__body">{children}</div>

        <footer className="studio-canvas__foot">
          <span className="studio-canvas__foot-source">{dateLabel}</span>
          <span className="studio-canvas__foot-credit">
            created with ONCHAIN CA$H Content studio
          </span>
        </footer>
      </div>
    );
  },
);
