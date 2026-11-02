import { sql } from "drizzle-orm";
import {
  bigint,
  check,
  foreignKey,
  index,
  pgEnum,
  pgTable,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { groupMembers } from "./group-members";
import { groups } from "./groups";
import { timestamps } from "./helpers";
import { users } from "./users";

export const settlementStatus = pgEnum("settlement_status", [
  "PENDING",
  "CONFIRMED",
  "CANCELLED",
]);

export type SettlementStatus = (typeof settlementStatus.enumValues)[number];

export const settlements = pgTable(
  "settlements",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    groupId: uuid("group_id").notNull(),
    paidBy: uuid("paid_by").notNull(),
    receivedBy: uuid("received_by").notNull(),
    amount: bigint("amount", { mode: "bigint" }).notNull(),
    status: settlementStatus("status").notNull().default("PENDING"),
    paidAt: timestamp("paid_at", { withTimezone: true }).notNull(),
    confirmedAt: timestamp("confirmed_at", { withTimezone: true }),
    ...timestamps,
  },
  (table) => [
    foreignKey({
      columns: [table.groupId],
      foreignColumns: [groups.id],
      name: "settlements_group_id_groups_fk",
    }).onDelete("restrict"),
    foreignKey({
      columns: [table.paidBy],
      foreignColumns: [users.id],
      name: "settlements_paid_by_users_fk",
    }).onDelete("restrict"),
    foreignKey({
      columns: [table.receivedBy],
      foreignColumns: [users.id],
      name: "settlements_received_by_users_fk",
    }).onDelete("restrict"),
    foreignKey({
      columns: [table.groupId, table.paidBy],
      foreignColumns: [groupMembers.groupId, groupMembers.userId],
      name: "settlements_group_id_paid_by_group_members_fk",
    }).onDelete("restrict"),
    foreignKey({
      columns: [table.groupId, table.receivedBy],
      foreignColumns: [groupMembers.groupId, groupMembers.userId],
      name: "settlements_group_id_received_by_group_members_fk",
    }).onDelete("restrict"),
    index("settlements_group_id_status_idx").on(table.groupId, table.status),
    index("settlements_group_id_created_at_idx").on(
      table.groupId,
      table.createdAt,
    ),
    index("settlements_paid_by_idx").on(table.paidBy),
    index("settlements_received_by_idx").on(table.receivedBy),
    index("settlements_group_id_paid_by_idx").on(table.groupId, table.paidBy),
    index("settlements_group_id_received_by_idx").on(
      table.groupId,
      table.receivedBy,
    ),
    check("settlements_amount_positive_check", sql`${table.amount} > 0`),
    check(
      "settlements_distinct_users_check",
      sql`${table.paidBy} <> ${table.receivedBy}`,
    ),
    check(
      "settlements_confirmation_consistency_check",
      sql`(${table.status} = 'CONFIRMED' AND ${table.confirmedAt} IS NOT NULL) OR (${table.status} <> 'CONFIRMED' AND ${table.confirmedAt} IS NULL)`,
    ),
    check(
      "settlements_confirmed_after_paid_check",
      sql`${table.confirmedAt} IS NULL OR ${table.confirmedAt} >= ${table.paidAt}`,
    ),
  ],
);
