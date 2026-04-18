import React, { useEffect } from 'react';
import { Platform } from 'react-native';

const ALLOWED_TAB_SELECTOR = '[data-preview-tab="true"]';

export function PreviewInteractionGate({ children }) {
  useEffect(() => {
    if (Platform.OS !== 'web' || typeof document === 'undefined') {
      return undefined;
    }

    const onClickCapture = (event) => {
      const target = event.target;

      if (!(target instanceof Element)) {
        return;
      }

      if (target.closest(ALLOWED_TAB_SELECTOR)) {
        return;
      }

      event.preventDefault();
      event.stopPropagation();
    };

    document.addEventListener('click', onClickCapture, true);

    return () => {
      document.removeEventListener('click', onClickCapture, true);
    };
  }, []);

  return children;
}
