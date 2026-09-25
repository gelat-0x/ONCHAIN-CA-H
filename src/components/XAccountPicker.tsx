import { useMemo, useState } from 'react';
import {
  LATEST_X_TAB,
  adoptHandleFromQuery,
  featuredAccounts,
  type XNewsAccount,
} from '../../shared/data/newsAccounts.ts';
import { TokenLogo } from './TokenLogo';

interface XAccountPickerProps {
  activeHandle: string;
  onSelect: (handle: string) => void;
  filterAccounts: XNewsAccount[];
}

export function XAccountPicker({ activeHandle, onSelect, filterAccounts }: XAccountPickerProps) {
  const [query, setQuery] = useState('');
  const featured = useMemo(() => featuredAccounts(), []);

  const adopted = useMemo(() => {
    const q = query.trim();
    if (!q) return null;
    return adoptHandleFromQuery(q);
  }, [query]);

  const showAdopted =
    adopted &&
    !featured.some((a) => a.handle.toLowerCase() === adopted.handle.toLowerCase()) &&
    !filterAccounts.some((a) => a.handle.toLowerCase() === adopted.handle.toLowerCase());

  const applySearch = () => {
    if (!adopted) return;
    onSelect(adopted.handle);
    setQuery('');
  };

  return (
    <div className="x-picker">
      <div className="x-picker__search">
        <input
          type="search"
          className="x-picker__input"
          placeholder="Add @account…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') applySearch();
          }}
          aria-label="Search X accounts"
        />
        {query.trim() && adopted && (
          <button type="button" className="x-picker__go" onClick={applySearch}>
            @{adopted.handle} ↵
          </button>
        )}
      </div>

      <div className="x-picker__logos" role="tablist" aria-label="X accounts">
        <button
          type="button"
          role="tab"
          aria-selected={activeHandle === LATEST_X_TAB}
          className={`x-picker__logo x-picker__logo--latest ${activeHandle === LATEST_X_TAB ? 'x-picker__logo--active' : ''}`}
          onClick={() => onSelect(LATEST_X_TAB)}
          title="Latest from all accounts"
        >
          <span className="x-picker__latest-icon">✦</span>
          <span className="x-picker__logo-label">Latest</span>
        </button>

        {featured.map((acc) => (
          <LogoTab
            key={acc.handle}
            account={acc}
            active={activeHandle === acc.handle}
            onSelect={() => onSelect(acc.handle)}
          />
        ))}

        {showAdopted && adopted && (
          <LogoTab
            account={adopted}
            active={activeHandle === adopted.handle}
            onSelect={() => onSelect(adopted.handle)}
            adopted
          />
        )}
      </div>
    </div>
  );
}

function LogoTab({
  account,
  active,
  onSelect,
  adopted,
}: {
  account: XNewsAccount;
  active: boolean;
  onSelect: () => void;
  adopted?: boolean;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      className={`x-picker__logo ${active ? 'x-picker__logo--active' : ''} ${adopted ? 'x-picker__logo--adopted' : ''}`}
      onClick={onSelect}
      title={`@${account.handle}`}
    >
      {account.logoSymbol ? (
        <TokenLogo
          symbol={account.logoSymbol}
          fallbackInitials={account.initials}
          fallbackColor={account.accentColor}
          size="sm"
          className="x-picker__token"
        />
      ) : (
        <span
          className="x-picker__initials"
          style={{ borderColor: account.accentColor, color: account.accentColor }}
        >
          {account.initials ?? account.displayName.slice(0, 2).toUpperCase()}
        </span>
      )}
      <span className="x-picker__logo-label">{account.displayName}</span>
    </button>
  );
}
