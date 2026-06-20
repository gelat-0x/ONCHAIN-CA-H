import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { DotBarViz } from './ui/DotBarViz';

const TRACKS = [
  { id: 'terminal-pulse', title: 'Terminal Pulse', src: '/audio/terminal-pulse.wav' },
  { id: 'liquidity-drift', title: 'Liquidity Drift', src: '/audio/liquidity-drift.wav' },
  { id: 'peg-keeper', title: 'Peg Keeper', src: '/audio/peg-keeper.wav' },
];

export function AudioPlayer() {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [trackIdx, setTrackIdx] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [volume, setVolume] = useState(0.45);
  const [open, setOpen] = useState(false);
  const [vizTick, setVizTick] = useState(0);

  const track = TRACKS[trackIdx];

  const dotValues = useMemo(() => {
    if (!playing) {
      return Array.from({ length: 28 }, (_, i) => 0.08 + (i / 28) * 0.35);
    }
    return Array.from({ length: 28 }, (_, i) => {
      const wobble = Math.sin(i * 0.45 + vizTick * 0.35) * 0.22;
      return Math.min(1, 0.35 + wobble + Math.random() * 0.35);
    });
  }, [playing, vizTick]);

  useEffect(() => {
    if (!playing) return;
    const id = setInterval(() => setVizTick((t) => t + 1), 120);
    return () => clearInterval(id);
  }, [playing]);

  const play = useCallback(async () => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.volume = volume;
    try {
      await audio.play();
      setPlaying(true);
    } catch {
      setPlaying(false);
    }
  }, [volume]);

  const pause = useCallback(() => {
    audioRef.current?.pause();
    setPlaying(false);
  }, []);

  const toggle = () => (playing ? pause() : play());

  const next = useCallback(() => {
    setTrackIdx((i) => (i + 1) % TRACKS.length);
    setPlaying(true);
  }, []);

  const prev = useCallback(() => {
    setTrackIdx((i) => (i - 1 + TRACKS.length) % TRACKS.length);
    setPlaying(true);
  }, []);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.volume = volume;
    if (playing) audio.play().catch(() => setPlaying(false));
    else audio.pause();
  }, [trackIdx, volume, playing]);

  useEffect(() => {
    const handler = () => { setOpen(true); if (!playing) play(); };
    window.addEventListener('onchain-play-music', handler);
    return () => window.removeEventListener('onchain-play-music', handler);
  }, [playing, play]);

  return createPortal(
    <>
      <audio ref={audioRef} src={track.src} preload="auto" loop />

      {/* BOTTOM DOCK — always visible */}
      <div className="music-dock">
        <div className="music-dock__left">
          <span className="music-dock__brand">♪ ONCHAIN RADIO</span>
          <span className="music-dock__track">{track.title}</span>
        </div>
        <div className="music-dock__controls">
          <button type="button" className="music-dock__nav" onClick={prev}>‹</button>
          <button type="button" className="music-dock__play" onClick={toggle}>
            {playing ? '❚❚ PAUSE' : '▶ PLAY'}
          </button>
          <button type="button" className="music-dock__nav" onClick={next}>›</button>
          <button type="button" className="music-dock__tracks" onClick={() => setOpen((o) => !o)}>
            TRACKS
          </button>
        </div>
      </div>

      {/* FLOATING FAB — backup, top-right of dock area */}
      <button
        type="button"
        className={`music-fab ${playing ? 'music-fab--on' : ''}`}
        onClick={() => { setOpen(true); toggle(); }}
        aria-label="Musik abspielen"
      >
        <span className="music-fab__icon">{playing ? '❚❚' : '▶'}</span>
        <span className="music-fab__text">MUSIC</span>
        {playing && <span className="music-fab__pulse" />}
      </button>

      {open && (
        <div className="music-panel">
          <div className="music-panel__header">
            <div>
              <div className="music-panel__brand">ONCHAIN CA$H RADIO</div>
              <div className="music-panel__track">{track.title}</div>
            </div>
            <button type="button" className="music-panel__close" onClick={() => setOpen(false)}>✕</button>
          </div>

          <DotBarViz values={dotValues} columns={28} activeFrom={playing ? 0 : 14} />

          <div className="music-panel__controls">
            <button type="button" onClick={prev}>‹</button>
            <button type="button" className="music-panel__play" onClick={toggle}>
              {playing ? 'PAUSE' : 'PLAY'}
            </button>
            <button type="button" onClick={next}>›</button>
          </div>

          <div className="music-panel__tracks">
            {TRACKS.map((t, i) => (
              <button
                key={t.id}
                type="button"
                className={`music-panel__track-btn ${i === trackIdx ? 'active' : ''}`}
                onClick={() => { setTrackIdx(i); setPlaying(true); }}
              >
                {t.title}
              </button>
            ))}
          </div>

          <input
            type="range" min={0} max={1} step={0.05}
            value={volume}
            onChange={(e) => setVolume(+e.target.value)}
            className="music-panel__vol"
            aria-label="Volume"
          />
        </div>
      )}

      {open && <div className="music-panel__backdrop" onClick={() => setOpen(false)} />}
    </>,
    document.body,
  );
}
