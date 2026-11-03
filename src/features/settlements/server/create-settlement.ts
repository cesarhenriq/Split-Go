import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { settlements } from "@/db/schema";
import type { Database } from "@/db/types";
import { getGroupBalancesForUser } from "@/features/balances/server/queries";
import {
  assertActiveGroupMembers,
  GroupAccessError,
  lockActiveGroupMembership,
} from "@/features/groups/server/group-access";
import { lockGroupForFinancialMutation } from "@/features/groups/server/group-locks";
import { SettlementDomainError } from "@/features/settlements/server/errors";

export type CreateSettlementInput = {
  groupId: string;
  actorId: string;
  receivedBy: string;
  amount: bigint;
  paidAt: Date;
};

export async function createSettlement(
  input: CreateSettlementInput,
  database: Database = db,
): Promise<{ id: string }> {
  if (input.amount <= 0n) {
    throw new SettlementDomainError(
      "INVALID_AMOUNT",
      "O valor do pagamento deve ser maior que zero.",
    );
  }

  if (
    Number.isNaN(input.paidAt.getTime()) ||
    input.paidAt.getTime() > Date.now()
  ) {
    throw new SettlementDomainError(
      "INVALID_DATE",
      "Informe uma data de pagamento válida e que não esteja no futuro.",
    );
  }

  return database.transaction(async (tx) => {
    await lockGroupForFinancialMutation(tx, input.groupId);

    const membership = await lockActiveGroupMembership(
      tx,
      input.groupId,
      input.actorId,
    );

    if (!membership) {
      throw new GroupAccessError(
        "GROUP_MEMBER_REQUIRED",
        "Você não participa deste grupo.",
      );
    }

    if (input.actorId === input.receivedBy) {
      throw new SettlementDomainError(
        "SELF_PAYMENT",
        "O pagador e o destinatário devem ser pessoas diferentes.",
      );
    }

    await assertActiveGroupMembers(tx, input.groupId, [
      input.actorId,
      input.receivedBy,
    ]);

    const balances = await getGroupBalancesForUser(
      input.groupId,
      input.actorId,
      tx,
    );

    if (!balances) {
      throw new GroupAccessError(
        "GROUP_MEMBER_REQUIRED",
        "Você não participa deste grupo.",
      );
    }

    const payer = balances.members.find(
      (member) => member.userId === input.actorId,
    );
    const receiver = balances.members.find(
      (member) => member.userId === input.receivedBy,
    );

    if (!payer || !receiver) {
      throw new SettlementDomainError(
        "INSUFFICIENT_BALANCE",
        "Não há saldo disponível para este pagamento.",
      );
    }

    const pendingRows = await tx
      .select({
        paidBy: settlements.paidBy,
        receivedBy: settlements.receivedBy,
        amount: settlements.amount,
      })
      .from(settlements)
      .where(
        and(
          eq(settlements.groupId, input.groupId),
          eq(settlements.status, "PENDING"),
        ),
      );

    let pendingSent = 0n;
    let pendingReceived = 0n;

    for (const pending of pendingRows) {
      if (pending.paidBy === payer.userId) {
        pendingSent += pending.amount;
      }

      if (pending.receivedBy === receiver.userId) {
        pendingReceived += pending.amount;
      }
    }

    const availableToPay =
      payer.balance < 0n ? -payer.balance - pendingSent : 0n;
    const availableToReceive =
      receiver.balance > 0n ? receiver.balance - pendingReceived : 0n;

    if (
      availableToPay <= 0n ||
      availableToReceive <= 0n ||
      input.amount > availableToPay ||
      input.amount > availableToReceive
    ) {
      throw new SettlementDomainError(
        "INSUFFICIENT_BALANCE",
        "O valor informado ultrapassa o saldo disponível para pagamento ou recebimento.",
      );
    }

    const [settlement] = await tx
      .insert(settlements)
      .values({
        groupId: input.groupId,
        paidBy: input.actorId,
        receivedBy: input.receivedBy,
        amount: input.amount,
        status: "PENDING",
        paidAt: input.paidAt,
      })
      .returning({ id: settlements.id });

    return { id: settlement.id };
  });
}
