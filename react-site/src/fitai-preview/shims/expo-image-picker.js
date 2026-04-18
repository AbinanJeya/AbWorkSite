export async function requestCameraPermissionsAsync() {
  return { status: 'denied' };
}

export async function requestMediaLibraryPermissionsAsync() {
  return { status: 'denied' };
}

export async function launchCameraAsync() {
  return { canceled: true, assets: [] };
}

export async function launchImageLibraryAsync() {
  return { canceled: true, assets: [] };
}
