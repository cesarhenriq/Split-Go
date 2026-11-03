import { describe, expect, it } from "vitest";
import { formatDate, formatDateTime } from "./date";

describe("formatDate", () => {
  it("mantém a data de calendário sem deslocamento de timezone", () => {
    const formatted = formatDate("2026-10-01");

    expect(formatted).toContain("2026");
    expect(formatted).toContain("out");
    expect(formatted).not.toContain("set");
  });

  it("formata timestamps completos", () => {
    expect(formatDateTime("2026-10-01T12:30:00.000Z")).toContain("2026");
  });

  it("retorna null para valores ausentes", () => {
    expect(formatDate(null)).toBeNull();
    expect(formatDateTime(undefined)).toBeNull();
  });
});
