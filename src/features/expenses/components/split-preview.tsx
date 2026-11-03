import type { CalculatedShare } from "@/features/expenses/lib/split-calculator";
import { formatCents, formatPercentage } from "@/lib/money";

export type SplitPreviewRow = CalculatedShare & {
  name: string;
};

export type SplitPreviewProps = {
  rows: SplitPreviewRow[];
  totalAmount: bigint | null;
  difference: bigint | null;
  error: string | null;
  valid: boolean;
};

export function SplitPreview({
  rows,
  totalAmount,
  difference,
  error,
  valid,
}: SplitPreviewProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-section-title">Prévia do rateio</h3>
        <span
          className={
            valid
              ? "text-meta font-medium text-success-700"
              : "text-meta font-medium text-danger-700"
          }
        >
          {valid ? "Válido" : "Ajuste os valores"}
        </span>
      </div>

      {error && (
        <p
          role="alert"
          className="rounded-lg border border-danger-200 bg-danger-50 px-3 py-2 text-body text-danger-800"
        >
          {error}
        </p>
      )}

      {rows.length > 0 && (
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full text-sm">
            <thead className="bg-surface-muted text-left text-meta text-neutral-500">
              <tr>
                <th className="px-3 py-2 font-medium">Participante</th>
                <th className="px-3 py-2 text-right font-medium">Percentual</th>
                <th className="px-3 py-2 text-right font-medium">Valor</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {rows.map((row) => (
                <tr key={row.userId}>
                  <td className="px-3 py-2">{row.name}</td>
                  <td className="px-3 py-2 text-right text-neutral-500">
                    {row.percentage === null
                      ? "—"
                      : formatPercentage(row.percentage)}
                  </td>
                  <td className="px-3 py-2 text-right font-medium">
                    {formatCents(row.shareAmount)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <dl className="space-y-1 text-sm">
        <div className="flex items-center justify-between">
          <dt className="text-neutral-500">Valor total</dt>
          <dd className="font-medium">
            {totalAmount === null ? "—" : formatCents(totalAmount)}
          </dd>
        </div>
        <div className="flex items-center justify-between">
          <dt className="text-neutral-500">Total distribuído</dt>
          <dd className="font-medium">
            {rows.length === 0
              ? "—"
              : formatCents(
                  rows.reduce((total, row) => total + row.shareAmount, 0n),
                )}
          </dd>
        </div>
        <div className="flex items-center justify-between">
          <dt className="text-neutral-500">Diferença</dt>
          <dd
            className={
              difference === 0n
                ? "font-medium text-success-700"
                : "font-medium text-danger-700"
            }
          >
            {difference === null ? "—" : formatCents(difference)}
          </dd>
        </div>
      </dl>
    </div>
  );
}
