export interface UserProfile {
  id: string;
  nricMasked: string; // e.g. S****123A
  fullName: string;
  agency: string;
  role: string;
  clearanceLevel: 'CONFIDENTIAL' | 'SECRET' | 'TOP_SECRET';
  biometricEnrolled: boolean;
  assignedZoneId: string;
}

export interface AuthSession {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
  user: UserProfile;
}
