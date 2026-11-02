export type FieldErrorProps = {
  id: string;
  messages?: string[];
};

export function FieldError({ id, messages }: FieldErrorProps) {
  if (!messages?.length) {
    return null;
  }

  return (
    <p id={id} className="text-meta text-danger-600">
      {messages[0]}
    </p>
  );
}
