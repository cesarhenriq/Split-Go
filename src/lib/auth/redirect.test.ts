import { describe, expect, it } from "vitest";
import { isProtectedPath, shouldRedirectToLogin } from "./redirect";

describe("route protection helpers", () => {
  it("reconhece rotas protegidas exatas e aninhadas", () => {
    expect(isProtectedPath("/dashboard")).toBe(true);
    expect(isProtectedPath("/dashboard/settings")).toBe(true);
    expect(isProtectedPath("/groups/123")).toBe(true);
    expect(isProtectedPath("/invitations")).toBe(true);
    expect(isProtectedPath("/expenses")).toBe(true);
    expect(isProtectedPath("/settlements")).toBe(true);
    expect(isProtectedPath("/settings")).toBe(true);
  });

  it("não classifica rotas públicas como protegidas", () => {
    expect(isProtectedPath("/login")).toBe(false);
    expect(isProtectedPath("/register")).toBe(false);
    expect(isProtectedPath("/")).toBe(false);
  });

  it("redireciona apenas rotas protegidas sem cookie", () => {
    expect(shouldRedirectToLogin("/dashboard", false)).toBe(true);
    expect(shouldRedirectToLogin("/dashboard", true)).toBe(false);
    expect(shouldRedirectToLogin("/login", false)).toBe(false);
  });
});
