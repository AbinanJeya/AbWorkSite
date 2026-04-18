export const DEFAULT_APP_ICON_PRESET = 'fitai-green';

export function getAppIconPresetFromAccentHex() {
  return DEFAULT_APP_ICON_PRESET;
}

export function getAppIconPresetFromVariant() {
  return DEFAULT_APP_ICON_PRESET;
}

export async function getCurrentAppIconVariant() {
  return DEFAULT_APP_ICON_PRESET;
}

export function normalizeAppIconPreset(preset) {
  return preset || DEFAULT_APP_ICON_PRESET;
}

export async function syncAppIconVariant() {}
