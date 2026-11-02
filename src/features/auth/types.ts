export type AuthFormState = {
  status: "idle" | "error";
  message?: string;
  fieldErrors?: Record<string, string[] | undefined>;
  values?: {
    name?: string;
    email?: string;
  };
};

export const initialAuthFormState: AuthFormState = {
  status: "idle",
};
