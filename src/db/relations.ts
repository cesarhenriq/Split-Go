import { defineRelations } from "drizzle-orm";
import {
  expenseSplits,
  expenses,
  groupInvitations,
  groupMembers,
  groups,
  sessions,
  settlements,
  users,
} from "./schema";

export const relations = defineRelations(
  {
    users,
    groups,
    groupMembers,
    groupInvitations,
    expenses,
    expenseSplits,
    sessions,
    settlements,
  },
  (r) => ({
    users: {
      createdGroups: r.many.groups({
        from: r.users.id,
        to: r.groups.createdBy,
      }),
      memberships: r.many.groupMembers({
        from: r.users.id,
        to: r.groupMembers.userId,
      }),
      invitationsSent: r.many.groupInvitations({
        from: r.users.id,
        to: r.groupInvitations.invitedBy,
      }),
      expensesPaid: r.many.expenses({
        from: r.users.id,
        to: r.expenses.paidBy,
      }),
      expenseSplits: r.many.expenseSplits({
        from: r.users.id,
        to: r.expenseSplits.userId,
      }),
      settlementsPaid: r.many.settlements({
        from: r.users.id,
        to: r.settlements.paidBy,
      }),
      settlementsReceived: r.many.settlements({
        from: r.users.id,
        to: r.settlements.receivedBy,
      }),
      sessions: r.many.sessions({
        from: r.users.id,
        to: r.sessions.userId,
      }),
    },
    groups: {
      creator: r.one.users({
        from: r.groups.createdBy,
        to: r.users.id,
      }),
      members: r.many.groupMembers({
        from: r.groups.id,
        to: r.groupMembers.groupId,
      }),
      invitations: r.many.groupInvitations({
        from: r.groups.id,
        to: r.groupInvitations.groupId,
      }),
      expenses: r.many.expenses({
        from: r.groups.id,
        to: r.expenses.groupId,
      }),
      settlements: r.many.settlements({
        from: r.groups.id,
        to: r.settlements.groupId,
      }),
    },
    groupMembers: {
      group: r.one.groups({
        from: r.groupMembers.groupId,
        to: r.groups.id,
      }),
      user: r.one.users({
        from: r.groupMembers.userId,
        to: r.users.id,
      }),
    },
    groupInvitations: {
      group: r.one.groups({
        from: r.groupInvitations.groupId,
        to: r.groups.id,
      }),
      inviter: r.one.users({
        from: r.groupInvitations.invitedBy,
        to: r.users.id,
      }),
    },
    expenses: {
      group: r.one.groups({
        from: r.expenses.groupId,
        to: r.groups.id,
      }),
      payer: r.one.users({
        from: r.expenses.paidBy,
        to: r.users.id,
      }),
      splits: r.many.expenseSplits({
        from: r.expenses.id,
        to: r.expenseSplits.expenseId,
      }),
    },
    expenseSplits: {
      expense: r.one.expenses({
        from: r.expenseSplits.expenseId,
        to: r.expenses.id,
      }),
      user: r.one.users({
        from: r.expenseSplits.userId,
        to: r.users.id,
      }),
    },
    sessions: {
      user: r.one.users({
        from: r.sessions.userId,
        to: r.users.id,
      }),
    },
    settlements: {
      group: r.one.groups({
        from: r.settlements.groupId,
        to: r.groups.id,
      }),
      payer: r.one.users({
        from: r.settlements.paidBy,
        to: r.users.id,
      }),
      receiver: r.one.users({
        from: r.settlements.receivedBy,
        to: r.users.id,
      }),
    },
  }),
);
