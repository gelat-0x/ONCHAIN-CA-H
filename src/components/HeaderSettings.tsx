import { useEffect, useId, useRef, useState } from 'react';
import { Settings } from 'lucide-react';
import { useUiPrefs } from '../context/UiPrefs';

function AppleToggle({
  checked,
  onChange,
  labelledBy,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  labelledBy: string;
}) {
  return (
    <button
      type="button"
      className={`apple-toggle${checked ? ' apple-toggle--on' : ''}`}
      role="switch"
      aria-checked={checked}
      aria-labelledby={labelledBy}
      onClick={() => onChange(!checked)}
    >
      <span className="apple-toggle__knob" aria-hidden />
    </button>
  );
}

export function HeaderSettings() {
  const { priceChecker, onchainRadio, setPriceChecker, setOnchainRadio } = useUiPrefs();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const priceId = useId();
  const radioId = useId();

  useEffect(() => {
    if (!open) return;

    const onPointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };

    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  return (
    <div className="header-settings" ref={rootRef}>
      <button
        type="button"
        className={`header-directory__btn header-directory__btn--icon${open ? ' is-open' : ''}`}
        aria-expanded={open}
        aria-controls="header-settings-panel"
        aria-label="Settings"
        onClick={() => setOpen((value) => !value)}
      >
        <Settings size={15} strokeWidth={2.1} aria-hidden />
      </button>

      {open ? (
        <div
          id="header-settings-panel"
          className="header-settings__panel"
          role="dialog"
          aria-label="Display settings"
        >
          <div className="header-settings__head">
            <span>Settings</span>
          </div>

          <ul className="header-settings__list">
            <li className="header-settings__row">
              <div className="header-settings__copy">
                <span id={priceId} className="header-settings__label">
                  Activate price checker
                </span>
                <span className="header-settings__hint">Top ticker bar</span>
              </div>
              <AppleToggle
                checked={priceChecker}
                onChange={setPriceChecker}
                labelledBy={priceId}
              />
            </li>
            <li className="header-settings__row">
              <div className="header-settings__copy">
                <span id={radioId} className="header-settings__label">
                  Activate on-chain radio
                </span>
                <span className="header-settings__hint">Bottom music dock</span>
              </div>
              <AppleToggle
                checked={onchainRadio}
                onChange={setOnchainRadio}
                labelledBy={radioId}
              />
            </li>
          </ul>
        </div>
      ) : null}
    </div>
  );
}
