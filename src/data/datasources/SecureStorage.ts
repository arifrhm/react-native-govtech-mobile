import type { ISecureTokenStorage } from '../../domain/usecases/BiometricAuthUseCase.ts';
import type { AuthSession } from '../../domain/models/User.ts';

export class SecureStorage implements ISecureTokenStorage {
  private static readonly SESSION_KEY = 'govtech_auth_session_encrypted';

  // In real React Native runtime, this wraps ExpoSecureStore (iOS Keychain / Android Keystore)
  // Here implemented with defensive fallbacks
  private inMemoryCache: AuthSession | null = null;

  async getStoredSession(): Promise<AuthSession | null> {
    if (this.inMemoryCache) {
      return this.inMemoryCache;
    }
    // In production: const raw = await SecureStore.getItemAsync(SecureStorage.SESSION_KEY);
    return null;
  }

  async saveSession(session: AuthSession): Promise<void> {
    this.inMemoryCache = session;
    // In production: await SecureStore.setItemAsync(SecureStorage.SESSION_KEY, JSON.stringify(session));
  }

  async clearSession(): Promise<void> {
    this.inMemoryCache = null;
    // In production: await SecureStore.deleteItemAsync(SecureStorage.SESSION_KEY);
  }
}
