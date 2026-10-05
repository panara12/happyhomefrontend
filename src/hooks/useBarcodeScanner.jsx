import { useEffect, useRef } from 'react';

/**
 * Detects USB scanner input (fast keystrokes ending with Enter)
 * and calls onScan(code). Works even if no input is focused.
 */
export function useBarcodeScanner(onScan, { enabled = true, minLength = 3, maxGapMs = 60 } = {}) {
  const onScanRef = useRef(onScan);
  onScanRef.current = onScan;

  useEffect(() => {
    if (!enabled) return;
    let buffer = '';
    let lastTime = 0;

    // remove the scanned text if it leaked into a focused input
    const cleanLeakedText = (code) => {
      const el = document.activeElement;
      if (!el || !['INPUT', 'TEXTAREA'].includes(el.tagName)) return;
      if (typeof el.value !== 'string' || !el.value.endsWith(code)) return;
      const proto = el.tagName === 'INPUT' ? HTMLInputElement.prototype : HTMLTextAreaElement.prototype;
      const setter = Object.getOwnPropertyDescriptor(proto, 'value').set;
      setter.call(el, el.value.slice(0, -code.length));
      el.dispatchEvent(new Event('input', { bubbles: true })); // updates React state
    };

    const handler = (e) => {
      if (e.ctrlKey || e.altKey || e.metaKey) return;
      const now = Date.now();
      if (now - lastTime > maxGapMs) buffer = '';   // slow typing = human, reset
      lastTime = now;

      if (e.key === 'Enter') {
        if (buffer.length >= minLength) {
          e.preventDefault();
          e.stopPropagation();                      // stops form submit
          const code = buffer.trim();
          buffer = '';
          cleanLeakedText(code);
          onScanRef.current(code);
        }
        buffer = '';
        return;
      }
      if (e.key.length === 1) buffer += e.key;
    };

    window.addEventListener('keydown', handler, true);
    return () => window.removeEventListener('keydown', handler, true);
  }, [enabled, minLength, maxGapMs]);
}