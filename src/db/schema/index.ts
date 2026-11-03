export * from "./expense-splits";
export * from "./expenses";
export * from "./group-invitations";
export * from "./group-members";
export * from "./groups";
export * from "./rate-limits";
export * from "./sessions";
export * from "./settlements";
export * from "./users";

import type { expenseSplits } from "./expense-splits";
import type { expenses } from "./expenses";
import type { groupInvitations } from "./group-invitations";
import type { groupMembers } from "./group-members";
import type { groups } from "./groups";
import type { sessions } from "./sessions";
import type { settlements } from "./settlements";
import type { users } from "./users";

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

export type Group = typeof groups.$inferSelect;
export type NewGroup = typeof groups.$inferInsert;

export type GroupMember = typeof groupMembers.$inferSelect;
export type NewGroupMember = typeof groupMembers.$inferInsert;

export type GroupInvitation = typeof groupInvitations.$inferSelect;
export type NewGroupInvitation = typeof groupInvitations.$inferInsert;

export type Expense = typeof expenses.$inferSelect;
export type NewExpense = typeof expenses.$inferInsert;

export type ExpenseSplit = typeof expenseSplits.$inferSelect;
export type NewExpenseSplit = typeof expenseSplits.$inferInsert;

export type Settlement = typeof settlements.$inferSelect;
export type NewSettlement = typeof settlements.$inferInsert;

export type Session = typeof sessions.$inferSelect;
export type NewSession = typeof sessions.$inferInsert;
