import { useEffect, useMemo, useRef, useState } from 'react';

const PREVIEW_VIEWPORT_WIDTH = 390;
const PREVIEW_VIEWPORT_HEIGHT = 844;

export default function FitAiPreview() {
  const [loadError, setLoadError] = useState(false);
  const [scale, setScale] = useState(1);
  const hostRef = useRef(null);
  const baseUrl = import.meta.env.BASE_URL;
  const previewSrc = useMemo(
    () => (import.meta.env.DEV ? 'http://127.0.0.1:8081/' : `${baseUrl}fitai-preview/index.html`),
    [baseUrl]
  );
  const scaledWidth = PREVIEW_VIEWPORT_WIDTH * scale;
  const scaledHeight = PREVIEW_VIEWPORT_HEIGHT * scale;

  useEffect(() => {
    const host = hostRef.current;
    if (!host) {
      return undefined;
    }

    const updateScale = () => {
      const rect = host.getBoundingClientRect();
      if (!rect.width || !rect.height) {
        return;
      }

      const nextScale = Math.min(
        rect.width / PREVIEW_VIEWPORT_WIDTH,
        rect.height / PREVIEW_VIEWPORT_HEIGHT
      );

      setScale((currentScale) =>
        Math.abs(currentScale - nextScale) < 0.001 ? currentScale : nextScale
      );
    };

    updateScale();

    if (typeof ResizeObserver !== 'undefined') {
      const resizeObserver = new ResizeObserver(() => {
        updateScale();
      });

      resizeObserver.observe(host);
      return () => resizeObserver.disconnect();
    }

    window.addEventListener('resize', updateScale);
    return () => window.removeEventListener('resize', updateScale);
  }, []);

  return (
    <div className="hero__phone-frame fitai-device">
      <div className="fitai-device__camera"></div>
      <div className="hero__phone-screen">
        <div className="fitai-preview-host" data-fitai-preview-host ref={hostRef}>
          <div
            className="fitai-preview-host__viewport-wrap"
            style={{ width: `${scaledWidth}px`, height: `${scaledHeight}px` }}
          >
            <div
              className="fitai-preview-host__viewport"
              style={{
                width: `${PREVIEW_VIEWPORT_WIDTH}px`,
                height: `${PREVIEW_VIEWPORT_HEIGHT}px`,
                transform: `scale(${scale})`,
              }}
            >
              <iframe
                className="fitai-preview-host__iframe"
                title="FitAI preview"
                src={previewSrc}
                scrolling="no"
                onLoad={() => setLoadError(false)}
                onError={() => setLoadError(true)}
              />
            </div>
          </div>
          {loadError ? (
            <div className="fitai-preview-host__fallback">
              Start <code>npm run preview:dev</code> to load the copied FitAI preview.
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
