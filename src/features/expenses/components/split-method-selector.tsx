"use client";

import { cn } from "@/lib/utils";

export type SplitMethod = "EQUAL" | "PERCENTAGE" | "FIXED";

export type SplitMethodSelectorProps = {
  value: SplitMethod;
  onChange: (value: SplitMethod) => void;
  disabled?: boolean;
};

const methods: {
  value: SplitMethod;
  label: string;
  description: string;
}[] = [
  {
    value: "EQUAL",
    label: "Igualitário",
    description: "Divida o total igualmente entre os participantes.",
  },
  {
    value: "PERCENTAGE",
    label: "Porcentagem",
    description: "Defina o percentual de cada participante.",
  },
  {
    value: "FIXED",
    label: "Valores fixos",
    description: "Informe o valor individual de cada participante.",
  },
];

export function SplitMethodSelector({
  value,
  onChange,
  disabled = false,
}: SplitMethodSelectorProps) {
  return (
    <fieldset disabled={disabled}>
      <legend className="text-sm font-medium">Método de rateio</legend>
      <div className="mt-2 grid gap-2 sm:grid-cols-3">
        {methods.map((method) => (
          <label
            key={method.value}
            className={cn(
              "cursor-pointer rounded-lg border p-3 transition-colors",
              value === method.value
                ? "border-primary-500 bg-primary-50"
                : "border-border bg-surface hover:bg-surface-muted",
              disabled && "cursor-not-allowed opacity-60",
            )}
          >
            <input
              type="radio"
              name="splitMethod"
              value={method.value}
              checked={value === method.value}
              onChange={() => onChange(method.value)}
              className="sr-only"
            />
            <span className="block text-sm font-semibold">{method.label}</span>
            <span className="mt-1 block text-meta text-neutral-500">
              {method.description}
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}
