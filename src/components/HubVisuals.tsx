import top5Apr from '../assets/studio/top5-apr.jpg';
import top5Tvl from '../assets/studio/top5-tvl.jpg';
import aprSingleCrvusd from '../assets/studio/apr-single-crvusd.jpg';

const STUDIO_POSTS = [
  { src: top5Apr, layer: '1' },
  { src: top5Tvl, layer: '2' },
  { src: aprSingleCrvusd, layer: '3' },
] as const;

export function StudioPosts({ mini = false }: { mini?: boolean }) {
  return (
    <div className={`hub-art hub-art--studio ${mini ? 'is-mini' : ''}`} aria-hidden>
      <div className="hub-art__posts">
        {STUDIO_POSTS.map((post) => (
          <span key={post.layer} className={`hub-art__post hub-art__post--${post.layer}`}>
            <img src={post.src} alt="" />
          </span>
        ))}
      </div>
    </div>
  );
}

export function ShowLive({ mini = false }: { mini?: boolean }) {
  return (
    <div className={`hub-live ${mini ? 'is-mini' : ''}`} aria-hidden>
      <span className="hub-live__ring hub-live__ring--1" />
      <span className="hub-live__ring hub-live__ring--2" />
      <span className="hub-live__ring hub-live__ring--3" />
      <span className="hub-live__core">
        <span className="hub-live__dot" />
      </span>
      <span className="hub-live__tag">Live</span>
    </div>
  );
}

export function LearnBook({ mini = false }: { mini?: boolean }) {
  return (
    <div className={`hub-learn ${mini ? 'is-mini' : ''}`} aria-hidden>
      <div className="hub-learn__book">
        <span className="hub-learn__page hub-learn__page--left">
          <span className="hub-learn__line" />
          <span className="hub-learn__line" />
          <span className="hub-learn__line" />
          <span className="hub-learn__line hub-learn__line--short" />
        </span>
        <span className="hub-learn__spine" />
        <span className="hub-learn__page hub-learn__page--right">
          <span className="hub-learn__line" />
          <span className="hub-learn__line" />
          <span className="hub-learn__line" />
          <span className="hub-learn__line hub-learn__line--short" />
        </span>
      </div>
    </div>
  );
}

export function RadioWave() {
  return (
    <div className="hub-art__wave hub-art__wave--radio" aria-hidden>
      {Array.from({ length: 7 }, (_, i) => (
        <span key={i} className={`hub-art__bar hub-art__bar--${i + 1}`} />
      ))}
    </div>
  );
}

export function ComingLoad() {
  return (
    <div className="coming-load" aria-hidden>
      {Array.from({ length: 5 }, (_, i) => (
        <span key={i} className={`coming-load__block coming-load__block--${i + 1}`} />
      ))}
    </div>
  );
}
