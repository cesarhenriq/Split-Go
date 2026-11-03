import { and, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { settlements } from "@/db/schema";
import type { Database } from "@/db/types";
import {
  GroupAccessError,
  lockActiveGroupMembership,
} from "@/features/groups/server/group-access";
import { lockGroupForFinancialMutation } from "@/features/groups/server/group-locks";
import { SettlementDomainError } from "@/features/settlements/server/errors";

export async function cancelSettlement(
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
        status: settlements.status,
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

    if (settlement.status !== "PENDING") {
      throw new SettlementDomainError(
        "SETTLEMENT_NOT_PENDING",
        settlement.status === "CONFIRMED"
          ? "Pagamentos confirmados não podem ser cancelados."
          : "Este pagamento já está cancelado.",
      );
    }

    const canCancel =
      settlement.paidBy === actorId || membership.role === "ADMIN";

    if (!canCancel) {
      throw new SettlementDomainError(
        "CANCEL_NOT_ALLOWED",
        "Somente o pagador ou um administrador do grupo pode cancelar este pagamento.",
      );
    }

    const updated = await tx
      .update(settlements)
      .set({
        status: "CANCELLED",
        cancelledAt: sql`now()`,
        cancelledBy: actorId,
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
