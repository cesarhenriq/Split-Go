import { sql } from "drizzle-orm";
import {
  check,
  foreignKey,
  index,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { groups } from "./groups";
import { timestamps } from "./helpers";
import { users } from "./users";

export const groupInvitationStatus = pgEnum("group_invitation_status", [
  "PENDING",
  "ACCEPTED",
  "DECLINED",
  "EXPIRED",
]);

export type GroupInvitationStatus =
  (typeof groupInvitationStatus.enumValues)[number];

export const groupInvitations = pgTable(
  "group_invitations",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    groupId: uuid("group_id").notNull(),
    email: varchar("email", { length: 320 }).notNull(),
    invitedBy: uuid("invited_by").notNull(),
    tokenHash: text("token_hash").notNull(),
    status: groupInvitationStatus("status").notNull().default("PENDING"),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    respondedAt: timestamp("responded_at", { withTimezone: true }),
    ...timestamps,
  },
  (table) => [
    foreignKey({
      columns: [table.groupId],
      foreignColumns: [groups.id],
      name: "group_invitations_group_id_groups_fk",
    }).onDelete("restrict"),
    foreignKey({
      columns: [table.invitedBy],
      foreignColumns: [users.id],
      name: "group_invitations_invited_by_users_fk",
    }).onDelete("restrict"),
    uniqueIndex("group_invitations_token_hash_unique").on(table.tokenHash),
    uniqueIndex("group_invitations_pending_group_email_unique")
      .on(table.groupId, table.email)
      .where(sql`${table.status} = 'PENDING'`),
    index("group_invitations_group_id_idx").on(table.groupId),
    index("group_invitations_email_idx").on(table.email),
    index("group_invitations_invited_by_idx").on(table.invitedBy),
    index("group_invitations_status_expires_at_idx").on(
      table.status,
      table.expiresAt,
    ),
    check(
      "group_invitations_email_lowercase_check",
      sql`${table.email} = lower(${table.email})`,
    ),
    check(
      "group_invitations_token_hash_not_blank_check",
      sql`char_length(${table.tokenHash}) > 0`,
    ),
    check(
      "group_invitations_expires_after_created_check",
      sql`${table.expiresAt} > ${table.createdAt}`,
    ),
    check(
      "group_invitations_response_consistency_check",
      sql`(${table.status} IN ('ACCEPTED', 'DECLINED') AND ${table.respondedAt} IS NOT NULL) OR (${table.status} IN ('PENDING', 'EXPIRED') AND ${table.respondedAt} IS NULL)`,
    ),
    check(
      "group_invitations_responded_after_created_check",
      sql`${table.respondedAt} IS NULL OR ${table.respondedAt} >= ${table.createdAt}`,
    ),
  ],
);
