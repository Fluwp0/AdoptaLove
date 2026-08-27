import { useEffect, useLayoutEffect } from 'react';
import '../frontend/src/styles/index.css';
import { applyStoredTheme } from '../frontend/src/services/themePreference';

const useIsomorphicLayoutEffect =
  typeof window === 'undefined' ? useEffect : useLayoutEffect;

export default function AdoptaLoveApp({ Component, pageProps }) {
  useIsomorphicLayoutEffect(() => {
    applyStoredTheme();
  }, []);

  return <Component {...pageProps} />;
}
