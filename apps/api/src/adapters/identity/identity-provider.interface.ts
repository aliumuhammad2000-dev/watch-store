export interface AuthenticatedUser {
  userId: string;
  email: string;
  name?: string;
}

export interface IdentityProvider {
  verifySessionToken(token: string): Promise<AuthenticatedUser | null>;
}
