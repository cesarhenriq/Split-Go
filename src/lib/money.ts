const brlIntegerFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

const integerPattern = /^-?\d+$/;

export function parseCents(value: string | number | bigint): bigint {
  if (typeof value === "bigint") {
    return value;
  }

  if (typeof value === "number") {
    if (!Number.isSafeInteger(value)) {
      throw new Error(
        "Valores monetários em centavos devem ser inteiros seguros.",
      );
    }

    return BigInt(value);
  }

  const normalized = value.trim();

  if (!integerPattern.test(normalized)) {
    throw new Error(
      "Valores monetários em centavos devem ser inteiros sem separadores.",
    );
  }

  return BigInt(normalized);
}

export function serializeCents(cents: bigint): string {
  return cents.toString();
}

export function formatCents(cents: bigint | string): string {
  const value = typeof cents === "string" ? parseCents(cents) : cents;
  const negative = value < 0n;
  const absolute = negative ? -value : value;
  const reais = absolute / 100n;
  const centavos = (absolute % 100n).toString().padStart(2, "0");
  const formatted = brlIntegerFormatter.format(negative ? -reais : reais);

  return `${formatted},${centavos}`;
}
