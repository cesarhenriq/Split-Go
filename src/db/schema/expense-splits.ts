import { sql } from "drizzle-orm";
import {
  bigint,
  check,
  foreignKey,
  index,
  numeric,
  pgTable,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { expenses } from "./expenses";
import { timestamps } from "./helpers";
import { users } from "./users";

export const expenseSplits = pgTable(
  "expense_splits",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    expenseId: uuid("expense_id").notNull(),
    userId: uuid("user_id").notNull(),
    shareAmount: bigint("share_amount", { mode: "bigint" }).notNull(),
    percentage: numeric("percentage", {
      precision: 5,
      scale: 2,
      mode: "number",
    }),
    ...timestamps,
  },
  (table) => [
    foreignKey({
      columns: [table.expenseId],
      foreignColumns: [expenses.id],
      name: "expense_splits_expense_id_expenses_fk",
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.userId],
      foreignColumns: [users.id],
      name: "expense_splits_user_id_users_fk",
    }).onDelete("restrict"),
    uniqueIndex("expense_splits_expense_id_user_id_unique").on(
      table.expenseId,
      table.userId,
    ),
    index("expense_splits_user_id_idx").on(table.userId),
    check(
      "expense_splits_share_amount_positive_check",
      sql`${table.shareAmount} > 0`,
    ),
    check(
      "expense_splits_percentage_range_check",
      sql`${table.percentage} IS NULL OR (${table.percentage} >= 0 AND ${table.percentage} <= 100)`,
    ),
  ],
);
