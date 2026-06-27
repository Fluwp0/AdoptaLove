import { useEffect } from 'react';

let lockCount = 0;
let savedScrollY = 0;
let originalBodyStyles = null;

function getScrollbarWidth() {
  return window.innerWidth - document.documentElement.clientWidth;
}

export function useBodyScrollLock(isLocked) {
  useEffect(() => {
    if (!isLocked || typeof window === 'undefined' || typeof document === 'undefined') {
      return undefined;
    }

    lockCount += 1;

    if (lockCount === 1) {
      savedScrollY = window.scrollY;
      originalBodyStyles = {
        overflow: document.body.style.overflow,
        paddingRight: document.body.style.paddingRight,
        position: document.body.style.position,
        top: document.body.style.top,
        width: document.body.style.width
      };

      const scrollbarWidth = getScrollbarWidth();

      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.top = `-${savedScrollY}px`;
      document.body.style.width = '100%';

      if (scrollbarWidth > 0) {
        document.body.style.paddingRight = `${scrollbarWidth}px`;
      }
    }

    return () => {
      lockCount = Math.max(0, lockCount - 1);

      if (lockCount === 0 && originalBodyStyles) {
        document.body.style.overflow = originalBodyStyles.overflow;
        document.body.style.paddingRight = originalBodyStyles.paddingRight;
        document.body.style.position = originalBodyStyles.position;
        document.body.style.top = originalBodyStyles.top;
        document.body.style.width = originalBodyStyles.width;
        window.scrollTo(0, savedScrollY);
        originalBodyStyles = null;
        savedScrollY = 0;
      }
    };
  }, [isLocked]);
}
