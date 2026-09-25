import { useState } from 'react';

/** Faint hub video — same asset as the start page hero. */
export function StudioBackdrop() {
  const [videoOk, setVideoOk] = useState(true);

  return (
    <div className="studio-backdrop" aria-hidden>
      {videoOk && (
        <video
          className="studio-backdrop__video"
          src="/backgrounds/hub/0701.mp4"
          autoPlay
          muted
          loop
          playsInline
          onError={() => setVideoOk(false)}
        />
      )}
      <div className="studio-backdrop__scrim" />
    </div>
  );
}
