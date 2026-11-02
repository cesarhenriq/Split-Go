type PostgresErrorLike = {
  code?: string;
  constraint?: string;
  cause?: unknown;
};

export function isPostgresUniqueViolation(
  error: unknown,
  constraint?: string,
): boolean {
  let current: unknown = error;

  for (let depth = 0; depth < 6 && current; depth += 1) {
    if (typeof current !== "object" || current === null) {
      return false;
    }

    const candidate = current as PostgresErrorLike;

    if (
      candidate.code === "23505" &&
      (!constraint || candidate.constraint === constraint)
    ) {
      return true;
    }

    current = candidate.cause;
  }

  return false;
}
