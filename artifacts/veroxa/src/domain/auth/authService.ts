import type { AuthResult, AuthUser, Credentials, Session } from "./types";
import type { AppRole } from "@/domain/users/permissions";

/** Simulated auth users. Demo only — never used for real access decisions. */
const demoUsers: ReadonlyArray<AuthUser & { password: string }> = [
  { id: "u-owner",    name: "Veroxa Owner",   email: "owner@veroxa.demo",    role: "owner",    password: "demo" },
  { id: "u-operator", name: "Veroxa Ops",     email: "ops@veroxa.demo",      role: "operator", password: "demo" },
  { id: "u-team",     name: "Veroxa Team",    email: "team@veroxa.demo",     role: "team",     password: "demo" },
  { id: "u-client",   name: "Demo Client",    email: "client@veroxa.demo",   role: "client",   password: "demo", clientId: "rest-001" },
];

const ONE_HOUR = 60 * 60 * 1000;

function makeSession(user: AuthUser): Session {
  const now = Date.now();
  return {
    user,
    issuedAt:  new Date(now).toISOString(),
    expiresAt: new Date(now + ONE_HOUR).toISOString(),
    token:     `demo-${user.id}-${now.toString(36)}`,
  };
}

/**
 * Demo-only authentication. Never call real providers from here.
 * Future: swap body for Clerk / NextAuth / Auth.js without changing callers.
 */
export const AuthService = {
  login({ email, password }: Credentials): AuthResult {
    const u = demoUsers.find((x) => x.email === email && x.password === password);
    if (!u) return { ok: false, reason: "invalid_credentials" };
    const { password: _pw, ...user } = u;
    return { ok: true, session: makeSession(user) };
  },
  logout(_session: Session | null): void {
    // no-op in demo
  },
  refresh(session: Session): AuthResult {
    if (new Date(session.expiresAt).getTime() < Date.now()) {
      return { ok: false, reason: "session_expired" };
    }
    return { ok: true, session: makeSession(session.user) };
  },
  listDemoUsers(): ReadonlyArray<AuthUser> {
    return demoUsers.map(({ password: _p, ...u }) => u);
  },
  demoUserByRole(role: AppRole): AuthUser | undefined {
    const u = demoUsers.find((x) => x.role === role);
    if (!u) return undefined;
    const { password: _p, ...user } = u;
    return user;
  },
};
