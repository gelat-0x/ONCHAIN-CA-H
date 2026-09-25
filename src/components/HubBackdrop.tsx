import { useState } from 'react';

/** Background layer for the PegKeeper partner orbit — same hub video as the start page. */
export function HubBackdrop() {
  const [videoOk, setVideoOk] = useState(true);

  return (
    <div className="hub-backdrop" aria-hidden>
      {videoOk && (
        <video
          className="hub-backdrop__video"
          src="/backgrounds/hub/0701.mp4"
          autoPlay
          muted
          loop
          playsInline
          onError={() => setVideoOk(false)}
        />
      )}
      <div className="hub-backdrop__scrim" />
    </div>
  );
}
