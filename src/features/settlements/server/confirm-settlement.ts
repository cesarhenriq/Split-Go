import { and, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { settlements } from "@/db/schema";
import type { Database } from "@/db/types";
import { getGroupBalancesForUser } from "@/features/balances/server/queries";
import {
  GroupAccessError,
  lockActiveGroupMembership,
} from "@/features/groups/server/group-access";
import { lockGroupForFinancialMutation } from "@/features/groups/server/group-locks";
import { SettlementDomainError } from "@/features/settlements/server/errors";

export async function confirmSettlement(
  groupId: string,
  settlementId: string,
  actorId: string,
  database: Database = db,
): Promise<void> {
  await database.transaction(async (tx) => {
    await lockGroupForFinancialMutation(tx, groupId);

    const membership = await lockActiveGroupMembership(tx, groupId, actorId);

    if (!membership) {
      throw new GroupAccessError(
        "GROUP_MEMBER_REQUIRED",
        "Você não participa deste grupo.",
      );
    }

    const [settlement] = await tx
      .select({
        id: settlements.id,
        paidBy: settlements.paidBy,
        receivedBy: settlements.receivedBy,
        amount: settlements.amount,
        status: settlements.status,
        paidAt: settlements.paidAt,
      })
      .from(settlements)
      .where(
        and(eq(settlements.id, settlementId), eq(settlements.groupId, groupId)),
      )
      .limit(1)
      .for("update");

    if (!settlement) {
      throw new SettlementDomainError(
        "SETTLEMENT_NOT_FOUND",
        "Pagamento não encontrado.",
      );
    }

    if (settlement.receivedBy !== actorId) {
      throw new SettlementDomainError(
        "CONFIRM_NOT_ALLOWED",
        "Somente o destinatário pode confirmar este pagamento.",
      );
    }

    if (settlement.status !== "PENDING") {
      throw new SettlementDomainError(
        "SETTLEMENT_NOT_PENDING",
        settlement.status === "CONFIRMED"
          ? "Este pagamento já foi confirmado."
          : "Pagamentos cancelados não podem ser confirmados.",
      );
    }

    const balances = await getGroupBalancesForUser(groupId, actorId, tx);

    if (!balances) {
      throw new GroupAccessError(
        "GROUP_MEMBER_REQUIRED",
        "Você não participa deste grupo.",
      );
    }

    const payer = balances.members.find(
      (member) => member.userId === settlement.paidBy,
    );
    const receiver = balances.members.find(
      (member) => member.userId === settlement.receivedBy,
    );
    const availableToPay = payer && payer.balance < 0n ? -payer.balance : 0n;
    const availableToReceive =
      receiver && receiver.balance > 0n ? receiver.balance : 0n;

    if (
      settlement.amount > availableToPay ||
      settlement.amount > availableToReceive
    ) {
      throw new SettlementDomainError(
        "BALANCE_CHANGED",
        "Os saldos do grupo mudaram e este pagamento não pode mais ser confirmado com o valor registrado.",
      );
    }

    const updated = await tx
      .update(settlements)
      .set({
        status: "CONFIRMED",
        confirmedAt: sql`now()`,
      })
      .where(
        and(
          eq(settlements.id, settlementId),
          eq(settlements.groupId, groupId),
          eq(settlements.status, "PENDING"),
        ),
      )
      .returning({ id: settlements.id });

    if (updated.length === 0) {
      throw new SettlementDomainError(
        "SETTLEMENT_NOT_PENDING",
        "Este pagamento não está mais pendente.",
      );
    }
  });
}
