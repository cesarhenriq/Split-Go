import { describe, expect, it } from "vitest";
import {
  groupFormSchema,
  inviteEmailsSchema,
  inviteMembersSchema,
} from "./groups";

describe("groupFormSchema", () => {
  it("normaliza nome e descrição", () => {
    const result = groupFormSchema.parse({
      name: "  Viagem  ",
      description: "  Praia  ",
    });

    expect(result).toEqual({
      name: "Viagem",
      description: "Praia",
    });
  });

  it("transforma descrição vazia em null", () => {
    expect(
      groupFormSchema.parse({ name: "Viagem", description: "   " }).description,
    ).toBeNull();
  });

  it("rejeita nome vazio", () => {
    expect(() => groupFormSchema.parse({ name: " ", description: "" })).toThrow(
      "pelo menos 2 caracteres",
    );
  });
});

describe("inviteEmailsSchema", () => {
  it("normaliza e remove duplicados", () => {
    const result = inviteEmailsSchema.parse([
      " Ana@Example.com ",
      "ana@example.com",
      "joao@example.com",
    ]);

    expect(result).toEqual(["ana@example.com", "joao@example.com"]);
  });

  it("rejeita e-mail inválido", () => {
    expect(() => inviteEmailsSchema.parse(["invalido"])).toThrow(
      "e-mail válido",
    );
  });

  it("rejeita lista vazia", () => {
    expect(() => inviteEmailsSchema.parse([])).toThrow("pelo menos um e-mail");
  });
});

describe("inviteMembersSchema", () => {
  it("valida grupo e lista de e-mails", () => {
    const result = inviteMembersSchema.parse({
      groupId: "4afc5fab-4a31-4a89-aa0c-860a889023be",
      emails: ["a@example.com"],
    });

    expect(result.emails).toEqual(["a@example.com"]);
  });
});
