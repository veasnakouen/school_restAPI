import { useEffect, RefObject } from 'react';

type Event = MouseEvent | TouchEvent;

/**
 * A custom hook that triggers a handler when a click occurs outside of the referenced element.
 * @param ref - A React ref object pointing to the element to monitor.
 * @param handler - The function to call when a click outside occurs.
 */
export const useOnClickOutside = <T extends HTMLElement = HTMLElement>(
  ref: RefObject<T>,
  handler: (event: Event) => void
) => {
  useEffect(() => {
    const listener = (event: Event) => {
      const el = ref?.current;
      // Do nothing if clicking ref's element or its descendants
      if (!el || el.contains(event.target as Node)) {
        return;
      }
      handler(event);
    };

    document.addEventListener('mousedown', listener);
    document.addEventListener('touchstart', listener);

    return () => {
      document.removeEventListener('mousedown', listener);
      document.removeEventListener('touchstart', listener);
    };
  }, [ref, handler]); // Re-run if ref or handler changes
};