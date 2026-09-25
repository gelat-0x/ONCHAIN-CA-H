import { useState } from 'react';
import { createPortal } from 'react-dom';
import { DASHBOARD_DEFILLAMA_PROTOCOLS } from '../../../shared/constants/defiLlamaProtocols';
import type { DashboardDefiLlamaSlug } from '../../../shared/constants/defiLlamaProtocols';

interface StudioProtocolPickerProps {
  value: DashboardDefiLlamaSlug;
  onChange: (slug: DashboardDefiLlamaSlug) => void;
  disabled?: boolean;
}

export function StudioProtocolPicker({ value, onChange, disabled }: StudioProtocolPickerProps) {
  const [open, setOpen] = useState(false);
  const selected = DASHBOARD_DEFILLAMA_PROTOCOLS.find((p) => p.slug === value);

  const modal = open
    ? createPortal(
        <div className="studio-pool-modal studio-pool-modal--compact" role="presentation">
          <button
            type="button"
            className="studio-pool-modal__backdrop"
            aria-label="Close"
            onClick={() => setOpen(false)}
          />
          <div className="studio-pool-modal__card" role="dialog" aria-modal="true">
            <header className="studio-pool-modal__head">
              <h2 className="studio-pool-modal__title">Protocol</h2>
              <button
                type="button"
                className="studio-pool-modal__close"
                onClick={() => setOpen(false)}
                aria-label="Close"
              >
                ×
              </button>
            </header>
            <ul className="studio-protocol-modal__list">
              {DASHBOARD_DEFILLAMA_PROTOCOLS.map((p) => (
                <li key={p.slug}>
                  <button
                    type="button"
                    className={`studio-protocol-modal__row ${value === p.slug ? 'studio-protocol-modal__row--active' : ''}`}
                    onClick={() => {
                      onChange(p.slug);
                      setOpen(false);
                    }}
                  >
                    <span
                      className="studio-protocol-modal__dot"
                      style={{ background: p.chartColor }}
                      aria-hidden
                    />
                    <span>{p.label}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>,
        document.body,
      )
    : null;

  return (
    <div className="studio-pair-slot">
      <span className="studio-pair-slot__label">Protocol</span>
      <button
        type="button"
        className="studio-pair-slot__trigger studio-pair-slot__trigger--filled"
        onClick={() => setOpen(true)}
        disabled={disabled}
        aria-haspopup="dialog"
        aria-expanded={open}
      >
        {selected && (
          <>
            <span
              className="studio-protocol-modal__dot studio-protocol-modal__dot--trigger"
              style={{ background: selected.chartColor }}
              aria-hidden
            />
            <span className="studio-pair-slot__name">{selected.label}</span>
          </>
        )}
        <span className="studio-pair-slot__chevron" aria-hidden>
          ›
        </span>
      </button>
      {modal}
    </div>
  );
}
