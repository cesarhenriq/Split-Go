import { sql } from "drizzle-orm";
import {
  check,
  foreignKey,
  index,
  pgEnum,
  pgTable,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { groups } from "./groups";
import { timestamps } from "./helpers";
import { users } from "./users";

export const groupMemberRole = pgEnum("group_member_role", ["ADMIN", "MEMBER"]);

export const groupMemberStatus = pgEnum("group_member_status", [
  "PENDING",
  "ACCEPTED",
  "DECLINED",
]);

export type GroupMemberRole = (typeof groupMemberRole.enumValues)[number];
export type GroupMemberStatus = (typeof groupMemberStatus.enumValues)[number];

export const groupMembers = pgTable(
  "group_members",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    groupId: uuid("group_id").notNull(),
    userId: uuid("user_id").notNull(),
    role: groupMemberRole("role").notNull().default("MEMBER"),
    status: groupMemberStatus("status").notNull().default("PENDING"),
    joinedAt: timestamp("joined_at", { withTimezone: true }),
    leftAt: timestamp("left_at", { withTimezone: true }),
    ...timestamps,
  },
  (table) => [
    foreignKey({
      columns: [table.groupId],
      foreignColumns: [groups.id],
      name: "group_members_group_id_groups_fk",
    }).onDelete("restrict"),
    foreignKey({
      columns: [table.userId],
      foreignColumns: [users.id],
      name: "group_members_user_id_users_fk",
    }).onDelete("restrict"),
    uniqueIndex("group_members_group_id_user_id_unique").on(
      table.groupId,
      table.userId,
    ),
    index("group_members_user_id_idx").on(table.userId),
    index("group_members_group_id_status_idx").on(table.groupId, table.status),
    check(
      "group_members_joined_at_consistency_check",
      sql`(${table.status} = 'ACCEPTED' AND ${table.joinedAt} IS NOT NULL) OR (${table.status} <> 'ACCEPTED' AND ${table.joinedAt} IS NULL)`,
    ),
    check(
      "group_members_left_at_consistency_check",
      sql`${table.leftAt} IS NULL OR (${table.status} = 'ACCEPTED' AND ${table.joinedAt} IS NOT NULL AND ${table.leftAt} >= ${table.joinedAt})`,
    ),
  ],
);
