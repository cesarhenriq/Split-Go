import { sql } from "drizzle-orm";
import {
  bigint,
  check,
  date,
  foreignKey,
  index,
  pgEnum,
  pgTable,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { groupMembers } from "./group-members";
import { groups } from "./groups";
import { timestamps } from "./helpers";
import { users } from "./users";

export const expenseSplitMethod = pgEnum("expense_split_method", [
  "EQUAL",
  "PERCENTAGE",
  "FIXED",
]);

export type ExpenseSplitMethod = (typeof expenseSplitMethod.enumValues)[number];

export const expenses = pgTable(
  "expenses",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    groupId: uuid("group_id").notNull(),
    paidBy: uuid("paid_by").notNull(),
    createdBy: uuid("created_by").notNull(),
    description: varchar("description", { length: 255 }).notNull(),
    totalAmount: bigint("total_amount", { mode: "bigint" }).notNull(),
    splitMethod: expenseSplitMethod("split_method").notNull().default("EQUAL"),
    expenseDate: date("expense_date", { mode: "date" }).notNull(),
    cancelledAt: timestamp("cancelled_at", { withTimezone: true }),
    cancelledBy: uuid("cancelled_by"),
    ...timestamps,
  },
  (table) => [
    foreignKey({
      columns: [table.groupId],
      foreignColumns: [groups.id],
      name: "expenses_group_id_groups_fk",
    }).onDelete("restrict"),
    foreignKey({
      columns: [table.paidBy],
      foreignColumns: [users.id],
      name: "expenses_paid_by_users_fk",
    }).onDelete("restrict"),
    foreignKey({
      columns: [table.createdBy],
      foreignColumns: [users.id],
      name: "expenses_created_by_users_fk",
    }).onDelete("restrict"),
    foreignKey({
      columns: [table.cancelledBy],
      foreignColumns: [users.id],
      name: "expenses_cancelled_by_users_fk",
    }).onDelete("restrict"),
    foreignKey({
      columns: [table.groupId, table.paidBy],
      foreignColumns: [groupMembers.groupId, groupMembers.userId],
      name: "expenses_group_id_paid_by_group_members_fk",
    }).onDelete("restrict"),
    index("expenses_group_id_expense_date_idx").on(
      table.groupId,
      table.expenseDate,
    ),
    index("expenses_paid_by_idx").on(table.paidBy),
    index("expenses_created_by_idx").on(table.createdBy),
    index("expenses_group_id_paid_by_idx").on(table.groupId, table.paidBy),
    index("expenses_group_id_cancelled_at_idx").on(
      table.groupId,
      table.cancelledAt,
    ),
    check(
      "expenses_total_amount_positive_check",
      sql`${table.totalAmount} > 0`,
    ),
    check(
      "expenses_description_not_blank_check",
      sql`char_length(btrim(${table.description})) > 0`,
    ),
    check(
      "expenses_cancelled_consistency_check",
      sql`(${table.cancelledAt} IS NULL AND ${table.cancelledBy} IS NULL) OR (${table.cancelledAt} IS NOT NULL AND ${table.cancelledBy} IS NOT NULL)`,
    ),
    check(
      "expenses_cancelled_after_created_check",
      sql`${table.cancelledAt} IS NULL OR ${table.cancelledAt} >= ${table.createdAt}`,
    ),
  ],
);
