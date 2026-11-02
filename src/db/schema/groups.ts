import { sql } from "drizzle-orm";
import {
  check,
  foreignKey,
  index,
  pgTable,
  text,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { timestamps } from "./helpers";
import { users } from "./users";

export const groups = pgTable(
  "groups",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: varchar("name", { length: 120 }).notNull(),
    description: text("description"),
    createdBy: uuid("created_by").notNull(),
    ...timestamps,
  },
  (table) => [
    foreignKey({
      columns: [table.createdBy],
      foreignColumns: [users.id],
      name: "groups_created_by_users_fk",
    }).onDelete("restrict"),
    index("groups_created_by_idx").on(table.createdBy),
    check(
      "groups_name_not_blank_check",
      sql`char_length(btrim(${table.name})) > 0`,
    ),
  ],
);
