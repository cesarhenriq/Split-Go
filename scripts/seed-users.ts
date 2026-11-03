import "dotenv/config";
import { db } from "@/db";
import { users } from "@/db/schema";
import { hashPassword } from "@/lib/auth/password";
import { normalizeEmail } from "@/lib/validation/email";

const seedUsers = [
  { name: "Ana Silva", email: "ana@splitgo.dev" },
  { name: "Bruno Costa", email: "bruno@splitgo.dev" },
  { name: "Carla Souza", email: "carla@splitgo.dev" },
  { name: "Diego Alves", email: "diego@splitgo.dev" },
] as const;

const developmentPassword = "senha-segura-123";

async function main() {
  const configuredPassword = process.env.SEED_USER_PASSWORD;
  const isProduction = process.env.NODE_ENV === "production";

  if (isProduction && !configuredPassword) {
    throw new Error(
      "SEED_USER_PASSWORD must be defined when seeding in production.",
    );
  }

  const password = configuredPassword ?? developmentPassword;

  const existingUsers = await db.select({ email: users.email }).from(users);
  const existingEmails = new Set(existingUsers.map((user) => user.email));

  const created: string[] = [];
  const skipped: string[] = [];
  const toCreate: { name: string; email: string; passwordHash: string }[] = [];

  for (const user of seedUsers) {
    const email = normalizeEmail(user.email);

    if (existingEmails.has(email)) {
      skipped.push(email);
      continue;
    }

    toCreate.push({
      name: user.name,
      email,
      passwordHash: await hashPassword(password),
    });
    created.push(email);
  }

  if (toCreate.length > 0) {
    await db.transaction(async (tx) => {
      await tx.insert(users).values(toCreate).onConflictDoNothing();
    });
  }

  console.log("Seed de usuários concluído.");
  console.log(`Criados: ${created.length > 0 ? created.join(", ") : "nenhum"}`);
  console.log(
    `Já existentes: ${skipped.length > 0 ? skipped.join(", ") : "nenhum"}`,
  );

  if (created.length > 0) {
    console.log(
      configuredPassword
        ? "Senha dos novos usuários: definida por SEED_USER_PASSWORD."
        : `Senha de desenvolvimento dos novos usuários: ${developmentPassword}`,
    );
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
