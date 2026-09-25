import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useUiPrefs } from '../context/UiPrefs';
import { DotBarViz } from './ui/DotBarViz';

const TRACKS = [
  {
    id: 'solana-went-down-again',
    title: 'Solana Went Down Again',
    artist: 'Jonathan Mann',
    src: '/audio/solana-went-down-again.mp3',
  },
  {
    id: 'pampamentals',
    title: 'pampamentals',
    artist: 'Ivan on Tech',
    src: '/audio/pampamentals.mp3',
  },
  {
    id: 'we-call-them-poor',
    title: 'We Call Them Poor',
    artist: 'Michael Saylor',
    src: '/audio/we-call-them-poor.mp3',
  },
  {
    id: 'just-a-ponzi-that-i-used-to-hold',
    title: 'Just A Ponzi That I Used To Hold',
    artist: 'Lil Bubble',
    src: '/audio/just-a-ponzi-that-i-used-to-hold.mp3',
  },
] as const;

const COMING_SOON_COPY =
  'The guys just put the antenna up — we’re still building out the radio channel.';

function whenIdle(fn: () => void) {
  const w = window as Window & {
    requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number;
  };
  if (typeof w.requestIdleCallback === 'function') {
    w.requestIdleCallback(fn, { timeout: 4500 });
  } else {
    window.setTimeout(fn, 1400);
  }
}

function bufferPercent(audio: HTMLAudioElement): number {
  if (!audio.duration || !Number.isFinite(audio.duration) || audio.duration <= 0) {
    return audio.readyState >= 3 ? 100 : 0;
  }
  if (!audio.buffered.length) return audio.readyState >= 3 ? 100 : 0;
  const end = audio.buffered.end(audio.buffered.length - 1);
  return Math.min(100, Math.max(0, (end / audio.duration) * 100));
}

export function AudioPlayer() {
  const { onchainRadio, setOnchainRadio } = useUiPrefs();
  const audioRef = useRef<HTMLAudioElement>(null);
  const wantPlayRef = useRef(false);
  const [trackIdx, setTrackIdx] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [volume, setVolume] = useState(0.45);
  const [open, setOpen] = useState(false);
  const [vizTick, setVizTick] = useState(0);
  const [comingSoonOpen, setComingSoonOpen] = useState(false);
  const [warm, setWarm] = useState(false);
  const [loadPct, setLoadPct] = useState(0);
  const [ready, setReady] = useState(false);

  const track = TRACKS[trackIdx];
  const loading = onchainRadio && !ready;

  useEffect(() => {
    setReady(false);
    setLoadPct(0);
  }, [track.src]);

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

  useEffect(() => {
    if (!comingSoonOpen) return;
    const timer = window.setTimeout(() => setComingSoonOpen(false), 5200);
    return () => window.clearTimeout(timer);
  }, [comingSoonOpen]);

  useEffect(() => {
    const start = () => whenIdle(() => setWarm(true));
    if (document.readyState === 'complete') start();
    else window.addEventListener('load', start, { once: true });
  }, []);

  useEffect(() => {
    if (!warm) return;
    const extras = TRACKS.map((t) => {
      const a = new Audio();
      a.preload = 'auto';
      a.src = t.src;
      return a;
    });
    return () => {
      extras.forEach((a) => {
        a.removeAttribute('src');
        a.load();
      });
    };
  }, [warm]);

  const syncBuffer = useCallback((audio: HTMLAudioElement) => {
    const pct = bufferPercent(audio);
    setLoadPct(pct);
    setReady(audio.readyState >= 3 || pct >= 99);
  }, []);

  const play = useCallback(async () => {
    const audio = audioRef.current;
    if (!audio) return;
    wantPlayRef.current = true;
    audio.volume = volume;
    if (audio.readyState < 2) {
      audio.load();
    }
    try {
      await audio.play();
      setPlaying(true);
    } catch {
      setPlaying(false);
    }
  }, [volume]);

  const pause = useCallback(() => {
    wantPlayRef.current = false;
    audioRef.current?.pause();
    setPlaying(false);
  }, []);

  const toggle = () => (playing ? pause() : play());

  const next = useCallback(() => {
    setTrackIdx((i) => (i + 1) % TRACKS.length);
    setPlaying(true);
    wantPlayRef.current = true;
    setComingSoonOpen(false);
  }, []);

  const prev = useCallback(() => {
    setTrackIdx((i) => (i - 1 + TRACKS.length) % TRACKS.length);
    setPlaying(true);
    wantPlayRef.current = true;
    setComingSoonOpen(false);
  }, []);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onProgress = () => syncBuffer(audio);
    const onReady = () => {
      syncBuffer(audio);
      if (wantPlayRef.current) {
        audio.play().then(() => setPlaying(true)).catch(() => setPlaying(false));
      }
    };
    const onWaiting = () => setReady(false);
    const onPlaying = () => {
      setPlaying(true);
      syncBuffer(audio);
    };

    audio.addEventListener('progress', onProgress);
    audio.addEventListener('loadedmetadata', onProgress);
    audio.addEventListener('canplay', onReady);
    audio.addEventListener('canplaythrough', onReady);
    audio.addEventListener('waiting', onWaiting);
    audio.addEventListener('playing', onPlaying);
    syncBuffer(audio);

    return () => {
      audio.removeEventListener('progress', onProgress);
      audio.removeEventListener('loadedmetadata', onProgress);
      audio.removeEventListener('canplay', onReady);
      audio.removeEventListener('canplaythrough', onReady);
      audio.removeEventListener('waiting', onWaiting);
      audio.removeEventListener('playing', onPlaying);
    };
  }, [track.src, syncBuffer]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.volume = volume;
    if (playing) {
      wantPlayRef.current = true;
      audio.play().catch(() => setPlaying(false));
    } else {
      audio.pause();
    }
  }, [trackIdx, volume, playing]);

  useEffect(() => {
    const handler = () => {
      setOnchainRadio(true);
      setOpen(true);
      wantPlayRef.current = true;
      if (!playing) play();
    };
    window.addEventListener('onchain-play-music', handler);
    return () => window.removeEventListener('onchain-play-music', handler);
  }, [playing, play, setOnchainRadio]);

  useEffect(() => {
    if (onchainRadio) return;
    pause();
    setOpen(false);
    setComingSoonOpen(false);
  }, [onchainRadio, pause]);

  const loadBar = (
    <div className="music-load" role="status" aria-live="polite">
      <div className="music-load__row">
        <span className="music-load__label">Loading track</span>
        <span className="music-load__pct tabular-nums">{Math.round(loadPct)}%</span>
      </div>
      <div className="music-load__track" aria-hidden>
        <span className="music-load__fill" style={{ width: `${Math.max(6, loadPct)}%` }} />
      </div>
    </div>
  );

  return createPortal(
    <>
      <audio
        ref={audioRef}
        src={track.src}
        preload={warm || onchainRadio ? 'auto' : 'none'}
        loop
      />

      {onchainRadio && (
        <div className="music-dock">
          {loading ? loadBar : null}
          <div className="music-dock__left">
            <span className="music-dock__brand">♪ ONCHAIN RADIO</span>
            <span className="music-dock__meta">
              <span className="music-dock__track">{track.title}</span>
              {'artist' in track && track.artist ? (
                <span className="music-dock__artist">by {track.artist}</span>
              ) : null}
            </span>
          </div>
          <div className="music-dock__controls">
            <button type="button" className="music-dock__nav" onClick={prev}>‹</button>
            <button type="button" className="music-dock__play" onClick={toggle}>
              {loading && !playing ? 'LOADING' : playing ? '❚❚ PAUSE' : '▶ PLAY'}
            </button>
            <button type="button" className="music-dock__nav" onClick={next}>›</button>
            <button type="button" className="music-dock__tracks" onClick={() => setOpen((o) => !o)}>
              TRACKS
            </button>
          </div>
        </div>
      )}

      {onchainRadio && open && (
        <div className="music-panel">
          <div className="music-panel__header">
            <div>
              <div className="music-panel__brand">ONCHAIN CA$H RADIO</div>
              <div className="music-panel__track">{track.title}</div>
              {'artist' in track && track.artist ? (
                <div className="music-panel__artist">by {track.artist}</div>
              ) : null}
            </div>
            <button type="button" className="music-panel__close" onClick={() => setOpen(false)}>✕</button>
          </div>

          {loading ? loadBar : <DotBarViz values={dotValues} columns={28} activeFrom={playing ? 0 : 14} />}

          <div className="music-panel__controls">
            <button type="button" onClick={prev}>‹</button>
            <button type="button" className="music-panel__play" onClick={toggle}>
              {loading && !playing ? 'LOADING' : playing ? 'PAUSE' : 'PLAY'}
            </button>
            <button type="button" onClick={next}>›</button>
          </div>

          <div className="music-panel__playlist">
            <div className="music-panel__playlist-label">Now spinning</div>
            <ol className="music-panel__tracks">
              {TRACKS.map((t, i) => (
                <li key={t.id}>
                  <button
                    type="button"
                    className={`music-panel__track-btn ${i === trackIdx ? 'active' : ''}`}
                    onClick={() => {
                      setTrackIdx(i);
                      setPlaying(true);
                      wantPlayRef.current = true;
                      setComingSoonOpen(false);
                    }}
                  >
                    <span className="music-panel__track-btn-idx" aria-hidden>
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    <span className="music-panel__track-btn-copy">
                      <span className="music-panel__track-btn-title">{t.title}</span>
                      {'artist' in t && t.artist ? (
                        <span className="music-panel__track-btn-artist">by {t.artist}</span>
                      ) : null}
                    </span>
                    {i === trackIdx ? (
                      <span className="music-panel__track-btn-live" aria-hidden>
                        {loading ? '…' : playing ? '▶' : '❚❚'}
                      </span>
                    ) : null}
                  </button>
                </li>
              ))}
              <li>
                <button
                  type="button"
                  className={`music-panel__track-btn music-panel__track-btn--soon${comingSoonOpen ? ' is-open' : ''}`}
                  onClick={() => setComingSoonOpen((openSoon) => !openSoon)}
                  aria-expanded={comingSoonOpen}
                >
                  <span className="music-panel__track-btn-idx" aria-hidden>
                    ··
                  </span>
                  <span className="music-panel__track-btn-copy">
                    <span className="music-panel__track-btn-title">more tracks loading</span>
                    <span className="music-panel__track-btn-artist">tap for status</span>
                  </span>
                </button>
                {comingSoonOpen ? (
                  <p className="music-panel__soon-note" role="status">
                    {COMING_SOON_COPY}
                  </p>
                ) : null}
              </li>
            </ol>
          </div>

          <div className="music-panel__vol-wrap">
            <label className="music-panel__vol-label" htmlFor="onchain-radio-volume">
              volume
            </label>
            <input
              id="onchain-radio-volume"
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={volume}
              onChange={(e) => setVolume(+e.target.value)}
              className="music-panel__vol"
              aria-label="Volume"
            />
          </div>
        </div>
      )}

      {onchainRadio && open && <div className="music-panel__backdrop" onClick={() => setOpen(false)} />}
    </>,
    document.body,
  );
}
