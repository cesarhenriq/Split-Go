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

export function parseAmountToCents(value: string): bigint {
  const normalized = value.trim().replace(/\s+/g, "").replace(/^R\$/i, "");

  if (!normalized) {
    throw new Error("Informe um valor monetário.");
  }

  let amount = normalized;
  const commaIndex = amount.lastIndexOf(",");

  if (commaIndex >= 0) {
    if (amount.indexOf(",") !== commaIndex) {
      throw new Error("Formato de valor monetário inválido.");
    }

    amount = amount.replace(/\./g, "").replace(",", ".");
  } else {
    const dotCount = (amount.match(/\./g) ?? []).length;

    if (dotCount > 1) {
      amount = amount.replace(/\./g, "");
    } else if (dotCount === 1) {
      const [, fraction = ""] = amount.split(".");

      if (fraction.length > 2) {
        amount = amount.replace(/\./g, "");
      }
    }
  }

  if (!/^\d+(\.\d{1,2})?$/.test(amount)) {
    throw new Error("Formato de valor monetário inválido.");
  }

  const [whole, fraction = ""] = amount.split(".");
  const cents = fraction.padEnd(2, "0");

  return BigInt(whole) * 100n + BigInt(cents);
}

export function parsePercentageToBasisPoints(value: string): number {
  const normalized = value
    .trim()
    .replace(/%/g, "")
    .replace(/\s+/g, "")
    .replace(",", ".");

  if (!/^\d+(\.\d{1,2})?$/.test(normalized)) {
    throw new Error("Formato de percentual inválido.");
  }

  const [whole, fraction = ""] = normalized.split(".");
  const basisPoints = Number(whole) * 100 + Number(fraction.padEnd(2, "0"));

  if (basisPoints < 0 || basisPoints > 10_000) {
    throw new Error("O percentual deve estar entre 0% e 100%.");
  }

  return basisPoints;
}

export function formatBasisPoints(basisPoints: number): string {
  const whole = Math.floor(basisPoints / 100);
  const fraction = (basisPoints % 100).toString().padStart(2, "0");

  return `${whole},${fraction}%`;
}

export function formatPercentage(percentage: number): string {
  return formatBasisPoints(Math.round(percentage * 100));
}

export function formatPercentageInput(percentage: number): string {
  return formatBasisPoints(Math.round(percentage * 100)).replace("%", "");
}

export function formatCentsInput(cents: bigint | string): string {
  const value = typeof cents === "string" ? parseCents(cents) : cents;
  const negative = value < 0n;
  const absolute = negative ? -value : value;
  const reais = absolute / 100n;
  const centavos = (absolute % 100n).toString().padStart(2, "0");

  return `${negative ? "-" : ""}${reais},${centavos}`;
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
