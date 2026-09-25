import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

const STORAGE_KEY = 'onchain-ui-prefs-v2';

export interface UiPrefs {
  priceChecker: boolean;
  onchainRadio: boolean;
}

interface UiPrefsContextValue extends UiPrefs {
  setPriceChecker: (value: boolean) => void;
  setOnchainRadio: (value: boolean) => void;
}

const DEFAULTS: UiPrefs = {
  priceChecker: false,
  onchainRadio: false,
};

const UiPrefsContext = createContext<UiPrefsContextValue | null>(null);

function readStored(): UiPrefs {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULTS;
    const parsed = JSON.parse(raw) as Partial<UiPrefs>;
    return {
      priceChecker: parsed.priceChecker ?? DEFAULTS.priceChecker,
      onchainRadio: parsed.onchainRadio ?? DEFAULTS.onchainRadio,
    };
  } catch {
    return DEFAULTS;
  }
}

function applyDomPrefs(prefs: UiPrefs) {
  const root = document.documentElement;
  root.dataset.priceChecker = prefs.priceChecker ? 'on' : 'off';
  root.dataset.onchainRadio = prefs.onchainRadio ? 'on' : 'off';
}

export function UiPrefsProvider({ children }: { children: ReactNode }) {
  const [prefs, setPrefs] = useState<UiPrefs>(() => {
    if (typeof window === 'undefined') return DEFAULTS;
    const initial = readStored();
    applyDomPrefs(initial);
    return initial;
  });

  useEffect(() => {
    applyDomPrefs(prefs);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
    } catch {
      /* ignore quota / private mode */
    }
  }, [prefs]);

  const setPriceChecker = useCallback((value: boolean) => {
    setPrefs((prev) => ({ ...prev, priceChecker: value }));
  }, []);

  const setOnchainRadio = useCallback((value: boolean) => {
    setPrefs((prev) => ({ ...prev, onchainRadio: value }));
  }, []);

  const value = useMemo(
    () => ({
      ...prefs,
      setPriceChecker,
      setOnchainRadio,
    }),
    [prefs, setPriceChecker, setOnchainRadio],
  );

  return <UiPrefsContext.Provider value={value}>{children}</UiPrefsContext.Provider>;
}

export function useUiPrefs(): UiPrefsContextValue {
  const ctx = useContext(UiPrefsContext);
  if (!ctx) {
    throw new Error('useUiPrefs must be used within UiPrefsProvider');
  }
  return ctx;
}
