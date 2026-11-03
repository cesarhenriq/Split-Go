function readPositiveInteger(name: string, fallback: number): number {
  const raw = process.env[name]?.trim();

  if (!raw) {
    return fallback;
  }

  const parsed = Number(raw);

  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

export const rateLimitPolicy = {
  login: {
    limit: readPositiveInteger("RATE_LIMIT_LOGIN_MAX", 10),
    windowMs: readPositiveInteger("RATE_LIMIT_LOGIN_WINDOW_MS", 15 * 60 * 1000),
  },
  loginIp: {
    limit: readPositiveInteger("RATE_LIMIT_LOGIN_IP_MAX", 50),
    windowMs: readPositiveInteger(
      "RATE_LIMIT_LOGIN_IP_WINDOW_MS",
      15 * 60 * 1000,
    ),
  },
  register: {
    limit: readPositiveInteger("RATE_LIMIT_REGISTER_MAX", 20),
    windowMs: readPositiveInteger(
      "RATE_LIMIT_REGISTER_WINDOW_MS",
      60 * 60 * 1000,
    ),
  },
  invite: {
    limit: readPositiveInteger("RATE_LIMIT_INVITE_MAX", 50),
    windowMs: readPositiveInteger(
      "RATE_LIMIT_INVITE_WINDOW_MS",
      60 * 60 * 1000,
    ),
  },
} as const;

export function isRateLimitDisabled(): boolean {
  return (
    process.env.NODE_ENV !== "production" &&
    process.env.RATE_LIMIT_DISABLED === "true"
  );
}
