import type { FrxUsdMintRedeemEvent } from '../../../../shared/types/index.ts';
import { assetLogoSrc, chainLogoSrc, explorerTxUrl, formatPrintUsd, shortTx } from '../../lib/deskMarks';

function ago(ts: number): string {
  const ms = Date.now() - ts;
  if (ms < 45_000) return 'just now';
  const mins = Math.floor(ms / 60_000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export function DeskFeed({
  events,
  heldId,
  onHold,
}: {
  events: FrxUsdMintRedeemEvent[];
  heldId: string | null;
  onHold: (event: FrxUsdMintRedeemEvent | null) => void;
}) {
  if (!events.length) {
    return (
      <div className="desk-feed desk-feed--empty">
        <p>No new mints or burns in this window.</p>
      </div>
    );
  }

  return (
    <ol className="desk-feed" aria-label="Recent mint and redeem prints">
      {events.map((event) => {
        const active = heldId === event.id;
        const href = explorerTxUrl(event);
        return (
          <li key={event.id}>
            <button
              type="button"
              className={`desk-feed__row desk-feed__row--${event.type}${active ? ' is-held' : ''}`}
              onClick={() => onHold(active ? null : event)}
            >
              <span className="desk-feed__kind">{event.type === 'mint' ? 'Mint' : 'Burn'}</span>
              <span className="desk-feed__amt tabular-nums">{formatPrintUsd(event.amountUsd)}</span>
              <span className="desk-feed__asset">
                <img src={assetLogoSrc(event.asset) ?? '/learn/images/assets/frxusd.png'} alt="" />
                <img src={chainLogoSrc(event.chain ?? 'Ethereum')} alt="" />
              </span>
              <span className="desk-feed__time">{ago(event.ts)}</span>
            </button>
            <a
              className="desk-feed__tx"
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              title={event.txHash}
              onClick={(e) => e.stopPropagation()}
            >
              {shortTx(event.txHash)}
            </a>
          </li>
        );
      })}
    </ol>
  );
}
