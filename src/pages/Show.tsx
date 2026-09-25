import { useEffect, useState } from 'react';
import { LiveTicker } from '../components/LiveTicker';
import { Header } from '../components/Header';
import { ShowSection } from '../components/ShowSection';
import { EpisodeCarousel } from '../components/EpisodeCarousel';
import { EpisodeDetailModal } from '../components/EpisodeDetailModal';
import { Footer } from '../components/Footer';
import { ShowTopicSubmit } from '../components/ShowTopicSubmit';
import { PageGate } from '../components/PageGate';
import { fetchDashboardData, fetchShowData } from '../services/api';
import type { ShowData, ShowEpisode, TickerItem } from '../types';
import { ONCHAIN_CASH_SEGMENTS, ONCHAIN_CASH_SHOW } from '../../shared/data/showConfig';

export function ShowPage() {
  const [ticker, setTicker] = useState<TickerItem[]>([]);
  const [show, setShow] = useState<ShowData | null>(null);
  const [selectedEpisode, setSelectedEpisode] = useState<ShowEpisode | null>(null);

  useEffect(() => {
    let cancelled = false;

    Promise.all([fetchShowData(), fetchDashboardData()])
      .then(([showData, dash]) => {
        if (cancelled) return;
        setShow(showData);
        setTicker(dash.ticker ?? []);
      })
      .catch(() => undefined);

    return () => {
      cancelled = true;
    };
  }, []);

  if (!show) {
    return <PageGate ready={false} message="Loading Show…" />;
  }

  const segments = show.segments?.length ? show.segments : ONCHAIN_CASH_SEGMENTS;

  return (
    <>
      <LiveTicker items={ticker} />
      <Header />

      <main className="show-page-v2">
        <ShowSection show={show} onOpenEpisode={setSelectedEpisode} />

        {show.episodes.length ? (
          <EpisodeCarousel episodes={show.episodes.slice(0, 9)} onOpen={setSelectedEpisode} />
        ) : (
          <section id="show-catchup" className="show-catchup show-catchup--loading">
            <h2>Catch up the latest shows</h2>
            <div>Loading the official ONCHAIN CA$H archive…</div>
          </section>
        )}

        <section className="show-format" aria-labelledby="show-format-title">
          <div className="show-format__intro">
            <p className="section-eyebrow">What the show covers</p>
            <h2 id="show-format-title">Everything that moved onchain.</h2>
            <p>
              Each live show turns the week’s market data, policy shifts, yield opportunities,
              protocol risk, and Frax ecosystem activity into one focused conversation.
            </p>
            <div className="show-format__links">
              <a
                href={show.channelUrl ?? ONCHAIN_CASH_SHOW.youtubeChannelUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="show-ghost-link"
              >
                Subscribe on YouTube ↗
              </a>
              <a
                href={ONCHAIN_CASH_SHOW.xUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="show-ghost-link"
              >
                Follow on X ↗
              </a>
            </div>
          </div>

          <div className="show-format__segments">
            {segments.map((segment) => (
              <article key={segment.name}>
                <span aria-hidden="true">¤</span>
                <div>
                  <h3>
                    {segment.url && segment.linkLabel ? (
                      <>
                        <a href={segment.url} target="_blank" rel="noopener noreferrer">
                          {segment.linkLabel}
                        </a>
                        {segment.name.startsWith(segment.linkLabel)
                          ? segment.name.slice(segment.linkLabel.length)
                          : null}
                      </>
                    ) : (
                      segment.name
                    )}
                  </h3>
                  <p>{segment.description}</p>
                </div>
              </article>
            ))}
          </div>
        </section>

        <ShowTopicSubmit />
      </main>

      <Footer />

      <EpisodeDetailModal
        episode={selectedEpisode}
        show={show}
        onClose={() => setSelectedEpisode(null)}
        onOpenEpisode={setSelectedEpisode}
      />
    </>
  );
}
