import { MutableRefObject, useEffect } from 'react';

type Handler = (event: PointerEvent) => void;

function useClickOutside<T extends HTMLElement = HTMLElement>(
    ref: MutableRefObject<T | null>,
    handler: Handler
): void {
    useEffect(() => {
        const handleClickOutside = (event: PointerEvent) => {
            
            if (ref.current && !ref.current.contains(event.target as Node)) {
                handler(event);
              }
        };

    document.addEventListener('pointerdown', handleClickOutside);

    return () => {
      document.removeEventListener('pointerdown', handleClickOutside);
    };
  }, [ref, handler]);
}

export { useClickOutside };

