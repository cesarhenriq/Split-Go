import { describe, expect, it } from "vitest";
import {
  calculateEqualSplit,
  calculateFixedSplit,
  calculatePercentageSplit,
  calculatePercentageSplitFromBasisPoints,
} from "./split-calculator";

const participants = (ids: string[]) =>
  ids
    .map((userId) => ({ userId }))
    .sort((a, b) => a.userId.localeCompare(b.userId));

describe("calculateEqualSplit", () => {
  it("divide 100 centavos entre 3 participantes", () => {
    const result = calculateEqualSplit(100n, participants(["c", "a", "b"]));

    expect(result).toEqual([
      { userId: "a", shareAmount: 34n, percentage: null },
      { userId: "b", shareAmount: 33n, percentage: null },
      { userId: "c", shareAmount: 33n, percentage: null },
    ]);
    expect(result.reduce((total, share) => total + share.shareAmount, 0n)).toBe(
      100n,
    );
  });

  it("distribui o resto deterministicamente por userId", () => {
    const result = calculateEqualSplit(5n, participants(["b", "a", "c"]));

    expect(result.map((share) => share.shareAmount)).toEqual([2n, 2n, 1n]);
  });

  it("divide 1 centavo entre 3 participantes sem perder centavos", () => {
    const result = calculateEqualSplit(1n, participants(["a", "b", "c"]));

    expect(result.map((share) => share.shareAmount)).toEqual([1n, 0n, 0n]);
    expect(result.reduce((total, share) => total + share.shareAmount, 0n)).toBe(
      1n,
    );
  });

  it("rejeita participantes duplicados", () => {
    expect(() =>
      calculateEqualSplit(100n, [{ userId: "a" }, { userId: "a" }]),
    ).toThrow("aparece mais de uma vez");
  });

  it("rejeita lista vazia", () => {
    expect(() => calculateEqualSplit(100n, [])).toThrow(
      "pelo menos um participante",
    );
  });
});

describe("calculatePercentageSplit", () => {
  it("calcula percentuais simples", () => {
    const result = calculatePercentageSplit(100n, [
      { userId: "a", percentage: 60 },
      { userId: "b", percentage: 40 },
    ]);

    expect(result).toEqual([
      { userId: "a", shareAmount: 60n, percentage: 60 },
      { userId: "b", shareAmount: 40n, percentage: 40 },
    ]);
  });

  it("distribui a sobra de arredondamento pelo maior resto", () => {
    const result = calculatePercentageSplit(100n, [
      { userId: "c", percentage: 33.34 },
      { userId: "a", percentage: 33.33 },
      { userId: "b", percentage: 33.33 },
    ]);

    expect(result).toEqual([
      { userId: "a", shareAmount: 33n, percentage: 33.33 },
      { userId: "b", shareAmount: 33n, percentage: 33.33 },
      { userId: "c", shareAmount: 34n, percentage: 33.34 },
    ]);
    expect(result.reduce((total, share) => total + share.shareAmount, 0n)).toBe(
      100n,
    );
  });

  it("rejeita soma de percentuais diferente de 100", () => {
    expect(() =>
      calculatePercentageSplit(100n, [
        { userId: "a", percentage: 50 },
        { userId: "b", percentage: 40 },
      ]),
    ).toThrow("exatamente 100%");
  });

  it("rejeita percentual com mais de duas casas decimais", () => {
    expect(() =>
      calculatePercentageSplit(100n, [
        { userId: "a", percentage: 33.333 },
        { userId: "b", percentage: 66.667 },
      ]),
    ).toThrow("duas casas decimais");
  });

  it("rejeita percentual zero", () => {
    expect(() =>
      calculatePercentageSplit(100n, [
        { userId: "a", percentage: 0 },
        { userId: "b", percentage: 100 },
      ]),
    ).toThrow("maior que zero");
  });

  it("permite parcela zero em total de 1 centavo", () => {
    const result = calculatePercentageSplit(1n, [
      { userId: "a", percentage: 50 },
      { userId: "b", percentage: 50 },
    ]);

    expect(result.map((share) => share.shareAmount)).toEqual([1n, 0n]);
    expect(result.reduce((total, share) => total + share.shareAmount, 0n)).toBe(
      1n,
    );
  });
});

describe("calculatePercentageSplitFromBasisPoints", () => {
  it("calcula percentuais sem depender de floats", () => {
    const result = calculatePercentageSplitFromBasisPoints(10000n, [
      { userId: "a", basisPoints: 5000 },
      { userId: "b", basisPoints: 3000 },
      { userId: "c", basisPoints: 2000 },
    ]);

    expect(result).toEqual([
      { userId: "a", shareAmount: 5000n, percentage: 50 },
      { userId: "b", shareAmount: 3000n, percentage: 30 },
      { userId: "c", shareAmount: 2000n, percentage: 20 },
    ]);
  });

  it("distribui centavos residuais", () => {
    const result = calculatePercentageSplitFromBasisPoints(100n, [
      { userId: "a", basisPoints: 3333 },
      { userId: "b", basisPoints: 3333 },
      { userId: "c", basisPoints: 3334 },
    ]);

    expect(result.reduce((total, share) => total + share.shareAmount, 0n)).toBe(
      100n,
    );
  });

  it("rejeita soma diferente de 10000 basis points", () => {
    expect(() =>
      calculatePercentageSplitFromBasisPoints(100n, [
        { userId: "a", basisPoints: 5000 },
        { userId: "b", basisPoints: 4000 },
      ]),
    ).toThrow("exatamente 100%");
  });
});

describe("calculateFixedSplit", () => {
  it("aceita parcelas cuja soma é o total", () => {
    const result = calculateFixedSplit(100n, [
      { userId: "b", amount: 40n },
      { userId: "a", amount: 60n },
    ]);

    expect(result).toEqual([
      { userId: "a", shareAmount: 60n, percentage: null },
      { userId: "b", shareAmount: 40n, percentage: null },
    ]);
  });

  it("rejeita soma diferente do total", () => {
    expect(() =>
      calculateFixedSplit(100n, [
        { userId: "a", amount: 60n },
        { userId: "b", amount: 30n },
      ]),
    ).toThrow("igual ao valor total");
  });

  it("rejeita parcela não positiva", () => {
    expect(() =>
      calculateFixedSplit(100n, [
        { userId: "a", amount: 100n },
        { userId: "b", amount: 0n },
      ]),
    ).toThrow("maior que zero");
  });
});
