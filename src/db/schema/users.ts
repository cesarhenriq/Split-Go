import { sql } from "drizzle-orm";
import {
  check,
  pgTable,
  text,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { timestamps } from "./helpers";

export const users = pgTable(
  "users",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: varchar("name", { length: 255 }).notNull(),
    email: varchar("email", { length: 320 }).notNull(),
    passwordHash: text("password_hash").notNull(),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("users_email_unique").on(table.email),
    check(
      "users_email_lowercase_check",
      sql`${table.email} = lower(${table.email})`,
    ),
    check(
      "users_name_not_blank_check",
      sql`char_length(btrim(${table.name})) > 0`,
    ),
    check(
      "users_password_hash_not_blank_check",
      sql`char_length(${table.passwordHash}) > 0`,
    ),
  ],
);
