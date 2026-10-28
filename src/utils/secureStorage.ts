import * as SecureStore from 'expo-secure-store';

// Enveloppe SecureStore : une erreur de stockage ne doit jamais faire planter l'app.

export async function saveItem(key: string, value: string | null): Promise<void> {
  try {
    if (value === null) {
      await SecureStore.deleteItemAsync(key);
    } else {
      await SecureStore.setItemAsync(key, value);
    }
  } catch {
    // stockage indisponible : on continue sans persistance
  }
}

export async function loadItem(key: string): Promise<string | null> {
  try {
    return await SecureStore.getItemAsync(key);
  } catch {
    return null;
  }
}
