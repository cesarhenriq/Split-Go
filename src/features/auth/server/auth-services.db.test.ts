import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { createTestDatabase, resetTestDatabase } from "@/test-utils/database";
import { authenticateUser } from "./authenticate-user";
import { EmailAlreadyInUseError, registerUser } from "./register-user";

const { client, db } = createTestDatabase();

beforeAll(async () => {
  await client.connect();
});

beforeEach(async () => {
  await resetTestDatabase(client);
});

afterAll(async () => {
  await client.end();
});

const validRegistration = {
  name: "Alice",
  email: "alice@example.com",
  password: "senha-segura-123",
};

describe("registerUser", () => {
  it("cria usuário com hash e sessão", async () => {
    const result = await registerUser(validRegistration, db);
    const stored = await client.query(
      "select password_hash from users where id = $1",
      [result.user.id],
    );

    expect(result.user).toMatchObject({
      name: "Alice",
      email: "alice@example.com",
    });
    expect(result.session.token).toEqual(expect.any(String));
    expect(stored.rows[0].password_hash).not.toBe(validRegistration.password);
    expect(stored.rows[0].password_hash.startsWith("$argon2id$")).toBe(true);
  });

  it("rejeita e-mail duplicado", async () => {
    await registerUser(validRegistration, db);

    await expect(registerUser(validRegistration, db)).rejects.toBeInstanceOf(
      EmailAlreadyInUseError,
    );
  });
});

describe("authenticateUser", () => {
  it("autentica credenciais válidas", async () => {
    const registered = await registerUser(validRegistration, db);
    const authenticated = await authenticateUser(
      "alice@example.com",
      validRegistration.password,
      db,
    );

    expect(authenticated).toMatchObject({
      id: registered.user.id,
      email: "alice@example.com",
    });
    expect(authenticated).not.toHaveProperty("passwordHash");
  });

  it("rejeita senha incorreta", async () => {
    await registerUser(validRegistration, db);

    expect(
      await authenticateUser("alice@example.com", "senha-errada", db),
    ).toBeNull();
  });

  it("rejeita e-mail inexistente", async () => {
    expect(
      await authenticateUser("missing@example.com", "senha", db),
    ).toBeNull();
  });
});
