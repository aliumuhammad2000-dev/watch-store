import { createClerkClient, verifyToken } from "@clerk/backend";
import { IdentityProvider, AuthenticatedUser } from "./identity-provider.interface.js";

export class ClerkIdentityProvider implements IdentityProvider {
  private clerkClient: ReturnType<typeof createClerkClient>;

  constructor(private secretKey: string, publishableKey?: string) {
    this.clerkClient = createClerkClient({ secretKey, publishableKey });
  }

  async verifySessionToken(token: string): Promise<AuthenticatedUser | null> {
    try {
      const payload = await verifyToken(token, {
        secretKey: this.secretKey,
      });

      if (!payload || !payload.sub) {
        return null;
      }

      const user = await this.clerkClient.users.getUser(payload.sub);
      const primaryEmail =
        user.emailAddresses.find((e) => e.id === user.primaryEmailAddressId)
          ?.emailAddress ??
        user.emailAddresses[0]?.emailAddress ??
        "";

      const fullName =
        [user.firstName, user.lastName].filter(Boolean).join(" ") || "Admin";

      return {
        userId: user.id,
        email: primaryEmail,
        name: fullName,
      };
    } catch {
      return null;
    }
  }
}
