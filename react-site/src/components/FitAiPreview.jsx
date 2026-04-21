import { useEffect, useMemo, useRef, useState } from 'react';

const PREVIEW_VIEWPORT_WIDTH = 390;
const PREVIEW_VIEWPORT_HEIGHT = 844;

function buildPreviewSrc(baseSrc, previewParams) {
  if (!previewParams || typeof previewParams !== 'object') {
    return baseSrc;
  }

  const searchParams = new URLSearchParams();

  Object.entries(previewParams).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') {
      return;
    }

    searchParams.set(key, String(value));
  });

  const queryString = searchParams.toString();
  if (!queryString) {
    return baseSrc;
  }

  return `${baseSrc}${baseSrc.includes('?') ? '&' : '?'}${queryString}`;
}

export default function FitAiPreview({
  hostClassName = '',
  previewParams = null,
  title = 'FitAI preview',
}) {
  const [loadError, setLoadError] = useState(false);
  const [scale, setScale] = useState(1);
  const hostRef = useRef(null);
  const baseUrl = import.meta.env.BASE_URL;
  const serializedPreviewParams = JSON.stringify(previewParams ?? {});
  const previewBaseSrc = `${baseUrl}fitai-preview/index.html`;
  const previewSrc = useMemo(
    () => buildPreviewSrc(previewBaseSrc, previewParams),
    [previewBaseSrc, previewParams, serializedPreviewParams]
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
      <div className="hero__phone-screen">
        <div
          className={`fitai-preview-host${hostClassName ? ` ${hostClassName}` : ''}`}
          data-fitai-preview-host
          ref={hostRef}
        >
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
                key={previewSrc}
                className="fitai-preview-host__iframe"
                title={title}
                src={previewSrc}
                scrolling="no"
                onLoad={() => setLoadError(false)}
                onError={() => setLoadError(true)}
              />
            </div>
          </div>
          {loadError ? (
            <div className="fitai-preview-host__fallback">
              Refresh the exported preview bundle to load the embedded FitAI experience.
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
