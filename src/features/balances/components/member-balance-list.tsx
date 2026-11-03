import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { MemberBalance } from "@/lib/finance/finance-types";
import { formatCents } from "@/lib/money";

function formatBalance(value: bigint) {
  return value > 0n ? `+${formatCents(value)}` : formatCents(value);
}

export function MemberBalanceList({ members }: { members: MemberBalance[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Saldos individuais</CardTitle>
        <CardDescription>
          Saldo = total pago menos total devido nas despesas válidas.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full text-sm">
            <thead className="bg-surface-muted text-left text-meta text-neutral-500">
              <tr>
                <th className="px-3 py-2 font-medium">Integrante</th>
                <th className="px-3 py-2 text-right font-medium">Pagou</th>
                <th className="px-3 py-2 text-right font-medium">
                  Deveria assumir
                </th>
                <th className="px-3 py-2 text-right font-medium">Enviado</th>
                <th className="px-3 py-2 text-right font-medium">Recebido</th>
                <th className="px-3 py-2 text-right font-medium">Saldo</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {members.map((member) => (
                <tr key={member.userId}>
                  <td className="px-3 py-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-medium">{member.name}</span>
                      {!member.isActiveMember && (
                        <Badge variant="secondary">Ex-integrante</Badge>
                      )}
                    </div>
                    <span className="block text-meta text-neutral-500">
                      {member.email}
                    </span>
                  </td>
                  <td className="px-3 py-3 text-right">
                    {formatCents(member.totalPaid)}
                  </td>
                  <td className="px-3 py-3 text-right">
                    {formatCents(member.totalOwed)}
                  </td>
                  <td className="px-3 py-3 text-right">
                    {formatCents(member.totalSent)}
                  </td>
                  <td className="px-3 py-3 text-right">
                    {formatCents(member.totalReceived)}
                  </td>
                  <td
                    className={
                      member.balance > 0n
                        ? "px-3 py-3 text-right font-semibold text-success-700"
                        : member.balance < 0n
                          ? "px-3 py-3 text-right font-semibold text-danger-700"
                          : "px-3 py-3 text-right font-semibold text-neutral-500"
                    }
                  >
                    {formatBalance(member.balance)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
