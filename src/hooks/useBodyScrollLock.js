import { useEffect } from 'react';

/**
 * Locks document scroll while `locked` is true.
 * Compensates for scrollbar width to avoid layout shift.
 */
export function useBodyScrollLock(locked = true) {
  useEffect(() => {
    if (!locked) return undefined;

    const html = document.documentElement;
    const body = document.body;
    const prevHtmlOverflow = html.style.overflow;
    const prevBodyOverflow = body.style.overflow;
    const prevBodyPaddingRight = body.style.paddingRight;
    const scrollbarGap = window.innerWidth - html.clientWidth;

    html.style.overflow = 'hidden';
    body.style.overflow = 'hidden';
    if (scrollbarGap > 0) {
      body.style.paddingRight = `${scrollbarGap}px`;
    }

    return () => {
      html.style.overflow = prevHtmlOverflow;
      body.style.overflow = prevBodyOverflow;
      body.style.paddingRight = prevBodyPaddingRight;
    };
  }, [locked]);
}
