import { useEffect, useRef, useState, forwardRef, useImperativeHandle, type VideoHTMLAttributes } from "react";

type LazyVideoProps = Omit<VideoHTMLAttributes<HTMLVideoElement>, "src" | "poster"> & {
  src: string;
  poster: string;
  /** Start loading when within this many px of the viewport. Default 300. */
  rootMargin?: string;
  /** When true, autoplay loop once loaded. Default false. */
  autoLoop?: boolean;
  /** Optional playback rate. */
  playbackRate?: number;
  /** Extra className applied to the video element. */
  className?: string;
  /** When true, load eagerly with preload="auto" (use for above-the-fold hero videos). */
  priority?: boolean;
};

/**
 * LazyVideo
 * - Shows poster instantly
 * - preload="metadata"
 * - Only assigns `src` when the element is near the viewport (IntersectionObserver)
 * - Fades in when first frame is ready (`loadeddata`)
 */
const LazyVideo = forwardRef<HTMLVideoElement, LazyVideoProps>(function LazyVideo(
  { src, poster, rootMargin = "300px", autoLoop = false, playbackRate, className = "", priority = false, ...rest },
  externalRef
) {
  const innerRef = useRef<HTMLVideoElement>(null);
  useImperativeHandle(externalRef, () => innerRef.current as HTMLVideoElement);

  const [shouldLoad, setShouldLoad] = useState(priority);
  const [ready, setReady] = useState(false);

  // Observe viewport proximity to decide when to attach src.
  useEffect(() => {
    const el = innerRef.current;
    if (!el || shouldLoad) return;
    if (typeof IntersectionObserver === "undefined") {
      setShouldLoad(true);
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setShouldLoad(true);
          observer.disconnect();
        }
      },
      { rootMargin, threshold: 0.01 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [shouldLoad, rootMargin]);

  // Fade-in once first frame is ready.
  useEffect(() => {
    const el = innerRef.current;
    if (!el) return;
    const onReady = () => setReady(true);
    el.addEventListener("loadeddata", onReady);
    el.addEventListener("canplay", onReady);
    if (el.readyState >= 2) setReady(true);
    return () => {
      el.removeEventListener("loadeddata", onReady);
      el.removeEventListener("canplay", onReady);
    };
  }, [shouldLoad]);

  // Apply playback rate when video is ready.
  useEffect(() => {
    const el = innerRef.current;
    if (!el || playbackRate == null) return;
    el.playbackRate = playbackRate;
  }, [playbackRate, ready]);

  return (
    <video
      ref={innerRef}
      poster={poster}
      preload={priority ? "auto" : "metadata"}
      muted
      playsInline
      loop={autoLoop}
      autoPlay={autoLoop}
      {...(shouldLoad ? { src } : {})}
      className={`${className} transition-opacity duration-500 ease-out ${
        ready || !shouldLoad ? "opacity-100" : "opacity-80"
      }`}
      {...rest}
    />
  );
});

export default LazyVideo;