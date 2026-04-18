import React, { useEffect } from 'react';
import { Platform } from 'react-native';
import { usePreviewAutoDemo } from './PreviewAutoDemo';

const ALLOWED_TAB_SELECTOR = '[data-preview-tab="true"]';

export function PreviewInteractionGate({ children }) {
  const { pauseAutomation } = usePreviewAutoDemo();

  useEffect(() => {
    if (Platform.OS !== 'web' || typeof document === 'undefined') {
      return undefined;
    }

    const onPointerDownCapture = () => {
      pauseAutomation();
    };

    const onWheelCapture = () => {
      pauseAutomation();
    };

    const onClickCapture = (event) => {
      const target = event.target;

      if (!(target instanceof Element)) {
        return;
      }

      if (target.closest(ALLOWED_TAB_SELECTOR)) {
        pauseAutomation();
        return;
      }

      pauseAutomation();
      event.preventDefault();
      event.stopPropagation();
    };

    document.addEventListener('pointerdown', onPointerDownCapture, true);
    document.addEventListener('touchstart', onPointerDownCapture, true);
    document.addEventListener('click', onClickCapture, true);
    document.addEventListener('wheel', onWheelCapture, { capture: true, passive: true });

    return () => {
      document.removeEventListener('pointerdown', onPointerDownCapture, true);
      document.removeEventListener('touchstart', onPointerDownCapture, true);
      document.removeEventListener('click', onClickCapture, true);
      document.removeEventListener('wheel', onWheelCapture, true);
    };
  }, [pauseAutomation]);

  return children;
}
