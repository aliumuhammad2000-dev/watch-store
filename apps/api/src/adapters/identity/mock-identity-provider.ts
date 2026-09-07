import { IdentityProvider, AuthenticatedUser } from "./identity-provider.interface.js";

export class MockIdentityProvider implements IdentityProvider {
  constructor(
    private mockUser: AuthenticatedUser = {
      userId: "user_mock_admin_123",
      email: "aliumuhammad2000@gmail.com",
      name: "Aliyu Admin",
    }
  ) {}

  async verifySessionToken(token: string): Promise<AuthenticatedUser | null> {
    if (token === "dev-admin-token" || token.startsWith("mock_")) {
      return this.mockUser;
    }
    return null;
  }
}
