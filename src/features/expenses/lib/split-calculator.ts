export type SplitMethod = "EQUAL" | "PERCENTAGE" | "FIXED";

export type SplitParticipant = {
  userId: string;
};

export type PercentageParticipant = SplitParticipant & {
  percentage: number;
};

export type PercentageBasisPointsParticipant = SplitParticipant & {
  basisPoints: number;
};

export type FixedParticipant = SplitParticipant & {
  amount: bigint;
};

export type CalculatedShare = {
  userId: string;
  shareAmount: bigint;
  percentage: number | null;
};

export type SplitCalculationErrorCode =
  | "INVALID_TOTAL"
  | "NO_PARTICIPANTS"
  | "DUPLICATE_PARTICIPANT"
  | "INVALID_PERCENTAGE"
  | "PERCENTAGE_PRECISION"
  | "PERCENTAGE_TOTAL"
  | "INVALID_FIXED_AMOUNT"
  | "FIXED_AMOUNT_TOTAL";

export class SplitCalculationError extends Error {
  readonly code: SplitCalculationErrorCode;

  constructor(code: SplitCalculationErrorCode, message: string) {
    super(message);
    this.name = "SplitCalculationError";
    this.code = code;
  }
}

export type SplitInput =
  | {
      method: "EQUAL";
      totalAmount: bigint;
      participants: SplitParticipant[];
    }
  | {
      method: "PERCENTAGE";
      totalAmount: bigint;
      participants: PercentageParticipant[];
    }
  | {
      method: "FIXED";
      totalAmount: bigint;
      participants: FixedParticipant[];
    };

function assertValidTotal(totalAmount: bigint) {
  if (totalAmount <= 0n) {
    throw new SplitCalculationError(
      "INVALID_TOTAL",
      "O valor total deve ser maior que zero.",
    );
  }
}

function sortParticipants<T extends SplitParticipant>(participants: T[]) {
  if (participants.length === 0) {
    throw new SplitCalculationError(
      "NO_PARTICIPANTS",
      "A despesa precisa ter pelo menos um participante.",
    );
  }

  const seen = new Set<string>();

  for (const participant of participants) {
    if (!participant.userId) {
      throw new SplitCalculationError(
        "DUPLICATE_PARTICIPANT",
        "Todos os participantes precisam ter um identificador.",
      );
    }

    if (seen.has(participant.userId)) {
      throw new SplitCalculationError(
        "DUPLICATE_PARTICIPANT",
        `O participante ${participant.userId} aparece mais de uma vez.`,
      );
    }

    seen.add(participant.userId);
  }

  return [...participants].sort((a, b) => a.userId.localeCompare(b.userId));
}

export function calculateEqualSplit(
  totalAmount: bigint,
  participants: SplitParticipant[],
): CalculatedShare[] {
  assertValidTotal(totalAmount);
  const sorted = sortParticipants(participants);
  const participantCount = BigInt(sorted.length);
  const baseShare = totalAmount / participantCount;
  const remainder = totalAmount % participantCount;

  return sorted.map((participant, index) => ({
    userId: participant.userId,
    shareAmount: baseShare + (BigInt(index) < remainder ? 1n : 0n),
    percentage: null,
  }));
}

export function calculatePercentageSplitFromBasisPoints(
  totalAmount: bigint,
  participants: PercentageBasisPointsParticipant[],
): CalculatedShare[] {
  assertValidTotal(totalAmount);
  const sorted = sortParticipants(participants);

  for (const participant of sorted) {
    if (
      !Number.isInteger(participant.basisPoints) ||
      participant.basisPoints <= 0 ||
      participant.basisPoints > 10_000
    ) {
      throw new SplitCalculationError(
        "INVALID_PERCENTAGE",
        "Cada percentual deve ser maior que zero e menor ou igual a 100.",
      );
    }
  }

  const totalBasisPoints = sorted.reduce(
    (total, participant) => total + participant.basisPoints,
    0,
  );

  if (totalBasisPoints !== 10_000) {
    throw new SplitCalculationError(
      "PERCENTAGE_TOTAL",
      "A soma dos percentuais deve ser exatamente 100%.",
    );
  }

  const calculated = sorted.map((participant) => {
    const raw = totalAmount * BigInt(participant.basisPoints);

    return {
      ...participant,
      shareAmount: raw / 10_000n,
      remainder: raw % 10_000n,
    };
  });

  let residual =
    totalAmount -
    calculated.reduce(
      (total, participant) => total + participant.shareAmount,
      0n,
    );

  const byRemainder = [...calculated].sort((a, b) => {
    if (a.remainder === b.remainder) {
      return a.userId.localeCompare(b.userId);
    }

    return a.remainder > b.remainder ? -1 : 1;
  });

  for (const participant of byRemainder) {
    if (residual === 0n) break;

    participant.shareAmount += 1n;
    residual -= 1n;
  }

  return calculated
    .map((participant) => ({
      userId: participant.userId,
      shareAmount: participant.shareAmount,
      percentage: participant.basisPoints / 100,
    }))
    .sort((a, b) => a.userId.localeCompare(b.userId));
}

export function calculatePercentageSplit(
  totalAmount: bigint,
  participants: PercentageParticipant[],
): CalculatedShare[] {
  const basisPoints = participants.map((participant) => {
    const value = participant.percentage;

    if (!Number.isFinite(value) || value <= 0 || value > 100) {
      throw new SplitCalculationError(
        "INVALID_PERCENTAGE",
        "Cada percentual deve ser maior que zero e menor ou igual a 100.",
      );
    }

    const points = value * 100;
    const rounded = Math.round(points);

    if (Math.abs(points - rounded) > 1e-9) {
      throw new SplitCalculationError(
        "PERCENTAGE_PRECISION",
        "Os percentuais devem ter no máximo duas casas decimais.",
      );
    }

    return {
      userId: participant.userId,
      basisPoints: rounded,
    };
  });

  return calculatePercentageSplitFromBasisPoints(totalAmount, basisPoints);
}

export function calculateFixedSplit(
  totalAmount: bigint,
  participants: FixedParticipant[],
): CalculatedShare[] {
  assertValidTotal(totalAmount);
  const sorted = sortParticipants(participants);

  for (const participant of sorted) {
    if (participant.amount <= 0n) {
      throw new SplitCalculationError(
        "INVALID_FIXED_AMOUNT",
        "Cada parcela fixa deve ser maior que zero.",
      );
    }
  }

  const sum = sorted.reduce(
    (total, participant) => total + participant.amount,
    0n,
  );

  if (sum !== totalAmount) {
    throw new SplitCalculationError(
      "FIXED_AMOUNT_TOTAL",
      "A soma das parcelas fixas deve ser igual ao valor total.",
    );
  }

  return sorted.map((participant) => ({
    userId: participant.userId,
    shareAmount: participant.amount,
    percentage: null,
  }));
}

export function calculateSplit(input: SplitInput): CalculatedShare[] {
  switch (input.method) {
    case "EQUAL":
      return calculateEqualSplit(input.totalAmount, input.participants);
    case "PERCENTAGE":
      return calculatePercentageSplit(input.totalAmount, input.participants);
    case "FIXED":
      return calculateFixedSplit(input.totalAmount, input.participants);
  }
}
