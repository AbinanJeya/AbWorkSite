function replaceAssetPaths(html, assetUrls) {
  return Object.entries(assetUrls).reduce(
    (nextHtml, [originalPath, bundledPath]) => nextHtml.replaceAll(originalPath, bundledPath),
    html
  );
}

function extractOuterHtml(doc, selector, assetUrls) {
  const markup = doc.querySelector(selector)?.outerHTML ?? '';
  return markup ? replaceAssetPaths(markup, assetUrls) : '';
}

export function extractLegacyLandingSections(legacyHtml, assetUrls) {
  if (typeof DOMParser === 'undefined') {
    return {
      featuresHtml: '',
      aiHtml: '',
      screenshotsHtml: '',
      statsHtml: '',
      downloadHtml: '',
      footerHtml: '',
    };
  }

  const doc = new DOMParser().parseFromString(legacyHtml, 'text/html');

  return {
    featuresHtml: extractOuterHtml(doc, '#features', assetUrls),
    aiHtml: extractOuterHtml(doc, '#ai', assetUrls),
    screenshotsHtml: extractOuterHtml(doc, '#screenshots', assetUrls),
    statsHtml: extractOuterHtml(doc, '.stats-banner', assetUrls),
    downloadHtml: extractOuterHtml(doc, '#download', assetUrls),
    footerHtml: extractOuterHtml(doc, '.footer', assetUrls).replace(
      'href="privacy.html"',
      'href="/privacy.html"'
    ),
  };
}
