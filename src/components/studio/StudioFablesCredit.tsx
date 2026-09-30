import fablesMark from '../../assets/venues/fables.png';

/** Small “Powered by Fables” line for the eUSD studio cards. */
export function StudioFablesCredit({ compact = false }: { compact?: boolean }) {
  return (
    <span className={`studio-fables ${compact ? 'studio-fables--compact' : ''}`}>
      {compact ? null : <span className="studio-fables__label">Powered by</span>}
      <img src={fablesMark} alt="Fables" className="studio-fables__logo" />
    </span>
  );
}
