import type { AuthSession, UserProfile } from '../models/User.ts';

export interface IBiometricHardwareGateway {
  hasHardwareAsync(): Promise<boolean>;
  isEnrolledAsync(): Promise<boolean>;
  authenticateAsync(promptMessage: string): Promise<{ success: boolean; error?: string }>;
}

export interface ISecureTokenStorage {
  getStoredSession(): Promise<AuthSession | null>;
  saveSession(session: AuthSession): Promise<void>;
  clearSession(): Promise<void>;
}

export class BiometricAuthUseCase {
  constructor(
    private readonly biometricGateway: IBiometricHardwareGateway,
    private readonly secureStorage: ISecureTokenStorage
  ) {}

  async execute(promptMessage = 'Verify your identity to unlock GovTech portal'): Promise<{
    authenticated: boolean;
    session: AuthSession | null;
    error?: string;
  }> {
    const hasHardware = await this.biometricGateway.hasHardwareAsync();
    if (!hasHardware) {
      return { authenticated: false, session: null, error: 'NO_BIOMETRIC_HARDWARE' };
    }

    const isEnrolled = await this.biometricGateway.isEnrolledAsync();
    if (!isEnrolled) {
      return { authenticated: false, session: null, error: 'BIOMETRICS_NOT_ENROLLED' };
    }

    const authResult = await this.biometricGateway.authenticateAsync(promptMessage);
    if (!authResult.success) {
      return { authenticated: false, session: null, error: authResult.error || 'AUTH_REJECTED' };
    }

    const session = await this.secureStorage.getStoredSession();
    return {
      authenticated: true,
      session,
    };
  }
}
